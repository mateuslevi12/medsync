package com.medsync.patients.dto;

import com.medsync.patients.model.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreatePatientRequest(
        @NotBlank(message = "nome completo é obrigatório")
        @Size(max = 150, message = "nome completo deve ter no máximo 150 caracteres")
        String fullName,

        @NotNull(message = "data de nascimento é obrigatória")
        @Past(message = "data de nascimento deve ser no passado")
        LocalDate birthDate,

        @NotNull(message = "gênero é obrigatório")
        Gender gender,

        @NotBlank(message = "telefone é obrigatório")
        @Size(max = 30, message = "telefone deve ter no máximo 30 caracteres")
        String phone,

        @NotBlank(message = "documento é obrigatório")
        @Size(max = 50, message = "documento deve ter no máximo 50 caracteres")
        String documentNumber,

        @NotBlank(message = "endereço é obrigatório")
        @Size(max = 255, message = "endereço deve ter no máximo 255 caracteres")
        String address
) {
}
