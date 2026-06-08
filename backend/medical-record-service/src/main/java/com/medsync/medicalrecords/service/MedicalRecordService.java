package com.medsync.medicalrecords.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medsync.medicalrecords.dto.*;
import com.medsync.medicalrecords.dto.MedicalConductDtos.*;
import com.medsync.medicalrecords.exception.NotFoundException;
import com.medsync.medicalrecords.model.*;
import com.medsync.medicalrecords.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("America/Fortaleza");
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<MedicationConductDto>> MEDICATIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<ProcedureConductDto>> PROCEDURES_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<ObservationPrescriptionConductDto>> OBSERVATION_PRESCRIPTIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<ExamConductDto>> EXAMS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<OrientationConductDto>> ORIENTATIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<CertificateConductDto>> CERTIFICATES_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<DeclarationConductDto>> DECLARATIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<RecipeConductDto>> RECIPES_TYPE = new TypeReference<>() {};

    private final MedicalRecordRepository medicalRecordRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public MedicalRecordResponse findByPatientId(Long patientId) {
        MedicalRecordDocument record = findDocument(patientId);
        return toResponse(record);
    }

    @Transactional(readOnly = true)
    public List<PatientTimelineEventResponse> findTimeline(Long patientId) {
        MedicalRecordDocument record = findDocument(patientId);
        return sortTimeline(record.getTimelineEvents()).stream()
                .map(event -> toTimelineResponse(record.getPatientId(), event))
                .toList();
    }

    @Transactional
    public void upsertPatientSnapshot(Long patientId, UpsertPatientSnapshotRequest request) {
        MedicalRecordDocument record = getOrCreate(patientId, request);
        mergePatientSnapshot(record, request);
        save(record);
    }

    @Transactional
    public AmbulatoryAttendanceResponse registerTriageRecord(Long patientId, CreateTriageRecordRequest request) {
        MedicalRecordDocument record = getOrCreate(patientId, request.patientSnapshot());
        mergePatientSnapshot(record, request.patientSnapshot());

        List<AllergySnapshot> allergies = toAllergySnapshots(request.allergiesSnapshot());
        List<VaccineSnapshot> vaccines = toVaccineSnapshots(request.vaccinesSnapshot());
        if (!allergies.isEmpty()) {
            record.setAllergiesSnapshot(allergies);
        }
        if (!vaccines.isEmpty()) {
            record.setVaccinesSnapshot(vaccines);
        }

        TriageRecord triageRecord = TriageRecord.builder()
                .id(existingTriageId(record, request))
                .attendanceId(request.attendanceId())
                .triageId(request.triageId())
                .queueName(defaultIfBlank(request.queueName(), "ATENDIMENTO MÉDICO"))
                .status(defaultIfBlank(request.status(), "AGUARDANDO_MEDICO"))
                .priority(defaultIfBlank(request.priority(), priorityFromRisk(request.riskClassification())))
                .riskClassification(request.riskClassification().trim())
                .waitingSince(firstNonNull(request.waitingSince(), request.createdAt(), Instant.now()))
                .triageStartedAt(request.triageStartedAt())
                .triageCompletedAt(request.triageCompletedAt())
                .vitalSigns(toVitalSigns(request.vitalSigns()))
                .allergiesSnapshot(allergies)
                .vaccinesSnapshot(vaccines)
                .observations(trimToNull(request.observations()))
                .destination(trimToNull(request.destination()))
                .professionalName(defaultIfBlank(request.professionalName(), "Equipe de acolhimento"))
                .createdAt(firstNonNull(request.createdAt(), request.triageCompletedAt(), Instant.now()))
                .build();

        upsertTriageRecord(record, triageRecord);
        save(record);
        return toTriageResponse(record, triageRecord, findMedicalAttendance(record, triageRecord.getAttendanceId()));
    }

    @Transactional
    public MedicalAttendanceResponse registerMedicalAttendance(Long patientId, CreateMedicalAttendanceRequest request) {
        MedicalRecordDocument record = getOrCreate(patientId, request.patientSnapshot());
        mergePatientSnapshot(record, request.patientSnapshot());

        MedicalAttendanceRecord medicalAttendance = MedicalAttendanceRecord.builder()
                .id(existingMedicalAttendanceId(record, request))
                .attendanceId(request.attendanceId())
                .assessment(request.assessment().trim())
                .plan(request.plan().trim())
                .procedureCode(trimToNull(request.procedureCode()))
                .cidCodesJson(writeJson(safeStringList(request.cidCodes())))
                .medicationsJson(writeJson(safeObjectList(request.medications())))
                .proceduresJson(writeJson(safeObjectList(request.procedures())))
                .observationPrescriptionsJson(writeJson(safeObjectList(request.observationPrescriptions())))
                .examsJson(writeJson(safeObjectList(request.exams())))
                .orientationsJson(writeJson(safeObjectList(request.orientations())))
                .certificatesJson(writeJson(safeObjectList(request.certificates())))
                .declarationsJson(writeJson(safeObjectList(request.declarations())))
                .recipesJson(writeJson(safeObjectList(request.recipes())))
                .notifications(trimToNull(request.notifications()))
                .accidentInfo(AccidentInfo.builder()
                        .moto(Boolean.TRUE.equals(request.accidentMoto()))
                        .carro(Boolean.TRUE.equals(request.accidentCarro()))
                        .bicicleta(Boolean.TRUE.equals(request.accidentBicicleta()))
                        .pedestre(Boolean.TRUE.equals(request.accidentPedestre()))
                        .outros(Boolean.TRUE.equals(request.accidentOutros()))
                        .build())
                .notes(trimToNull(request.notes()))
                .professionalName(defaultIfBlank(request.professionalName(), "Equipe médica"))
                .startedAt(firstNonNull(request.startedAt(), Instant.now()))
                .completedAt(firstNonNull(request.completedAt(), Instant.now()))
                .build();

        upsertMedicalAttendance(record, medicalAttendance);
        save(record);
        return toMedicalResponse(record, medicalAttendance);
    }

    @Transactional
    public PatientTimelineEventResponse registerTimelineEvent(Long patientId, CreateTimelineEventRequest request) {
        MedicalRecordDocument record = getOrCreate(patientId, null);
        TimelineEvent event = TimelineEvent.builder()
                .id(defaultIfBlank(request.eventId(), UUID.randomUUID().toString()))
                .attendanceId(request.attendanceId())
                .type(request.type())
                .title(request.title().trim())
                .description(trimToNull(request.description()))
                .sourceService(defaultIfBlank(request.sourceService(), "manual"))
                .createdAt(firstNonNull(request.createdAt(), Instant.now()))
                .metadata(new LinkedHashMap<>(request.metadata() == null ? Map.of() : request.metadata()))
                .build();

        appendTimelineEvent(record, event);
        save(record);
        return toTimelineResponse(record.getPatientId(), event);
    }

    @Transactional
    public void registerInternalFlowEvent(InternalFlowEventRequest request) {
        MedicalRecordDocument record = getOrCreate(request.patientId(), null);
        if (isBlank(record.getPatientName()) && !isBlank(request.patientName())) {
            record.setPatientName(request.patientName().trim());
        }

        TimelineEventType type = flowTypeToTimelineType(request.eventType());
        Instant occurredAt = firstNonNull(request.occurredAt(), Instant.now());
        Map<String, Object> metadata = new LinkedHashMap<>();
        if (request.metadata() != null) {
            metadata.putAll(request.metadata());
        }
        metadata.putIfAbsent("eventId", request.eventId());
        metadata.putIfAbsent("eventType", request.eventType());

        appendTimelineEvent(record, TimelineEvent.builder()
                .id(request.eventId())
                .attendanceId(request.attendanceId())
                .type(type)
                .title(defaultIfBlank(request.title(), defaultFlowTitle(type)))
                .description(trimToNull(request.description()))
                .sourceService(defaultIfBlank(request.sourceService(), "triage-service"))
                .createdAt(occurredAt)
                .metadata(metadata)
                .build());

        String notificationEventId = request.eventId() + ":notification";
        appendTimelineEvent(record, TimelineEvent.builder()
                .id(notificationEventId)
                .attendanceId(request.attendanceId())
                .type(TimelineEventType.NOTIFICACAO_GERADA)
                .title("Notificação gerada")
                .description("Evento operacional publicado para o fluxo hospitalar.")
                .sourceService(defaultIfBlank(request.sourceService(), "triage-service"))
                .createdAt(occurredAt)
                .metadata(Map.of(
                        "eventId", notificationEventId,
                        "sourceEventId", request.eventId(),
                        "sourceEventType", request.eventType()
                ))
                .build());

        save(record);
    }

    @Transactional(readOnly = true)
    public MedicalRecordSummaryResponse findSummary() {
        List<MedicalRecordDocument> records = medicalRecordRepository.findAll();
        Instant startOfDay = LocalDate.now(DEFAULT_ZONE).atStartOfDay(DEFAULT_ZONE).toInstant();
        Instant endOfDay = LocalDate.now(DEFAULT_ZONE).plusDays(1).atStartOfDay(DEFAULT_ZONE).toInstant();

        long medicalAttendancesToday = records.stream()
                .flatMap(record -> record.getMedicalAttendances().stream())
                .filter(attendance -> attendance.getCompletedAt() != null)
                .filter(attendance -> !attendance.getCompletedAt().isBefore(startOfDay) && attendance.getCompletedAt().isBefore(endOfDay))
                .count();

        long triagesRegistered = records.stream()
                .mapToLong(record -> record.getTriages().size())
                .sum();

        long patientsWithAllergies = records.stream()
                .filter(record -> !record.getAllergiesSnapshot().isEmpty())
                .count();

        long patientsWithPendingVaccines = records.stream()
                .filter(record -> record.getVaccinesSnapshot().stream().anyMatch(vaccine -> "PENDENTE".equalsIgnoreCase(vaccine.getStatus())))
                .count();

        List<LatestUpdateResponse> latestUpdates = records.stream()
                .flatMap(record -> record.getTimelineEvents().stream().map(event -> new AbstractMap.SimpleEntry<>(record, event)))
                .sorted((left, right) -> right.getValue().getCreatedAt().compareTo(left.getValue().getCreatedAt()))
                .limit(8)
                .map(entry -> new LatestUpdateResponse(
                        entry.getKey().getPatientId(),
                        entry.getKey().getPatientName(),
                        entry.getValue().getAttendanceId(),
                        entry.getValue().getType(),
                        entry.getValue().getTitle(),
                        entry.getValue().getSourceService(),
                        entry.getValue().getCreatedAt()
                ))
                .toList();

        return new MedicalRecordSummaryResponse(
                records.size(),
                medicalAttendancesToday,
                triagesRegistered,
                patientsWithAllergies,
                patientsWithPendingVaccines,
                latestUpdates
        );
    }

    private MedicalRecordDocument findDocument(Long patientId) {
        return medicalRecordRepository.findByPatientId(patientId)
                .orElseThrow(() -> new NotFoundException("Nenhum prontuário encontrado para este paciente"));
    }

    private MedicalRecordDocument getOrCreate(Long patientId, UpsertPatientSnapshotRequest snapshot) {
        return medicalRecordRepository.findByPatientId(patientId)
                .orElseGet(() -> newDocument(patientId, snapshot));
    }

    private MedicalRecordDocument newDocument(Long patientId, UpsertPatientSnapshotRequest snapshot) {
        Instant now = Instant.now();
        return MedicalRecordDocument.builder()
                .patientId(patientId)
                .patientName(snapshot != null ? trimToNull(snapshot.patientName()) : "Paciente " + patientId)
                .patientCpf(snapshot != null ? trimToNull(snapshot.patientCpf()) : null)
                .patientCns(snapshot != null ? trimToNull(snapshot.patientCns()) : null)
                .patientAge(snapshot != null ? snapshot.patientAge() : null)
                .patientPhone(snapshot != null ? trimToNull(snapshot.patientPhone()) : null)
                .allergiesSnapshot(snapshot != null ? toAllergySnapshots(snapshot.allergiesSnapshot()) : new ArrayList<>())
                .vaccinesSnapshot(snapshot != null ? toVaccineSnapshots(snapshot.vaccinesSnapshot()) : new ArrayList<>())
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private void mergePatientSnapshot(MedicalRecordDocument record, UpsertPatientSnapshotRequest snapshot) {
        if (snapshot == null) {
            return;
        }

        record.setPatientName(defaultIfBlank(snapshot.patientName(), record.getPatientName()));
        record.setPatientCpf(defaultIfBlank(snapshot.patientCpf(), record.getPatientCpf()));
        record.setPatientCns(defaultIfBlank(snapshot.patientCns(), record.getPatientCns()));
        record.setPatientAge(snapshot.patientAge() != null ? snapshot.patientAge() : record.getPatientAge());
        record.setPatientPhone(defaultIfBlank(snapshot.patientPhone(), record.getPatientPhone()));

        List<AllergySnapshot> allergies = toAllergySnapshots(snapshot.allergiesSnapshot());
        if (!allergies.isEmpty()) {
            record.setAllergiesSnapshot(allergies);
        }

        List<VaccineSnapshot> vaccines = toVaccineSnapshots(snapshot.vaccinesSnapshot());
        if (!vaccines.isEmpty()) {
            record.setVaccinesSnapshot(vaccines);
        }
    }

    private void upsertTriageRecord(MedicalRecordDocument record, TriageRecord triageRecord) {
        List<TriageRecord> triages = new ArrayList<>(record.getTriages());
        int index = indexOfTriage(triages, triageRecord);
        if (index >= 0) {
            triages.set(index, triageRecord);
        } else {
            triages.add(triageRecord);
        }
        triages.sort(Comparator.comparing(TriageRecord::getCreatedAt).reversed());
        record.setTriages(triages);
    }

    private void upsertMedicalAttendance(MedicalRecordDocument record, MedicalAttendanceRecord medicalAttendance) {
        List<MedicalAttendanceRecord> medicalAttendances = new ArrayList<>(record.getMedicalAttendances());
        int index = indexOfMedicalAttendance(medicalAttendances, medicalAttendance);
        if (index >= 0) {
            medicalAttendances.set(index, medicalAttendance);
        } else {
            medicalAttendances.add(medicalAttendance);
        }
        medicalAttendances.sort(Comparator.comparing(MedicalAttendanceRecord::getCompletedAt).reversed());
        record.setMedicalAttendances(medicalAttendances);
    }

    private void appendTimelineEvent(MedicalRecordDocument record, TimelineEvent event) {
        if (record.getTimelineEvents().stream().anyMatch(existing -> Objects.equals(existing.getId(), event.getId()))) {
            return;
        }

        List<TimelineEvent> timeline = new ArrayList<>(record.getTimelineEvents());
        timeline.add(event);
        timeline.sort(Comparator.comparing(TimelineEvent::getCreatedAt).reversed());
        record.setTimelineEvents(timeline);
    }

    private List<TimelineEvent> sortTimeline(List<TimelineEvent> events) {
        return events.stream()
                .sorted(Comparator.comparing(TimelineEvent::getCreatedAt).reversed())
                .toList();
    }

    private MedicalRecordResponse toResponse(MedicalRecordDocument record) {
        Map<Long, MedicalAttendanceRecord> medicalByAttendance = record.getMedicalAttendances().stream()
                .filter(item -> item.getAttendanceId() != null)
                .collect(Collectors.toMap(
                        MedicalAttendanceRecord::getAttendanceId,
                        item -> item,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        List<AmbulatoryAttendanceResponse> triageResponses = record.getTriages().stream()
                .sorted(Comparator.comparing(TriageRecord::getCreatedAt).reversed())
                .map(triage -> toTriageResponse(record, triage, medicalByAttendance.get(triage.getAttendanceId())))
                .toList();

        List<MedicalAttendanceResponse> medicalResponses = record.getMedicalAttendances().stream()
                .sorted(Comparator.comparing(MedicalAttendanceRecord::getCompletedAt).reversed())
                .map(item -> toMedicalResponse(record, item))
                .toList();

        List<PatientTimelineEventResponse> timelineResponses = sortTimeline(record.getTimelineEvents()).stream()
                .map(event -> toTimelineResponse(record.getPatientId(), event))
                .toList();

        return new MedicalRecordResponse(
                record.getPatientId(),
                record.getPatientName(),
                record.getPatientCpf(),
                record.getPatientCns(),
                record.getPatientAge(),
                record.getPatientPhone(),
                record.getAllergiesSnapshot().stream().map(this::toAllergyDto).toList(),
                record.getVaccinesSnapshot().stream().map(this::toVaccineDto).toList(),
                triageResponses,
                medicalResponses,
                timelineResponses,
                record.getCreatedAt(),
                record.getUpdatedAt()
        );
    }

    private AmbulatoryAttendanceResponse toTriageResponse(
            MedicalRecordDocument record,
            TriageRecord triageRecord,
            MedicalAttendanceRecord medicalAttendance
    ) {
        VitalSigns vitalSigns = triageRecord.getVitalSigns() == null ? new VitalSigns() : triageRecord.getVitalSigns();
        AllergySnapshot primaryAllergy = triageRecord.getAllergiesSnapshot().stream().findFirst().orElse(null);

        return new AmbulatoryAttendanceResponse(
                firstNonNull(triageRecord.getAttendanceId(), stableNumericId(triageRecord.getId(), 0L)),
                record.getPatientId(),
                record.getPatientName(),
                record.getPatientCpf(),
                record.getPatientCns(),
                record.getPatientPhone(),
                record.getPatientAge(),
                defaultIfBlank(triageRecord.getQueueName(), "ATENDIMENTO MÉDICO"),
                medicalAttendance != null ? "FINALIZADO" : defaultIfBlank(triageRecord.getStatus(), "AGUARDANDO_MEDICO"),
                triageRecord.getRiskClassification(),
                defaultIfBlank(triageRecord.getPriority(), priorityFromRisk(triageRecord.getRiskClassification())),
                firstNonNull(triageRecord.getWaitingSince(), triageRecord.getCreatedAt(), record.getCreatedAt()),
                triageRecord.getTriageStartedAt(),
                triageRecord.getTriageCompletedAt(),
                medicalAttendance != null ? medicalAttendance.getStartedAt() : null,
                medicalAttendance != null ? medicalAttendance.getCompletedAt() : null,
                firstNonNull(triageRecord.getTriageId(), triageRecord.getAttendanceId()),
                medicalAttendance != null ? firstNonNull(medicalAttendance.getAttendanceId(), stableNumericId(medicalAttendance.getId(), 0L)) : null,
                triageRecord.getObservations(),
                triageRecord.getDestination(),
                vitalSigns.getWeightKg(),
                vitalSigns.getHeightCm(),
                vitalSigns.getImc(),
                vitalSigns.getAbdominalCircumferenceCm(),
                vitalSigns.getBloodPressure(),
                vitalSigns.getRespiratoryRate(),
                vitalSigns.getHeartRate(),
                vitalSigns.getTemperature(),
                vitalSigns.getOxygenSaturation(),
                vitalSigns.getGlucose(),
                vitalSigns.getPainLevel(),
                primaryAllergy != null,
                primaryAllergy != null ? primaryAllergy.getType() : null,
                primaryAllergy != null ? primaryAllergy.getDescription() : null,
                primaryAllergy != null ? primaryAllergy.getSeverity() : null,
                triageRecord.getVaccinesSnapshot().stream().map(this::toVaccineDto).toList(),
                triageRecord.getCreatedAt(),
                record.getUpdatedAt()
        );
    }

    private MedicalAttendanceResponse toMedicalResponse(MedicalRecordDocument record, MedicalAttendanceRecord medicalAttendance) {
        AccidentInfo accidentInfo = medicalAttendance.getAccidentInfo() == null ? new AccidentInfo() : medicalAttendance.getAccidentInfo();

        return new MedicalAttendanceResponse(
                stableNumericId(medicalAttendance.getId(), firstNonNull(medicalAttendance.getAttendanceId(), 0L)),
                medicalAttendance.getAttendanceId(),
                record.getPatientId(),
                record.getPatientName(),
                medicalAttendance.getAssessment(),
                medicalAttendance.getPlan(),
                medicalAttendance.getProcedureCode(),
                readTypedList(medicalAttendance.getCidCodesJson(), STRING_LIST_TYPE),
                readTypedList(medicalAttendance.getMedicationsJson(), MEDICATIONS_TYPE),
                readTypedList(medicalAttendance.getProceduresJson(), PROCEDURES_TYPE),
                readTypedList(medicalAttendance.getObservationPrescriptionsJson(), OBSERVATION_PRESCRIPTIONS_TYPE),
                readTypedList(medicalAttendance.getExamsJson(), EXAMS_TYPE),
                readTypedList(medicalAttendance.getOrientationsJson(), ORIENTATIONS_TYPE),
                readTypedList(medicalAttendance.getCertificatesJson(), CERTIFICATES_TYPE),
                readTypedList(medicalAttendance.getDeclarationsJson(), DECLARATIONS_TYPE),
                readTypedList(medicalAttendance.getRecipesJson(), RECIPES_TYPE),
                medicalAttendance.getNotifications(),
                accidentInfo.isMoto(),
                accidentInfo.isCarro(),
                accidentInfo.isBicicleta(),
                accidentInfo.isPedestre(),
                accidentInfo.isOutros(),
                medicalAttendance.getNotes(),
                medicalAttendance.getProfessionalName(),
                medicalAttendance.getStartedAt(),
                medicalAttendance.getCompletedAt()
        );
    }

    private PatientTimelineEventResponse toTimelineResponse(Long patientId, TimelineEvent event) {
        return new PatientTimelineEventResponse(
                stableNumericId(event.getId(), 0L),
                patientId,
                event.getAttendanceId(),
                event.getType(),
                event.getTitle(),
                event.getDescription(),
                event.getCreatedAt()
        );
    }

    private AllergySnapshotDto toAllergyDto(AllergySnapshot allergySnapshot) {
        return new AllergySnapshotDto(
                allergySnapshot.getType(),
                allergySnapshot.getDescription(),
                allergySnapshot.getSeverity(),
                allergySnapshot.getCreatedAt()
        );
    }

    private VaccineSnapshotDto toVaccineDto(VaccineSnapshot vaccineSnapshot) {
        return new VaccineSnapshotDto(
                vaccineSnapshot.getName(),
                vaccineSnapshot.getStatus(),
                vaccineSnapshot.getApplicationDate(),
                vaccineSnapshot.getNotes()
        );
    }

    private List<AllergySnapshot> toAllergySnapshots(List<AllergySnapshotDto> source) {
        if (source == null || source.isEmpty()) {
            return new ArrayList<>();
        }

        return source.stream()
                .map(item -> AllergySnapshot.builder()
                        .type(item.type().trim())
                        .description(item.description().trim())
                        .severity(trimToNull(item.severity()))
                        .createdAt(firstNonNull(item.createdAt(), Instant.now()))
                        .build())
                .toList();
    }

    private List<VaccineSnapshot> toVaccineSnapshots(List<VaccineSnapshotDto> source) {
        if (source == null || source.isEmpty()) {
            return new ArrayList<>();
        }

        return source.stream()
                .map(item -> VaccineSnapshot.builder()
                        .name(item.name().trim())
                        .status(item.status().trim())
                        .applicationDate(item.applicationDate())
                        .notes(trimToNull(item.notes()))
                        .build())
                .toList();
    }

    private VitalSigns toVitalSigns(VitalSignsDto dto) {
        return VitalSigns.builder()
                .weightKg(trimToNull(dto.weightKg()))
                .heightCm(trimToNull(dto.heightCm()))
                .imc(trimToNull(dto.imc()))
                .abdominalCircumferenceCm(trimToNull(dto.abdominalCircumferenceCm()))
                .bloodPressure(trimToNull(dto.bloodPressure()))
                .respiratoryRate(trimToNull(dto.respiratoryRate()))
                .heartRate(trimToNull(dto.heartRate()))
                .temperature(trimToNull(dto.temperature()))
                .oxygenSaturation(trimToNull(dto.oxygenSaturation()))
                .glucose(trimToNull(dto.glucose()))
                .painLevel(dto.painLevel())
                .build();
    }

    private MedicalAttendanceRecord findMedicalAttendance(MedicalRecordDocument record, Long attendanceId) {
        if (attendanceId == null) {
            return null;
        }

        return record.getMedicalAttendances().stream()
                .filter(item -> Objects.equals(item.getAttendanceId(), attendanceId))
                .findFirst()
                .orElse(null);
    }

    private int indexOfTriage(List<TriageRecord> triages, TriageRecord triageRecord) {
        for (int index = 0; index < triages.size(); index++) {
            TriageRecord current = triages.get(index);
            if (matchesTriage(current, triageRecord)) {
                return index;
            }
        }
        return -1;
    }

    private int indexOfMedicalAttendance(List<MedicalAttendanceRecord> attendances, MedicalAttendanceRecord medicalAttendance) {
        for (int index = 0; index < attendances.size(); index++) {
            MedicalAttendanceRecord current = attendances.get(index);
            if (Objects.equals(current.getAttendanceId(), medicalAttendance.getAttendanceId())
                    || Objects.equals(current.getId(), medicalAttendance.getId())) {
                return index;
            }
        }
        return -1;
    }

    private boolean matchesTriage(TriageRecord current, TriageRecord candidate) {
        return (current.getTriageId() != null && Objects.equals(current.getTriageId(), candidate.getTriageId()))
                || (current.getAttendanceId() != null && Objects.equals(current.getAttendanceId(), candidate.getAttendanceId()))
                || Objects.equals(current.getId(), candidate.getId());
    }

    private String existingTriageId(MedicalRecordDocument record, CreateTriageRecordRequest request) {
        return record.getTriages().stream()
                .filter(item -> (request.triageId() != null && Objects.equals(item.getTriageId(), request.triageId()))
                        || (request.attendanceId() != null && Objects.equals(item.getAttendanceId(), request.attendanceId())))
                .map(TriageRecord::getId)
                .findFirst()
                .orElse(UUID.randomUUID().toString());
    }

    private String existingMedicalAttendanceId(MedicalRecordDocument record, CreateMedicalAttendanceRequest request) {
        return record.getMedicalAttendances().stream()
                .filter(item -> request.attendanceId() != null && Objects.equals(item.getAttendanceId(), request.attendanceId()))
                .map(MedicalAttendanceRecord::getId)
                .findFirst()
                .orElse(UUID.randomUUID().toString());
    }

    private TimelineEventType flowTypeToTimelineType(String eventType) {
        if (eventType == null || eventType.isBlank()) {
            return TimelineEventType.NOTIFICACAO_GERADA;
        }

        return switch (eventType) {
            case "PATIENT_ADDED_TO_QUEUE", "PATIENT_QUEUED" -> TimelineEventType.PACIENTE_INCLUIDO_FILA;
            case "TRIAGE_STARTED" -> TimelineEventType.TRIAGEM_INICIADA;
            case "TRIAGE_COMPLETED" -> TimelineEventType.TRIAGEM_FINALIZADA;
            case "PATIENT_REFERRED_TO_MEDICAL" -> TimelineEventType.ENCAMINHADO_MEDICO;
            case "MEDICAL_STARTED" -> TimelineEventType.ATENDIMENTO_MEDICO_INICIADO;
            case "MEDICAL_FINISHED" -> TimelineEventType.ATENDIMENTO_MEDICO_FINALIZADO;
            case "NOTIFICATION_GENERATED" -> TimelineEventType.NOTIFICACAO_GERADA;
            default -> TimelineEventType.NOTIFICACAO_GERADA;
        };
    }

    private String defaultFlowTitle(TimelineEventType type) {
        return switch (type) {
            case PACIENTE_INCLUIDO_FILA -> "Paciente incluído na fila";
            case TRIAGEM_INICIADA -> "Triagem iniciada";
            case TRIAGEM_FINALIZADA -> "Triagem finalizada";
            case ENCAMINHADO_MEDICO -> "Paciente encaminhado para atendimento médico";
            case ATENDIMENTO_MEDICO_INICIADO -> "Atendimento médico iniciado";
            case ATENDIMENTO_MEDICO_FINALIZADO -> "Atendimento médico finalizado";
            case NOTIFICACAO_GERADA -> "Notificação gerada";
        };
    }

    private String priorityFromRisk(String riskClassification) {
        if (riskClassification == null) {
            return "NORMAL";
        }

        return switch (riskClassification.trim()) {
            case "EMERGENCIA", "MUITO_URGENTE" -> "CRITICA";
            case "URGENTE" -> "ALTA";
            default -> "NORMAL";
        };
    }

    private void save(MedicalRecordDocument record) {
        Instant now = Instant.now();
        if (record.getCreatedAt() == null) {
            record.setCreatedAt(now);
        }
        record.setUpdatedAt(now);
        medicalRecordRepository.save(record);
    }

    private List<String> safeStringList(List<String> source) {
        if (source == null || source.isEmpty()) {
            return new ArrayList<>();
        }

        return source.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private <T> List<T> safeObjectList(List<T> source) {
        if (source == null || source.isEmpty()) {
            return new ArrayList<>();
        }

        return source.stream()
                .filter(Objects::nonNull)
                .toList();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível serializar as condutas do atendimento médico", exception);
        }
    }

    private <T> List<T> readTypedList(String value, TypeReference<List<T>> type) {
        if (isBlank(value)) {
            return List.of();
        }

        try {
            return objectMapper.readValue(value, type);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private Long stableNumericId(String value, Long fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            return (long) Math.abs(value.hashCode());
        }
    }

    @SafeVarargs
    private <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String defaultIfBlank(String value, String fallback) {
        String trimmed = trimToNull(value);
        return trimmed == null ? fallback : trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isBlank(String value) {
        return trimToNull(value) == null;
    }
}
