package com.medsync.users.dto;

import com.medsync.users.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "nome é obrigatório")
        @Size(max = 120, message = "nome deve ter no máximo 120 caracteres")
        String name,

        @NotBlank(message = "e-mail é obrigatório")
        @Email(message = "e-mail deve ser válido")
        @Size(max = 180, message = "e-mail deve ter no máximo 180 caracteres")
        String email,

        @NotBlank(message = "senha é obrigatória")
        @Size(min = 6, max = 100, message = "senha deve ter entre 6 e 100 caracteres")
        String password,

        @NotNull(message = "perfil é obrigatório")
        Role role
) {
}
