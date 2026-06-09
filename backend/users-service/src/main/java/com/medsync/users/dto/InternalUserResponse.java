package com.medsync.users.dto;

import com.medsync.users.model.Role;

import java.time.Instant;

public record InternalUserResponse(
        Long id,
        String name,
        String cpf,
        String email,
        String password,
        Role role,
        boolean active,
        Instant lastLoginAt
) {
}
