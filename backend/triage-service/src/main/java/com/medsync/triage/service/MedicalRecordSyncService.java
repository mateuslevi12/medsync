package com.medsync.triage.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medsync.triage.dto.CompleteTriageRequest;
import com.medsync.triage.dto.FinishMedicalAttendanceRequest;
import com.medsync.triage.dto.MedicalConductDtos.*;
import com.medsync.triage.dto.VaccineSnapshot;
import com.medsync.triage.model.AmbulatoryAttendance;
import com.medsync.triage.model.MedicalAttendance;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalRecordSyncService {

    private static final String INTERNAL_HEADER = "X-Internal-Token";

    private final RestTemplateBuilder restTemplateBuilder;
    private final ObjectMapper objectMapper;

    @Value("${app.services.medical-records.url}")
    private String medicalRecordsServiceUrl;

    @Value("${app.internal.token}")
    private String internalToken;

    public void syncPatientSnapshot(AmbulatoryAttendance attendance) {
        UpsertPatientSnapshotPayload payload = new UpsertPatientSnapshotPayload(
                attendance.getPatientId(),
                attendance.getPatientName(),
                attendance.getPatientCpf(),
                attendance.getPatientCns(),
                attendance.getPatientAge(),
                attendance.getPatientPhone(),
                List.of(),
                List.of()
        );

        exchange(
                HttpMethod.PUT,
                "/api/medical-records/internal/patient/%s/snapshot".formatted(attendance.getPatientId()),
                payload
        );
    }

    public void syncCompletedTriage(AmbulatoryAttendance attendance, CompleteTriageRequest request) {
        CreateTriageRecordPayload payload = new CreateTriageRecordPayload(
                attendance.getId(),
                attendance.getTriageId(),
                attendance.getQueueName(),
                attendance.getStatus().name(),
                attendance.getPriority().name(),
                attendance.getRiskClassification() == null ? "NAO_URGENTE" : attendance.getRiskClassification().name(),
                attendance.getWaitingSince(),
                attendance.getTriageStartedAt(),
                attendance.getTriageCompletedAt(),
                new VitalSignsPayload(
                        attendance.getWeightKg(),
                        attendance.getHeightCm(),
                        attendance.getBmi(),
                        attendance.getAbdominalCircumference(),
                        attendance.getBloodPressure(),
                        attendance.getRespiratoryRate(),
                        attendance.getHeartRate(),
                        attendance.getTemperature(),
                        attendance.getOxygenSaturation(),
                        attendance.getGlucose(),
                        attendance.getPainLevel()
                ),
                allergyPayloads(request),
                vaccinePayloads(request.vaccines()),
                attendance.getObservations(),
                attendance.getDestination(),
                "Equipe de acolhimento",
                attendance.getTriageCompletedAt(),
                snapshotPayload(attendance, allergyPayloads(request), vaccinePayloads(request.vaccines()))
        );

        exchange(
                HttpMethod.POST,
                "/api/medical-records/internal/patient/%s/triage-records".formatted(attendance.getPatientId()),
                payload
        );
    }

    public void syncMedicalAttendance(
            AmbulatoryAttendance attendance,
            MedicalAttendance medicalAttendance,
            FinishMedicalAttendanceRequest request
    ) {
        CreateMedicalAttendancePayload payload = new CreateMedicalAttendancePayload(
                attendance.getId(),
                medicalAttendance.getAssessment(),
                medicalAttendance.getPlan(),
                medicalAttendance.getProcedureCode(),
                ambulatoryServiceStringList(medicalAttendance.getCidCodesJson()),
                defaultMedicalConducts(request.medications()),
                defaultProcedureConducts(request.procedures()),
                defaultObservationConducts(request.observationPrescriptions()),
                defaultExamConducts(request.exams()),
                defaultOrientationConducts(request.orientations()),
                defaultCertificateConducts(request.certificates()),
                defaultDeclarationConducts(request.declarations()),
                defaultRecipeConducts(request.recipes()),
                medicalAttendance.getNotifications(),
                medicalAttendance.isAccidentMoto(),
                medicalAttendance.isAccidentCarro(),
                medicalAttendance.isAccidentBicicleta(),
                medicalAttendance.isAccidentPedestre(),
                medicalAttendance.isAccidentOutros(),
                medicalAttendance.getNotes(),
                medicalAttendance.getProfessionalName(),
                attendance.getMedicalStartedAt(),
                medicalAttendance.getCompletedAt(),
                snapshotPayload(attendance, allergyPayloads(attendance), vaccinePayloadsFromAttendance(attendance))
        );

        exchange(
                HttpMethod.POST,
                "/api/medical-records/internal/patient/%s/medical-attendances".formatted(attendance.getPatientId()),
                payload
        );
    }

    private void exchange(HttpMethod method, String path, Object body) {
        RestTemplate restTemplate = restTemplateBuilder.build();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(INTERNAL_HEADER, internalToken);

        try {
            restTemplate.exchange(
                    normalizeBaseUrl() + path,
                    method,
                    new HttpEntity<>(body, headers),
                    Void.class
            );
        } catch (RestClientException exception) {
            log.warn("Falha ao sincronizar prontuário com medical-record-service: {}", exception.getMessage());
        }
    }

    private String normalizeBaseUrl() {
        return medicalRecordsServiceUrl.endsWith("/") ? medicalRecordsServiceUrl.substring(0, medicalRecordsServiceUrl.length() - 1) : medicalRecordsServiceUrl;
    }

    private UpsertPatientSnapshotPayload snapshotPayload(
            AmbulatoryAttendance attendance,
            List<AllergySnapshotPayload> allergies,
            List<VaccineSnapshotPayload> vaccines
    ) {
        return new UpsertPatientSnapshotPayload(
                attendance.getPatientId(),
                attendance.getPatientName(),
                attendance.getPatientCpf(),
                attendance.getPatientCns(),
                attendance.getPatientAge(),
                attendance.getPatientPhone(),
                allergies,
                vaccines
        );
    }

    private List<AllergySnapshotPayload> allergyPayloads(CompleteTriageRequest request) {
        if (!Boolean.TRUE.equals(request.hasAllergy())) {
            return List.of();
        }

        return List.of(new AllergySnapshotPayload(
                defaultIfBlank(request.allergyType(), "Medicamento"),
                defaultIfBlank(request.allergyDescription(), "Alergia registrada no acolhimento"),
                request.allergySeverity(),
                Instant.now()
        ));
    }

    private List<AllergySnapshotPayload> allergyPayloads(AmbulatoryAttendance attendance) {
        if (!Boolean.TRUE.equals(attendance.getHasAllergy())) {
            return List.of();
        }

        return List.of(new AllergySnapshotPayload(
                defaultIfBlank(attendance.getAllergyType(), "Medicamento"),
                defaultIfBlank(attendance.getAllergyDescription(), "Alergia registrada no acolhimento"),
                attendance.getAllergySeverity(),
                Instant.now()
        ));
    }

    private List<VaccineSnapshotPayload> vaccinePayloads(List<VaccineSnapshot> vaccines) {
        if (vaccines == null || vaccines.isEmpty()) {
            return List.of();
        }

        return vaccines.stream()
                .map(vaccine -> new VaccineSnapshotPayload(vaccine.name(), vaccine.status(), null, null))
                .toList();
    }

    private List<VaccineSnapshotPayload> vaccinePayloadsFromAttendance(AmbulatoryAttendance attendance) {
        if (attendance.getVaccineSnapshotJson() == null || attendance.getVaccineSnapshotJson().isBlank()) {
            return List.of();
        }

        try {
            List<VaccineSnapshot> vaccines = objectMapper.readValue(
                    attendance.getVaccineSnapshotJson(),
                    new TypeReference<List<VaccineSnapshot>>() {}
            );
            return vaccinePayloads(vaccines);
        } catch (Exception exception) {
            log.warn("Falha ao desserializar vacinas do atendimento {}: {}", attendance.getId(), exception.getMessage());
            return List.of();
        }
    }

    private List<MedicationConductDto> defaultMedicalConducts(List<MedicationConductDto> items) {
        return items == null ? List.of() : items;
    }

    private List<ProcedureConductDto> defaultProcedureConducts(List<ProcedureConductDto> items) {
        return items == null ? List.of() : items;
    }

    private List<ObservationPrescriptionConductDto> defaultObservationConducts(List<ObservationPrescriptionConductDto> items) {
        return items == null ? List.of() : items;
    }

    private List<ExamConductDto> defaultExamConducts(List<ExamConductDto> items) {
        return items == null ? List.of() : items;
    }

    private List<OrientationConductDto> defaultOrientationConducts(List<OrientationConductDto> items) {
        return items == null ? List.of() : items;
    }

    private List<CertificateConductDto> defaultCertificateConducts(List<CertificateConductDto> items) {
        return items == null ? List.of() : items;
    }

    private List<DeclarationConductDto> defaultDeclarationConducts(List<DeclarationConductDto> items) {
        return items == null ? List.of() : items;
    }

    private List<RecipeConductDto> defaultRecipeConducts(List<RecipeConductDto> items) {
        return items == null ? List.of() : items;
    }

    private List<String> ambulatoryServiceStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception exception) {
            log.warn("Falha ao desserializar lista do atendimento: {}", exception.getMessage());
            return new ArrayList<>();
        }
    }

    private String defaultIfBlank(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private record UpsertPatientSnapshotPayload(
            Long patientId,
            String patientName,
            String patientCpf,
            String patientCns,
            Integer patientAge,
            String patientPhone,
            List<AllergySnapshotPayload> allergiesSnapshot,
            List<VaccineSnapshotPayload> vaccinesSnapshot
    ) {
    }

    private record CreateTriageRecordPayload(
            Long attendanceId,
            Long triageId,
            String queueName,
            String status,
            String priority,
            String riskClassification,
            Instant waitingSince,
            Instant triageStartedAt,
            Instant triageCompletedAt,
            VitalSignsPayload vitalSigns,
            List<AllergySnapshotPayload> allergiesSnapshot,
            List<VaccineSnapshotPayload> vaccinesSnapshot,
            String observations,
            String destination,
            String professionalName,
            Instant createdAt,
            UpsertPatientSnapshotPayload patientSnapshot
    ) {
    }

    private record CreateMedicalAttendancePayload(
            Long attendanceId,
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
            Boolean accidentMoto,
            Boolean accidentCarro,
            Boolean accidentBicicleta,
            Boolean accidentPedestre,
            Boolean accidentOutros,
            String notes,
            String professionalName,
            Instant startedAt,
            Instant completedAt,
            UpsertPatientSnapshotPayload patientSnapshot
    ) {
    }

    private record VitalSignsPayload(
            String weightKg,
            String heightCm,
            String imc,
            String abdominalCircumferenceCm,
            String bloodPressure,
            String respiratoryRate,
            String heartRate,
            String temperature,
            String oxygenSaturation,
            String glucose,
            Integer painLevel
    ) {
    }

    private record AllergySnapshotPayload(
            String type,
            String description,
            String severity,
            Instant createdAt
    ) {
    }

    private record VaccineSnapshotPayload(
            String name,
            String status,
            Instant applicationDate,
            String notes
    ) {
    }
}
