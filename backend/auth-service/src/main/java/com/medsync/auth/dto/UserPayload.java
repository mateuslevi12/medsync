package com.medsync.auth.dto;

public record UserPayload(
        Long id,
        String name,
        String email,
        String role
) {
}
