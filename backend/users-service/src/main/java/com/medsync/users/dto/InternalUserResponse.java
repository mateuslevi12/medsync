package com.medsync.users.dto;

import com.medsync.users.model.Role;

public record InternalUserResponse(
        Long id,
        String name,
        String email,
        String password,
        Role role
) {
}
