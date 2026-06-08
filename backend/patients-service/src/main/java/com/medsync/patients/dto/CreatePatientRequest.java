package com.medsync.patients.dto;

import com.medsync.patients.model.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreatePatientRequest(
        @NotBlank(message = "nome completo é obrigatório")
        @Size(max = 120, message = "nome completo deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[\\p{L}](?:[\\p{L}\\s'’-]*[\\p{L}])?$", message = "nome completo contém caracteres inválidos")
        String fullName,

        @NotNull(message = "data de nascimento é obrigatória")
        @PastOrPresent(message = "data de nascimento deve ser válida")
        LocalDate birthDate,

        @NotNull(message = "gênero é obrigatório")
        Gender gender,

        @NotBlank(message = "telefone é obrigatório")
        @Pattern(regexp = "^\\d{10,11}$", message = "telefone deve conter DDD e número")
        String phone,

        @NotBlank(message = "documento é obrigatório")
        @Pattern(regexp = "^\\d{11}$", message = "CPF deve conter 11 dígitos")
        String documentNumber,

        @Pattern(regexp = "^\\d{15}$", message = "CNS deve conter 15 dígitos")
        String cns,

        @NotBlank(message = "endereço é obrigatório")
        @Size(max = 255, message = "endereço deve ter no máximo 255 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "endereço contém caracteres inválidos")
        String address
) {
}
