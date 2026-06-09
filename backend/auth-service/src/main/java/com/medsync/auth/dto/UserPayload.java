package com.medsync.auth.dto;

public record UserPayload(
        Long id,
        String name,
        String cpf,
        String email,
        String role
) {
}
