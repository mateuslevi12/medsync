package com.medsync.triage.dto;

import java.util.List;

public record MedicalRecordResponse(
        Long patientId,
        String patientName,
        String patientCpf,
        String patientCns,
        Integer patientAge,
        String patientPhone,
        List<AmbulatoryAttendanceResponse> triages,
        List<MedicalAttendanceResponse> medicalAttendances,
        List<PatientTimelineEventResponse> timeline
) {
}
