package com.medsync.medicalrecords.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record VaccineSnapshotDto(
        @NotBlank(message = "nome da vacina é obrigatório")
        @Size(max = 80, message = "nome da vacina deve ter no máximo 80 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "nome da vacina contém caracteres inválidos")
        String name,

        @NotBlank(message = "status da vacina é obrigatório")
        @Pattern(regexp = "^(Em dia|Pendente|Desconhecido|EM_DIA|PENDENTE|DESCONHECIDO)$", message = "status da vacina é inválido")
        String status,

        Instant applicationDate,

        @Size(max = 300, message = "observações da vacina devem ter no máximo 300 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "observações da vacina contêm caracteres inválidos")
        String notes
) {
}
