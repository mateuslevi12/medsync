package com.medsync.triage.dto;

import com.medsync.triage.model.TimelineEventType;

import java.time.Instant;

public record PatientTimelineEventResponse(
        Long id,
        Long patientId,
        Long attendanceId,
        TimelineEventType type,
        String title,
        String description,
        Instant createdAt
) {
}
