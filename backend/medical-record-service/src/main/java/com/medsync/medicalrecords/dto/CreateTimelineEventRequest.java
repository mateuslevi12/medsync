package com.medsync.medicalrecords.dto;

import com.medsync.medicalrecords.model.TimelineEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Map;

public record CreateTimelineEventRequest(
        String eventId,
        Long attendanceId,

        @NotNull(message = "tipo do evento é obrigatório")
        TimelineEventType type,

        @NotBlank(message = "título é obrigatório")
        @Size(max = 160, message = "título deve ter no máximo 160 caracteres")
        String title,

        @Size(max = 500, message = "descrição deve ter no máximo 500 caracteres")
        String description,

        @Size(max = 120, message = "sourceService deve ter no máximo 120 caracteres")
        String sourceService,

        Instant createdAt,
        Map<String, Object> metadata
) {
}
