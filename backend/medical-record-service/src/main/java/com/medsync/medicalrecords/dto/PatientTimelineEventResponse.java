package com.medsync.medicalrecords.dto;

import com.medsync.medicalrecords.model.TimelineEventType;

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
