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
        InternalUserResponse user = usersServiceClient.findByEmail(request.email().toLowerCase().trim());

        if (user == null || !passwordEncoder.matches(request.password(), user.password())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.id(), user.name(), user.email(), user.role());

        return new AuthResponse(
                token,
                "Bearer",
                new UserPayload(user.id(), user.name(), user.email(), user.role())
        );
    }

    public UserPayload me(String email) {
        InternalUserResponse user = usersServiceClient.findByEmail(email);
        return new UserPayload(user.id(), user.name(), user.email(), user.role());
    }
}
