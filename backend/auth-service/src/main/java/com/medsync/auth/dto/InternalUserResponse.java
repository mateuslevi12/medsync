package com.medsync.auth.dto;

public record InternalUserResponse(
        Long id,
        String name,
        String email,
        String password,
        String role
) {
}
