package com.medsync.triage.service;

import com.medsync.triage.dto.*;
import com.medsync.triage.exception.NotFoundException;
import com.medsync.triage.model.*;
import com.medsync.triage.repository.AmbulatoryAttendanceRepository;
import com.medsync.triage.repository.MedicalAttendanceRepository;
import com.medsync.triage.repository.PatientTimelineEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final AmbulatoryAttendanceRepository ambulatoryAttendanceRepository;
    private final MedicalAttendanceRepository medicalAttendanceRepository;
    private final PatientTimelineEventRepository patientTimelineEventRepository;
    private final AmbulatoryService ambulatoryService;

    @Transactional(readOnly = true)
    public MedicalRecordResponse findByPatientId(Long patientId) {
        List<AmbulatoryAttendance> attendances = ambulatoryAttendanceRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        if (attendances.isEmpty()) {
            throw new NotFoundException("Nenhum prontuário encontrado para este paciente");
        }

        AmbulatoryAttendance latest = attendances.get(0);
        List<MedicalAttendanceResponse> medicalAttendances = medicalAttendanceRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(ambulatoryService::toMedicalResponse)
                .toList();

        return new MedicalRecordResponse(
                latest.getPatientId(),
                latest.getPatientName(),
                latest.getPatientCpf(),
                latest.getPatientCns(),
                latest.getPatientAge(),
                latest.getPatientPhone(),
                attendances.stream().map(ambulatoryService::toResponse).toList(),
                medicalAttendances,
                findTimeline(patientId)
        );
    }

    @Transactional(readOnly = true)
    public List<PatientTimelineEventResponse> findTimeline(Long patientId) {
        return patientTimelineEventRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(ambulatoryService::toTimelineResponse)
                .toList();
    }

    @Transactional
    public MedicalAttendanceResponse createManualMedicalAttendance(Long patientId, FinishMedicalAttendanceRequest request) {
        AmbulatoryAttendance baseAttendance = ambulatoryAttendanceRepository.findTopByPatientIdOrderByCreatedAtDesc(patientId)
                .orElseGet(() -> createManualAttendance(patientId));

        MedicalAttendance medicalAttendance = medicalAttendanceRepository.save(
                MedicalAttendance.builder()
                        .attendanceId(baseAttendance.getId())
                        .patientId(baseAttendance.getPatientId())
                        .patientName(baseAttendance.getPatientName())
                        .assessment(request.assessment().trim())
                        .plan(request.plan().trim())
                        .procedureCode(request.procedureCode() == null ? null : request.procedureCode().trim())
                        .cidCodesJson(ambulatoryService.writeStringList(request.cidCodes()))
                        .notifications(request.notifications() == null ? null : request.notifications().trim())
                        .notes(request.notes() == null ? null : request.notes().trim())
                        .professionalName(request.professionalName() == null ? "Equipe médica" : request.professionalName().trim())
                        .accidentMoto(Boolean.TRUE.equals(request.accidentMoto()))
                        .accidentCarro(Boolean.TRUE.equals(request.accidentCarro()))
                        .accidentBicicleta(Boolean.TRUE.equals(request.accidentBicicleta()))
                        .accidentPedestre(Boolean.TRUE.equals(request.accidentPedestre()))
                        .accidentOutros(Boolean.TRUE.equals(request.accidentOutros()))
                        .completedAt(Instant.now())
                        .build()
        );

        baseAttendance.setMedicalAttendanceId(medicalAttendance.getId());
        baseAttendance.setMedicalCompletedAt(Instant.now());
        baseAttendance.setStatus(AmbulatoryStatus.FINALIZADO);
        ambulatoryAttendanceRepository.save(baseAttendance);

        patientTimelineEventRepository.save(
                PatientTimelineEvent.builder()
                        .patientId(patientId)
                        .attendanceId(baseAttendance.getId())
                        .type(TimelineEventType.ATENDIMENTO_MEDICO_FINALIZADO)
                        .title("Atendimento médico registrado manualmente")
                        .description("Registro incluído diretamente no prontuário.")
                        .build()
        );

        return ambulatoryService.toMedicalResponse(medicalAttendance);
    }

    private AmbulatoryAttendance createManualAttendance(Long patientId) {
        return ambulatoryAttendanceRepository.save(
                AmbulatoryAttendance.builder()
                        .patientId(patientId)
                        .patientName("Paciente " + patientId)
                        .patientCpf("NÃO INFORMADO")
                        .queueName("ATENDIMENTO MÉDICO")
                        .priority(AmbulatoryPriority.NORMAL)
                        .status(AmbulatoryStatus.EM_ATENDIMENTO_MEDICO)
                        .waitingSince(Instant.now())
                        .medicalStartedAt(Instant.now())
                        .build()
        );
    }
}
