package com.medsync.medicalrecords.dto;

import com.medsync.medicalrecords.model.TimelineEventType;

import java.time.Instant;

public record LatestUpdateResponse(
        Long patientId,
        String patientName,
        Long attendanceId,
        TimelineEventType type,
        String title,
        String sourceService,
        Instant createdAt
) {
}
