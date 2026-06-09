package com.medsync.users.repository;

import com.medsync.users.model.Role;
import com.medsync.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByCpfAndDeletedAtIsNull(String cpf);

    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    boolean existsByCpfAndDeletedAtIsNull(String cpf);

    List<User> findAllByDeletedAtIsNullOrderByNameAsc();

    long countByRoleAndActiveTrueAndDeletedAtIsNull(Role role);
}
