package com.medsync.triage.dto;

import com.medsync.triage.model.TriagePriority;
import com.medsync.triage.model.TriageStatus;

import java.time.Instant;

public record TriageResponse(
        Long id,
        Long patientId,
        String patientNameSnapshot,
        String symptoms,
        String bloodPressure,
        Integer heartRate,
        Integer respiratoryRate,
        Double temperature,
        Integer oxygenSaturation,
        Integer painLevel,
        TriagePriority priority,
        TriageStatus status,
        String notes,
        Long createdByUserId,
        Instant createdAt,
        Instant updatedAt
) {
}
