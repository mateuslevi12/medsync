package com.medsync.auth.service;

import com.medsync.auth.client.UsersServiceClient;
import com.medsync.auth.dto.AuthResponse;
import com.medsync.auth.dto.InternalUserResponse;
import com.medsync.auth.dto.LoginRequest;
import com.medsync.auth.dto.UserPayload;
import com.medsync.auth.exception.UnauthorizedException;
import com.medsync.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsersServiceClient usersServiceClient;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        String login = request.login().trim();
        InternalUserResponse user = login.contains("@")
                ? usersServiceClient.findByEmail(login.toLowerCase())
                : usersServiceClient.findByCpf(normalizeCpf(login));

        if (user == null || !passwordEncoder.matches(request.password(), user.password())) {
            throw new UnauthorizedException("E-mail ou senha inválidos");
        }

        if (!user.active()) {
            throw new UnauthorizedException("Usuário inativo. Procure um administrador.");
        }

        usersServiceClient.registerSuccessfulLogin(user.email());

        String token = jwtService.generateToken(user.id(), user.name(), user.email(), user.role());

        return new AuthResponse(
                token,
                "Bearer",
                new UserPayload(user.id(), user.name(), user.cpf(), user.email(), user.role())
        );
    }

    public UserPayload me(String email) {
        InternalUserResponse user = usersServiceClient.findByEmail(email);
        return new UserPayload(user.id(), user.name(), user.cpf(), user.email(), user.role());
    }

    private String normalizeCpf(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }
}
