package com.medsync.patients.dto;

import com.medsync.patients.model.AllergySeverity;
import com.medsync.patients.model.AllergyType;

import java.time.Instant;

public record PatientAllergyResponse(
        Long id,
        Long patientId,
        AllergyType type,
        String description,
        AllergySeverity severity,
        Instant createdAt
) {
}
