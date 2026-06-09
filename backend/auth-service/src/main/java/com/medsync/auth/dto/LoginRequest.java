package com.medsync.auth.dto;

import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonAlias;

public record LoginRequest(
        @NotBlank(message = "CPF ou e-mail é obrigatório")
        @JsonAlias("email")
        String login,

        @NotBlank(message = "senha é obrigatória")
        String password
) {
}
