package com.medsync.medicalrecords.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record AllergySnapshotDto(
        @NotBlank(message = "tipo da alergia é obrigatório")
        @Size(max = 50, message = "tipo da alergia deve ter no máximo 50 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "tipo da alergia contém caracteres inválidos")
        String type,

        @NotBlank(message = "descrição da alergia é obrigatória")
        @Size(max = 120, message = "descrição da alergia deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "descrição da alergia contém caracteres inválidos")
        String description,

        @Size(max = 30, message = "gravidade da alergia deve ter no máximo 30 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "gravidade da alergia contém caracteres inválidos")
        String severity,

        Instant createdAt
) {
}
