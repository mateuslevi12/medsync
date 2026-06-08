package com.medsync.triage.dto;

import com.medsync.triage.model.AmbulatoryPriority;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAmbulatoryAttendanceRequest(
        @NotNull(message = "patientId é obrigatório")
        Long patientId,

        @NotBlank(message = "nome do paciente é obrigatório")
        @Size(max = 120, message = "nome do paciente deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[\\p{L}](?:[\\p{L}\\s'’-]*[\\p{L}])?$", message = "nome do paciente contém caracteres inválidos")
        String patientName,

        @NotBlank(message = "CPF do paciente é obrigatório")
        @Pattern(regexp = "^\\d{11}$", message = "CPF do paciente deve conter 11 dígitos")
        String patientCpf,

        @Pattern(regexp = "^\\d{15}$", message = "CNS do paciente deve conter 15 dígitos")
        String patientCns,

        @Pattern(regexp = "^\\d{10,11}$", message = "telefone do paciente deve conter DDD e número")
        String patientPhone,

        @Min(value = 0, message = "idade do paciente não pode ser negativa")
        @Max(value = 130, message = "idade do paciente deve ser válida")
        Integer patientAge,

        @Size(max = 60, message = "nome da fila deve ter no máximo 60 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "nome da fila contém caracteres inválidos")
        String queueName,

        AmbulatoryPriority priority
) {
}
