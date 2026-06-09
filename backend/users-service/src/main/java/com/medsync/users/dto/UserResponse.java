package com.medsync.users.dto;

import com.medsync.users.model.Role;

import java.time.Instant;

public record UserResponse(
        Long id,
        String name,
        String cpf,
        String email,
        Role role,
        boolean active,
        Instant lastLoginAt,
        Instant createdAt,
        Instant updatedAt
) {
}
