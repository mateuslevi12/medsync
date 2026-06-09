package com.medsync.auth.dto;

public record InternalUserResponse(
        Long id,
        String name,
        String cpf,
        String email,
        String password,
        String role,
        boolean active,
        java.time.Instant lastLoginAt
) {
}
