package com.medsync.users.dto;

import com.medsync.users.model.Role;

import java.time.Instant;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        Instant createdAt,
        Instant updatedAt
) {
}
