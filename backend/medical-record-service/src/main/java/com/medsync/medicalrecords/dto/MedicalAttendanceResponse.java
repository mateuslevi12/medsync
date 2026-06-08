package com.medsync.medicalrecords.dto;

import java.time.Instant;
import java.util.List;

public record MedicalAttendanceResponse(
        Long id,
        Long attendanceId,
        Long patientId,
        String patientName,
        String assessment,
        String plan,
        String procedureCode,
        List<String> cidCodes,
        List<String> exams,
        List<String> prescriptions,
        String notifications,
        boolean accidentMoto,
        boolean accidentCarro,
        boolean accidentBicicleta,
        boolean accidentPedestre,
        boolean accidentOutros,
        String notes,
        String professionalName,
        Instant createdAt,
        Instant completedAt
) {
}
