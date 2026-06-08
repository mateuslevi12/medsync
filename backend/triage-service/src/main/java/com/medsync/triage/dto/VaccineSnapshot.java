package com.medsync.triage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VaccineSnapshot(
        @NotBlank(message = "nome da vacina é obrigatório")
        @Size(max = 80, message = "nome da vacina deve ter no máximo 80 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "nome da vacina contém caracteres inválidos")
        String name,

        @NotBlank(message = "status da vacina é obrigatório")
        @Pattern(regexp = "^(Em dia|Pendente|Desconhecido|EM_DIA|PENDENTE|DESCONHECIDO)$", message = "status da vacina é inválido")
        String status
) {
}
