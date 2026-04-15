package com.medsync.auth.dto;

public record AuthResponse(
        String token,
        String type,
        UserPayload user
) {
}
