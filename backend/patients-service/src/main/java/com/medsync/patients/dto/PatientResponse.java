package com.medsync.patients.dto;

import com.medsync.patients.model.Gender;

import java.time.Instant;
import java.time.LocalDate;

public record PatientResponse(
        Long id,
        String fullName,
        LocalDate birthDate,
        Gender gender,
        String phone,
        String documentNumber,
        String address,
        Instant createdAt,
        Instant updatedAt
) {
}
