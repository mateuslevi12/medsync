package com.medsync.patients.dto;

import com.medsync.patients.model.AllergySeverity;
import com.medsync.patients.model.AllergyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreatePatientAllergyRequest(
        @NotNull(message = "tipo é obrigatório")
        AllergyType type,

        @NotBlank(message = "descrição é obrigatória")
        @Size(max = 120, message = "descrição deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "descrição contém caracteres inválidos")
        String description,

        @NotNull(message = "gravidade é obrigatória")
        AllergySeverity severity
) {
}
