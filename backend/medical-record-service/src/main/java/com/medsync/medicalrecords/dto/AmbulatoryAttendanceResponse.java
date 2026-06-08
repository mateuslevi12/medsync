package com.medsync.medicalrecords.dto;

import java.time.Instant;
import java.util.List;

public record AmbulatoryAttendanceResponse(
        Long id,
        Long patientId,
        String patientName,
        String patientCpf,
        String patientCns,
        String patientPhone,
        Integer patientAge,
        String queueName,
        String status,
        String riskClassification,
        String priority,
        Instant waitingSince,
        Instant triageStartedAt,
        Instant triageCompletedAt,
        Instant medicalStartedAt,
        Instant medicalCompletedAt,
        Long triageId,
        Long medicalAttendanceId,
        String observations,
        String destination,
        String weightKg,
        String heightCm,
        String bmi,
        String abdominalCircumference,
        String bloodPressure,
        String respiratoryRate,
        String heartRate,
        String temperature,
        String oxygenSaturation,
        String glucose,
        Integer painLevel,
        Boolean hasAllergy,
        String allergyType,
        String allergyDescription,
        String allergySeverity,
        List<VaccineSnapshotDto> vaccines,
        Instant createdAt,
        Instant updatedAt
) {
}
