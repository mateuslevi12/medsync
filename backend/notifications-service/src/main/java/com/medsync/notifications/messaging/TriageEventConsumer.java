package com.medsync.notifications.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.medsync.notifications.model.NotificationType;
import com.medsync.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TriageEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "${app.kafka.topics.triage-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void onTriageCreated(EventEnvelope event) {
        JsonNode payload = event.getPayload();
        String triageId = text(payload, "triageId", event.getAggregateId());
        String patientName = text(payload, "patientNameSnapshot", "Paciente");

        notificationService.createFromEvent(
                event.getEventId(),
                event.getAggregateId(),
                NotificationType.TRIAGE_CREATED,
                "Nova triagem registrada",
                "Triagem " + triageId + " criada para " + patientName + "."
        );
    }

    @KafkaListener(topics = "${app.kafka.topics.triage-updated}", groupId = "${spring.kafka.consumer.group-id}")
    public void onTriageUpdated(EventEnvelope event) {
        JsonNode payload = event.getPayload();
        String triageId = text(payload, "triageId", event.getAggregateId());
        String status = text(payload, "status", "-");

        notificationService.createFromEvent(
                event.getEventId(),
                event.getAggregateId(),
                NotificationType.TRIAGE_UPDATED,
                "Triagem atualizada",
                "Triagem " + triageId + " atualizada. Status atual: " + status + "."
        );
    }

    @KafkaListener(topics = "${app.kafka.topics.triage-priority-changed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onTriagePriorityChanged(EventEnvelope event) {
        JsonNode payload = event.getPayload();
        String triageId = text(payload, "triageId", event.getAggregateId());
        String previous = text(payload, "previousPriority", "-");
        String current = text(payload, "currentPriority", "-");

        notificationService.createFromEvent(
                event.getEventId(),
                event.getAggregateId(),
                NotificationType.TRIAGE_PRIORITY_CHANGED,
                "Prioridade da triagem alterada",
                "Triagem " + triageId + " mudou de prioridade " + previous + " para " + current + "."
        );
    }

    @KafkaListener(topics = "${app.kafka.topics.ambulatory-flow}", groupId = "${spring.kafka.consumer.group-id}")
    public void onAmbulatoryFlow(EventEnvelope event) {
        JsonNode payload = event.getPayload();
        String title = text(payload, "title", "Atualização do fluxo ambulatorial");
        String description = text(payload, "description", "Novo evento operacional registrado.");

        notificationService.createFromEvent(
                event.getEventId(),
                event.getAggregateId(),
                mapNotificationType(event.getEventType()),
                title,
                description
        );
    }

    private NotificationType mapNotificationType(String eventType) {
        if (eventType == null || eventType.isBlank()) {
            return NotificationType.TRIAGE_UPDATED;
        }

        return switch (eventType) {
            case "PATIENT_ADDED_TO_QUEUE" -> NotificationType.PATIENT_ADDED_TO_QUEUE;
            case "TRIAGE_STARTED" -> NotificationType.TRIAGE_STARTED;
            case "TRIAGE_COMPLETED" -> NotificationType.TRIAGE_COMPLETED;
            case "PATIENT_REFERRED_TO_MEDICAL" -> NotificationType.PATIENT_REFERRED_TO_MEDICAL;
            case "MEDICAL_STARTED" -> NotificationType.MEDICAL_STARTED;
            case "MEDICAL_FINISHED" -> NotificationType.MEDICAL_FINISHED;
            default -> NotificationType.TRIAGE_UPDATED;
        };
    }

    private String text(JsonNode payload, String key, String fallback) {
        if (payload == null || payload.get(key) == null || payload.get(key).isNull()) {
            return fallback;
        }
        String value = payload.get(key).asText();
        return value == null || value.isBlank() ? fallback : value;
    }
}
