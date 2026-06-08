package com.medsync.patients.dto;

import com.medsync.patients.model.VaccineStatus;

import java.time.Instant;
import java.time.LocalDate;

public record PatientVaccineResponse(
        Long id,
        Long patientId,
        String name,
        VaccineStatus status,
        LocalDate applicationDate,
        String notes,
        Instant createdAt
) {
}
