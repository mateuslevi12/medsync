package com.medsync.triage.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medsync.triage.dto.*;
import com.medsync.triage.dto.MedicalConductDtos.*;
import com.medsync.triage.exception.NotFoundException;
import com.medsync.triage.messaging.TriageEventProducer;
import com.medsync.triage.model.*;
import com.medsync.triage.repository.AmbulatoryAttendanceRepository;
import com.medsync.triage.repository.MedicalAttendanceRepository;
import com.medsync.triage.repository.PatientTimelineEventRepository;
import com.medsync.triage.repository.TriageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AmbulatoryService {

    private static final TypeReference<List<VaccineSnapshot>> VACCINES_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<MedicationConductDto>> MEDICATIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<ProcedureConductDto>> PROCEDURES_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<ObservationPrescriptionConductDto>> OBSERVATION_PRESCRIPTIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<ExamConductDto>> EXAMS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<OrientationConductDto>> ORIENTATIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<CertificateConductDto>> CERTIFICATES_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<DeclarationConductDto>> DECLARATIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<RecipeConductDto>> RECIPES_TYPE = new TypeReference<>() {};

    private final AmbulatoryAttendanceRepository ambulatoryAttendanceRepository;
    private final MedicalAttendanceRepository medicalAttendanceRepository;
    private final PatientTimelineEventRepository patientTimelineEventRepository;
    private final TriageRepository triageRepository;
    private final TriageEventProducer triageEventProducer;
    private final MedicalRecordSyncService medicalRecordSyncService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<AmbulatoryAttendanceResponse> findQueue() {
        return ambulatoryAttendanceRepository.findByStatusNotOrderByWaitingSinceAsc(AmbulatoryStatus.FINALIZADO)
                .stream()
                .sorted(queueComparator())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AmbulatoryAttendanceResponse createAttendance(CreateAmbulatoryAttendanceRequest request) {
        AmbulatoryAttendance attendance = AmbulatoryAttendance.builder()
                .patientId(request.patientId())
                .patientName(request.patientName().trim())
                .patientCpf(request.patientCpf().trim())
                .patientCns(trimToNull(request.patientCns()))
                .patientPhone(trimToNull(request.patientPhone()))
                .patientAge(request.patientAge())
                .queueName(request.queueName() == null || request.queueName().isBlank() ? "ACOLHIMENTO" : request.queueName().trim())
                .status(AmbulatoryStatus.AGUARDANDO_TRIAGEM)
                .priority(request.priority() == null ? AmbulatoryPriority.NORMAL : request.priority())
                .waitingSince(Instant.now())
                .build();

        AmbulatoryAttendance saved = ambulatoryAttendanceRepository.save(attendance);
        createTimeline(saved, TimelineEventType.PACIENTE_INCLUIDO_FILA, "Incluído na fila (Acolhimento)", "Paciente adicionado à fila ambulatorial.");
        medicalRecordSyncService.syncPatientSnapshot(saved);
        triageEventProducer.publishAmbulatoryFlow(
                "PATIENT_ADDED_TO_QUEUE",
                saved.getId(),
                saved.getPatientId(),
                saved.getPatientName(),
                "Paciente incluído na fila",
                "Paciente " + saved.getPatientName() + " incluído na fila ambulatorial."
        );
        createTimeline(saved, TimelineEventType.NOTIFICACAO_GERADA, "Notificação gerada", "Evento de inclusão na fila publicado.");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AmbulatoryAttendanceResponse findById(Long id) {
        return toResponse(getAttendance(id));
    }

    @Transactional
    public AmbulatoryAttendanceResponse callTriage(Long id) {
        AmbulatoryAttendance attendance = getAttendance(id);
        attendance.setStatus(AmbulatoryStatus.EM_TRIAGEM);
        attendance.setTriageStartedAt(Instant.now());
        attendance.setQueueName("ACOLHIMENTO");
        AmbulatoryAttendance saved = ambulatoryAttendanceRepository.save(attendance);

        createTimeline(saved, TimelineEventType.TRIAGEM_INICIADA, "Triagem iniciada", "Paciente chamado para acolhimento.");
        triageEventProducer.publishAmbulatoryFlow(
                "TRIAGE_STARTED",
                saved.getId(),
                saved.getPatientId(),
                saved.getPatientName(),
                "Triagem iniciada",
                "Triagem iniciada para " + saved.getPatientName() + "."
        );
        return toResponse(saved);
    }

    @Transactional
    public AmbulatoryAttendanceResponse completeTriage(Long id, CompleteTriageRequest request) {
        AmbulatoryAttendance attendance = getAttendance(id);

        attendance.setObservations(trimToNull(request.observations()));
        attendance.setDestination(request.destination().trim());
        attendance.setRiskClassification(request.riskClassification());
        attendance.setWeightKg(trimToNull(request.weightKg()));
        attendance.setHeightCm(trimToNull(request.heightCm()));
        attendance.setBmi(trimToNull(request.bmi()));
        attendance.setAbdominalCircumference(trimToNull(request.abdominalCircumference()));
        attendance.setBloodPressure(trimToNull(request.bloodPressure()));
        attendance.setRespiratoryRate(trimToNull(request.respiratoryRate()));
        attendance.setHeartRate(trimToNull(request.heartRate()));
        attendance.setTemperature(trimToNull(request.temperature()));
        attendance.setOxygenSaturation(trimToNull(request.oxygenSaturation()));
        attendance.setGlucose(trimToNull(request.glucose()));
        attendance.setPainLevel(request.painLevel());
        attendance.setHasAllergy(request.hasAllergy());
        attendance.setAllergyType(trimToNull(request.allergyType()));
        attendance.setAllergyDescription(trimToNull(request.allergyDescription()));
        attendance.setAllergySeverity(trimToNull(request.allergySeverity()));
        attendance.setPriority(priorityFromRisk(request.riskClassification()));
        attendance.setStatus(AmbulatoryStatus.AGUARDANDO_MEDICO);
        attendance.setQueueName("ATENDIMENTO MÉDICO");
        attendance.setTriageCompletedAt(Instant.now());
        attendance.setVaccineSnapshotJson(writeVaccines(request.vaccines()));

        Triage triage = triageRepository.save(
                Triage.builder()
                        .patientId(attendance.getPatientId())
                        .patientNameSnapshot(attendance.getPatientName())
                        .symptoms(defaultSymptoms(request.observations()))
                        .bloodPressure(defaultBlank(request.bloodPressure()))
                        .heartRate(parseInteger(request.heartRate(), 0))
                        .respiratoryRate(parseInteger(request.respiratoryRate(), 0))
                        .temperature(parseDouble(request.temperature(), 0D))
                        .oxygenSaturation(parseInteger(request.oxygenSaturation(), 0))
                        .painLevel(request.painLevel() == null ? 0 : request.painLevel())
                        .priority(toTriagePriority(request.riskClassification()))
                        .status(TriageStatus.COMPLETED)
                        .notes(trimToNull(request.observations()))
                        .build()
        );

        attendance.setTriageId(triage.getId());
        AmbulatoryAttendance saved = ambulatoryAttendanceRepository.save(attendance);

        createTimeline(saved, TimelineEventType.TRIAGEM_FINALIZADA, "Triagem finalizada", "Acolhimento concluído com classificação " + request.riskClassification() + ".");
        createTimeline(saved, TimelineEventType.ENCAMINHADO_MEDICO, "Encaminhado para atendimento médico", "Paciente aguardando chamada médica.");
        medicalRecordSyncService.syncCompletedTriage(saved, request);

        triageEventProducer.publishCreated(triage);
        triageEventProducer.publishAmbulatoryFlow(
                "TRIAGE_COMPLETED",
                saved.getId(),
                saved.getPatientId(),
                saved.getPatientName(),
                "Triagem finalizada",
                "Triagem finalizada para " + saved.getPatientName() + " com risco " + request.riskClassification() + "."
        );
        triageEventProducer.publishAmbulatoryFlow(
                "PATIENT_REFERRED_TO_MEDICAL",
                saved.getId(),
                saved.getPatientId(),
                saved.getPatientName(),
                "Paciente encaminhado para atendimento médico",
                saved.getPatientName() + " está aguardando chamada médica."
        );
        createTimeline(saved, TimelineEventType.NOTIFICACAO_GERADA, "Notificação gerada", "Evento de triagem finalizada publicado.");
        return toResponse(saved);
    }

    @Transactional
    public AmbulatoryAttendanceResponse callMedical(Long id) {
        AmbulatoryAttendance attendance = getAttendance(id);
        attendance.setStatus(AmbulatoryStatus.EM_ATENDIMENTO_MEDICO);
        attendance.setMedicalStartedAt(Instant.now());
        AmbulatoryAttendance saved = ambulatoryAttendanceRepository.save(attendance);

        createTimeline(saved, TimelineEventType.ATENDIMENTO_MEDICO_INICIADO, "Atendimento médico iniciado", "Paciente chamado para avaliação médica.");
        triageEventProducer.publishAmbulatoryFlow(
                "MEDICAL_STARTED",
                saved.getId(),
                saved.getPatientId(),
                saved.getPatientName(),
                "Atendimento médico iniciado",
                "Atendimento médico iniciado para " + saved.getPatientName() + "."
        );
        return toResponse(saved);
    }

    @Transactional
    public AmbulatoryAttendanceResponse finishMedical(Long id, FinishMedicalAttendanceRequest request) {
        AmbulatoryAttendance attendance = getAttendance(id);

        MedicalAttendance medicalAttendance = medicalAttendanceRepository.save(
                MedicalAttendance.builder()
                        .attendanceId(attendance.getId())
                        .patientId(attendance.getPatientId())
                        .patientName(attendance.getPatientName())
                        .assessment(request.assessment().trim())
                        .plan(request.plan().trim())
                        .procedureCode(trimToNull(request.procedureCode()))
                        .cidCodesJson(writeStringList(request.cidCodes()))
                        .medicationsJson(writeJson(request.medications()))
                        .proceduresJson(writeJson(request.procedures()))
                        .observationPrescriptionsJson(writeJson(request.observationPrescriptions()))
                        .examsJson(writeJson(request.exams()))
                        .orientationsJson(writeJson(request.orientations()))
                        .certificatesJson(writeJson(request.certificates()))
                        .declarationsJson(writeJson(request.declarations()))
                        .recipesJson(writeJson(request.recipes()))
                        .notifications(trimToNull(request.notifications()))
                        .accidentMoto(Boolean.TRUE.equals(request.accidentMoto()))
                        .accidentCarro(Boolean.TRUE.equals(request.accidentCarro()))
                        .accidentBicicleta(Boolean.TRUE.equals(request.accidentBicicleta()))
                        .accidentPedestre(Boolean.TRUE.equals(request.accidentPedestre()))
                        .accidentOutros(Boolean.TRUE.equals(request.accidentOutros()))
                        .notes(trimToNull(request.notes()))
                        .professionalName(trimToNull(request.professionalName()) == null ? "Equipe médica" : trimToNull(request.professionalName()))
                        .completedAt(Instant.now())
                        .build()
        );

        attendance.setMedicalAttendanceId(medicalAttendance.getId());
        attendance.setMedicalCompletedAt(Instant.now());
        attendance.setStatus(AmbulatoryStatus.FINALIZADO);
        attendance.setQueueName("FINALIZADO");
        AmbulatoryAttendance saved = ambulatoryAttendanceRepository.save(attendance);

        createTimeline(saved, TimelineEventType.ATENDIMENTO_MEDICO_FINALIZADO, "Atendimento médico finalizado", "Consulta finalizada e prontuário atualizado.");
        medicalRecordSyncService.syncMedicalAttendance(saved, medicalAttendance, request);
        triageEventProducer.publishAmbulatoryFlow(
                "MEDICAL_FINISHED",
                saved.getId(),
                saved.getPatientId(),
                saved.getPatientName(),
                "Atendimento médico finalizado",
                "Atendimento médico finalizado para " + saved.getPatientName() + "."
        );
        createTimeline(saved, TimelineEventType.NOTIFICACAO_GERADA, "Notificação gerada", "Evento de atendimento médico finalizado publicado.");
        return toResponse(saved);
    }

    private AmbulatoryAttendance getAttendance(Long id) {
        return ambulatoryAttendanceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Atendimento ambulatorial não encontrado"));
    }

    private void createTimeline(AmbulatoryAttendance attendance, TimelineEventType type, String title, String description) {
        patientTimelineEventRepository.save(
                PatientTimelineEvent.builder()
                        .patientId(attendance.getPatientId())
                        .attendanceId(attendance.getId())
                        .type(type)
                        .title(title)
                        .description(description)
                        .build()
        );
    }

    private Comparator<AmbulatoryAttendance> queueComparator() {
        return Comparator
                .comparingInt((AmbulatoryAttendance attendance) -> riskRank(attendance.getRiskClassification()))
                .thenComparingInt(attendance -> priorityRank(attendance.getPriority()))
                .thenComparing(AmbulatoryAttendance::getWaitingSince);
    }

    private int riskRank(RiskClassification riskClassification) {
        if (riskClassification == null) {
            return 99;
        }

        return switch (riskClassification) {
            case EMERGENCIA -> 0;
            case MUITO_URGENTE -> 1;
            case URGENTE -> 2;
            case POUCO_URGENTE -> 3;
            case NAO_URGENTE -> 4;
        };
    }

    private int priorityRank(AmbulatoryPriority priority) {
        if (priority == null) {
            return 99;
        }

        return switch (priority) {
            case CRITICA -> 0;
            case ALTA -> 1;
            case NORMAL -> 2;
        };
    }

    private AmbulatoryPriority priorityFromRisk(RiskClassification riskClassification) {
        if (riskClassification == null) {
            return AmbulatoryPriority.NORMAL;
        }

        return switch (riskClassification) {
            case EMERGENCIA, MUITO_URGENTE -> AmbulatoryPriority.CRITICA;
            case URGENTE -> AmbulatoryPriority.ALTA;
            case POUCO_URGENTE, NAO_URGENTE -> AmbulatoryPriority.NORMAL;
        };
    }

    private TriagePriority toTriagePriority(RiskClassification riskClassification) {
        if (riskClassification == null) {
            return TriagePriority.BLUE;
        }

        return switch (riskClassification) {
            case EMERGENCIA -> TriagePriority.RED;
            case MUITO_URGENTE -> TriagePriority.ORANGE;
            case URGENTE -> TriagePriority.YELLOW;
            case POUCO_URGENTE -> TriagePriority.GREEN;
            case NAO_URGENTE -> TriagePriority.BLUE;
        };
    }

    private String writeVaccines(List<VaccineSnapshot> vaccines) {
        try {
            return objectMapper.writeValueAsString(vaccines == null ? List.of() : vaccines);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível serializar vacinas", exception);
        }
    }

    public String writeStringList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? List.of() : values);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível serializar a lista", exception);
        }
    }

    public String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível serializar o conteúdo", exception);
        }
    }

    private List<VaccineSnapshot> readVaccines(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(value, VACCINES_TYPE);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private <T> List<T> readTypedList(String value, TypeReference<List<T>> type) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(value, type);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    public AmbulatoryAttendanceResponse toResponse(AmbulatoryAttendance attendance) {
        return new AmbulatoryAttendanceResponse(
                attendance.getId(),
                attendance.getPatientId(),
                attendance.getPatientName(),
                attendance.getPatientCpf(),
                attendance.getPatientCns(),
                attendance.getPatientPhone(),
                attendance.getPatientAge(),
                attendance.getQueueName(),
                attendance.getStatus(),
                attendance.getRiskClassification(),
                attendance.getPriority(),
                attendance.getWaitingSince(),
                attendance.getTriageStartedAt(),
                attendance.getTriageCompletedAt(),
                attendance.getMedicalStartedAt(),
                attendance.getMedicalCompletedAt(),
                attendance.getTriageId(),
                attendance.getMedicalAttendanceId(),
                attendance.getObservations(),
                attendance.getDestination(),
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
                attendance.getPainLevel(),
                attendance.getHasAllergy(),
                attendance.getAllergyType(),
                attendance.getAllergyDescription(),
                attendance.getAllergySeverity(),
                readVaccines(attendance.getVaccineSnapshotJson()),
                attendance.getCreatedAt(),
                attendance.getUpdatedAt()
        );
    }

    public MedicalAttendanceResponse toMedicalResponse(MedicalAttendance medicalAttendance) {
        return new MedicalAttendanceResponse(
                medicalAttendance.getId(),
                medicalAttendance.getAttendanceId(),
                medicalAttendance.getPatientId(),
                medicalAttendance.getPatientName(),
                medicalAttendance.getAssessment(),
                medicalAttendance.getPlan(),
                medicalAttendance.getProcedureCode(),
                readStringList(medicalAttendance.getCidCodesJson()),
                readTypedList(medicalAttendance.getMedicationsJson(), MEDICATIONS_TYPE),
                readTypedList(medicalAttendance.getProceduresJson(), PROCEDURES_TYPE),
                readTypedList(medicalAttendance.getObservationPrescriptionsJson(), OBSERVATION_PRESCRIPTIONS_TYPE),
                readTypedList(medicalAttendance.getExamsJson(), EXAMS_TYPE),
                readTypedList(medicalAttendance.getOrientationsJson(), ORIENTATIONS_TYPE),
                readTypedList(medicalAttendance.getCertificatesJson(), CERTIFICATES_TYPE),
                readTypedList(medicalAttendance.getDeclarationsJson(), DECLARATIONS_TYPE),
                readTypedList(medicalAttendance.getRecipesJson(), RECIPES_TYPE),
                medicalAttendance.getNotifications(),
                medicalAttendance.isAccidentMoto(),
                medicalAttendance.isAccidentCarro(),
                medicalAttendance.isAccidentBicicleta(),
                medicalAttendance.isAccidentPedestre(),
                medicalAttendance.isAccidentOutros(),
                medicalAttendance.getNotes(),
                medicalAttendance.getProfessionalName(),
                medicalAttendance.getCreatedAt(),
                medicalAttendance.getCompletedAt()
        );
    }

    public PatientTimelineEventResponse toTimelineResponse(PatientTimelineEvent event) {
        return new PatientTimelineEventResponse(
                event.getId(),
                event.getPatientId(),
                event.getAttendanceId(),
                event.getType(),
                event.getTitle(),
                event.getDescription(),
                event.getCreatedAt()
        );
    }

    private List<String> readStringList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(value, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return new ArrayList<>();
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultSymptoms(String observations) {
        String trimmed = trimToNull(observations);
        return trimmed == null ? "Acolhimento ambulatorial concluído." : trimmed;
    }

    private String defaultBlank(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? "-" : trimmed;
    }

    private Integer parseInteger(String value, Integer fallback) {
        try {
            return value == null || value.isBlank() ? fallback : Integer.parseInt(value.trim());
        } catch (NumberFormatException exception) {
            return fallback;
        }
    }

    private Double parseDouble(String value, Double fallback) {
        try {
            return value == null || value.isBlank() ? fallback : Double.parseDouble(value.trim().replace(",", "."));
        } catch (NumberFormatException exception) {
            return fallback;
        }
    }
}
