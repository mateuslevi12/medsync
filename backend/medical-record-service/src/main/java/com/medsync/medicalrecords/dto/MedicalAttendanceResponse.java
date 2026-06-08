package com.medsync.medicalrecords.dto;

import com.medsync.medicalrecords.dto.MedicalConductDtos.*;
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
        List<MedicationConductDto> medications,
        List<ProcedureConductDto> procedures,
        List<ObservationPrescriptionConductDto> observationPrescriptions,
        List<ExamConductDto> exams,
        List<OrientationConductDto> orientations,
        List<CertificateConductDto> certificates,
        List<DeclarationConductDto> declarations,
        List<RecipeConductDto> recipes,
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
