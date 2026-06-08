package com.medsync.users.dto;

import com.medsync.users.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank(message = "nome é obrigatório")
        @Size(max = 120, message = "nome deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[\\p{L}](?:[\\p{L}\\s'’-]*[\\p{L}])?$", message = "nome contém caracteres inválidos")
        String name,

        @NotBlank(message = "e-mail é obrigatório")
        @Email(message = "e-mail deve ser válido")
        @Size(max = 120, message = "e-mail deve ter no máximo 120 caracteres")
        String email,

        @Size(min = 6, max = 72, message = "senha deve ter entre 6 e 72 caracteres")
        String password,

        @NotNull(message = "perfil é obrigatório")
        Role role
) {
}
