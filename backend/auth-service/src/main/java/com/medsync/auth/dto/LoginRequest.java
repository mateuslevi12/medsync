package com.medsync.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "e-mail é obrigatório")
        @Email(message = "e-mail deve ser válido")
        String email,

        @NotBlank(message = "senha é obrigatória")
        String password
) {
}
