package com.medsync.triage.config;

import com.medsync.triage.model.AmbulatoryAttendance;
import com.medsync.triage.model.AmbulatoryPriority;
import com.medsync.triage.model.AmbulatoryStatus;
import com.medsync.triage.model.PatientTimelineEvent;
import com.medsync.triage.model.RiskClassification;
import com.medsync.triage.model.TimelineEventType;
import com.medsync.triage.model.Triage;
import com.medsync.triage.model.TriagePriority;
import com.medsync.triage.model.TriageStatus;
import com.medsync.triage.repository.AmbulatoryAttendanceRepository;
import com.medsync.triage.repository.PatientTimelineEventRepository;
import com.medsync.triage.repository.TriageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AmbulatoryAttendanceRepository ambulatoryAttendanceRepository;
    private final TriageRepository triageRepository;
    private final PatientTimelineEventRepository patientTimelineEventRepository;

    @Override
    public void run(String... args) {
        if (ambulatoryAttendanceRepository.count() > 0) {
            return;
        }

        AmbulatoryAttendance waitingTriage = ambulatoryAttendanceRepository.save(
                AmbulatoryAttendance.builder()
                        .patientId(1L)
                        .patientName("ABDA BARBOZA DOS SANTOS")
                        .patientCpf("10209405309")
                        .patientCns("706203549544067")
                        .patientPhone("(85) 99740-0655")
                        .patientAge(7)
                        .queueName("ACOLHIMENTO")
                        .status(AmbulatoryStatus.AGUARDANDO_TRIAGEM)
                        .priority(AmbulatoryPriority.NORMAL)
                        .waitingSince(Instant.now().minusSeconds(8 * 3600 + 55 * 60))
                        .build()
        );

        createTimeline(
                waitingTriage,
                TimelineEventType.PACIENTE_INCLUIDO_FILA,
                "Incluído na fila (Acolhimento)",
                "Paciente aguardando avaliação inicial."
        );

        Triage triage = triageRepository.save(
                Triage.builder()
                        .patientId(2L)
                        .patientNameSnapshot("PACIENTE TESTE")
                        .symptoms("Paciente refere cefaleia e febre há 24 horas.")
                        .bloodPressure("12x8")
                        .heartRate(92)
                        .respiratoryRate(18)
                        .temperature(38.1)
                        .oxygenSaturation(97)
                        .painLevel(6)
                        .priority(TriagePriority.YELLOW)
                        .status(TriageStatus.COMPLETED)
                        .notes("Acolhimento concluído, aguardando médico.")
                        .build()
        );

        AmbulatoryAttendance waitingMedical = ambulatoryAttendanceRepository.save(
                AmbulatoryAttendance.builder()
                        .patientId(2L)
                        .patientName("PACIENTE TESTE")
                        .patientCpf("00000000000")
                        .patientCns("000000000000000")
                        .patientPhone("(85) 99999-9999")
                        .patientAge(25)
                        .queueName("ATENDIMENTO MÉDICO")
                        .status(AmbulatoryStatus.AGUARDANDO_MEDICO)
                        .riskClassification(RiskClassification.URGENTE)
                        .priority(AmbulatoryPriority.ALTA)
                        .waitingSince(Instant.now().minusSeconds(26 * 60))
                        .triageStartedAt(Instant.now().minusSeconds(35 * 60))
                        .triageCompletedAt(Instant.now().minusSeconds(28 * 60))
                        .triageId(triage.getId())
                        .observations("Paciente refere cefaleia e febre há 24 horas.")
                        .destination("Atendimento Médico")
                        .weightKg("72")
                        .heightCm("176")
                        .bmi("23.24")
                        .bloodPressure("12x8")
                        .respiratoryRate("18")
                        .heartRate("92")
                        .temperature("38.1")
                        .oxygenSaturation("97")
                        .glucose("104")
                        .painLevel(6)
                        .hasAllergy(true)
                        .allergyType("Medicamento")
                        .allergyDescription("Dipirona")
                        .allergySeverity("Moderada")
                        .vaccineSnapshotJson("""
                                [{"name":"COVID-19","status":"Em dia"},{"name":"Influenza","status":"Pendente"},{"name":"Hepatite B","status":"Em dia"},{"name":"Tétano","status":"Em dia"}]
                                """)
                        .build()
        );

        createTimeline(
                waitingMedical,
                TimelineEventType.PACIENTE_INCLUIDO_FILA,
                "Entrada registrada na fila ambulatorial",
                "Paciente direcionado para o acolhimento."
        );
        createTimeline(
                waitingMedical,
                TimelineEventType.TRIAGEM_FINALIZADA,
                "Acolhimento concluído",
                "Classificação de risco marcada como urgente."
        );
        createTimeline(
                waitingMedical,
                TimelineEventType.ENCAMINHADO_MEDICO,
                "Encaminhado para atendimento médico",
                "Aguardando chamado do consultório 02."
        );
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
}
