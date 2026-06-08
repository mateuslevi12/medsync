package com.medsync.medicalrecords.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Map;

public record InternalFlowEventRequest(
        @NotBlank(message = "eventId é obrigatório")
        String eventId,

        @NotBlank(message = "eventType é obrigatório")
        String eventType,

        @NotNull(message = "patientId é obrigatório")
        Long patientId,

        Long attendanceId,

        @Size(max = 150, message = "nome do paciente deve ter no máximo 150 caracteres")
        String patientName,

        @Size(max = 160, message = "título deve ter no máximo 160 caracteres")
        String title,

        @Size(max = 500, message = "descrição deve ter no máximo 500 caracteres")
        String description,

        @Size(max = 120, message = "sourceService deve ter no máximo 120 caracteres")
        String sourceService,

        Instant occurredAt,
        Map<String, Object> metadata
) {
}
