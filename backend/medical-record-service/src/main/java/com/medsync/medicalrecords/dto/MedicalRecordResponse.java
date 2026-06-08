package com.medsync.medicalrecords.dto;

import java.time.Instant;
import java.util.List;

public record MedicalRecordResponse(
        Long patientId,
        String patientName,
        String patientCpf,
        String patientCns,
        Integer patientAge,
        String patientPhone,
        List<AllergySnapshotDto> allergiesSnapshot,
        List<VaccineSnapshotDto> vaccinesSnapshot,
        List<AmbulatoryAttendanceResponse> triages,
        List<MedicalAttendanceResponse> medicalAttendances,
        List<PatientTimelineEventResponse> timeline,
        Instant createdAt,
        Instant updatedAt
) {
}
