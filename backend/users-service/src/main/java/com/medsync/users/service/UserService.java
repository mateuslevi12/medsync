package com.medsync.users.service;

import com.medsync.users.dto.CreateUserRequest;
import com.medsync.users.dto.InternalUserResponse;
import com.medsync.users.dto.UpdateUserStatusRequest;
import com.medsync.users.dto.UpdateUserRequest;
import com.medsync.users.dto.UserResponse;
import com.medsync.users.exception.ConflictException;
import com.medsync.users.exception.NotFoundException;
import com.medsync.users.model.Role;
import com.medsync.users.model.User;
import com.medsync.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse create(CreateUserRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        String normalizedCpf = normalizeCpf(request.cpf());

        if (userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(normalizedEmail)) {
            throw new ConflictException("E-mail já cadastrado");
        }
        if (userRepository.existsByCpfAndDeletedAtIsNull(normalizedCpf)) {
            throw new ConflictException("CPF já cadastrado");
        }

        User user = User.builder()
                .name(request.name().trim())
                .cpf(normalizedCpf)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
                .active(Boolean.TRUE.equals(request.active()))
                .role(request.role())
                .build();

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public List<UserResponse> findAll() {
        return userRepository.findAllByDeletedAtIsNullOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse findById(Long id) {
        User user = findManagedUser(id);
        return toResponse(user);
    }

    public UserResponse update(String currentUserEmail, Long id, UpdateUserRequest request) {
        User user = findManagedUser(id);

        String normalizedEmail = request.email().trim().toLowerCase();
        String normalizedCpf = normalizeCpf(request.cpf());
        if (!user.getEmail().equalsIgnoreCase(normalizedEmail)
                && userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(normalizedEmail)) {
            throw new ConflictException("E-mail já cadastrado");
        }
        if ((user.getCpf() == null || !user.getCpf().equals(normalizedCpf))
                && userRepository.existsByCpfAndDeletedAtIsNull(normalizedCpf)) {
            throw new ConflictException("CPF já cadastrado");
        }

        ensureCanChangeOwnAccess(currentUserEmail, user, Boolean.TRUE.equals(request.active()));
        ensureActiveAdminWillRemain(user, request.role(), Boolean.TRUE.equals(request.active()));
        user.setName(request.name().trim());
        user.setCpf(normalizedCpf);
        user.setEmail(normalizedEmail);
        user.setRole(request.role());
        user.setActive(Boolean.TRUE.equals(request.active()));

        if (StringUtils.hasText(request.password())) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        User updated = userRepository.save(user);
        return toResponse(updated);
    }

    public UserResponse updateStatus(String currentUserEmail, Long id, UpdateUserStatusRequest request) {
        User user = findManagedUser(id);
        boolean nextActive = Boolean.TRUE.equals(request.active());

        ensureCanChangeOwnAccess(currentUserEmail, user, nextActive);
        ensureActiveAdminWillRemain(user, user.getRole(), nextActive);

        user.setActive(nextActive);
        User updated = userRepository.save(user);
        return toResponse(updated);
    }

    public void delete(String currentUserEmail, Long id) {
        User user = findManagedUser(id);

        ensureCanChangeOwnAccess(currentUserEmail, user, false);
        ensureActiveAdminWillRemain(user, user.getRole(), false);

        user.setActive(false);
        user.setDeletedAt(Instant.now());
        user.setEmail(buildDeletedEmail(user.getEmail(), user.getId()));
        userRepository.save(user);
    }

    public void registerSuccessfulLogin(String email) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
    }

    public InternalUserResponse findByEmailForInternalAuth(String email) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        return new InternalUserResponse(
                user.getId(),
                user.getName(),
                user.getCpf(),
                user.getEmail(),
                user.getPassword(),
                user.getRole(),
                user.isActive(),
                user.getLastLoginAt()
        );
    }

    public InternalUserResponse findByCpfForInternalAuth(String cpf) {
        User user = userRepository.findByCpfAndDeletedAtIsNull(normalizeCpf(cpf))
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        return new InternalUserResponse(
                user.getId(),
                user.getName(),
                user.getCpf(),
                user.getEmail(),
                user.getPassword(),
                user.getRole(),
                user.isActive(),
                user.getLastLoginAt()
        );
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getCpf(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private User findManagedUser(Long id) {
        return userRepository.findById(id)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
    }

    private void ensureCanChangeOwnAccess(String currentUserEmail, User targetUser, boolean nextActive) {
        if (!targetUser.getEmail().equalsIgnoreCase(currentUserEmail) || nextActive) {
            return;
        }

        throw new AccessDeniedException("Você não pode inativar ou remover a própria conta.");
    }

    private void ensureActiveAdminWillRemain(User currentUser, Role nextRole, boolean nextActive) {
        boolean currentlyActiveAdmin = currentUser.getRole() == Role.ADMIN && currentUser.isActive();
        boolean willRemainActiveAdmin = nextRole == Role.ADMIN && nextActive;

        if (!currentlyActiveAdmin || willRemainActiveAdmin) {
            return;
        }

        long activeAdmins = userRepository.countByRoleAndActiveTrueAndDeletedAtIsNull(Role.ADMIN);
        if (activeAdmins <= 1) {
            throw new AccessDeniedException("Não é permitido deixar o sistema sem nenhum administrador ativo.");
        }
    }

    private String buildDeletedEmail(String email, Long userId) {
        String base = email == null ? "usuario" : email.trim().toLowerCase();
        return base + ".deleted." + userId + "." + Instant.now().toEpochMilli();
    }

    private String normalizeCpf(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }
}
