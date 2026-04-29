package com.medsync.triage.messaging;

import com.medsync.triage.model.Triage;
import com.medsync.triage.model.TriagePriority;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TriageEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.triage-created}")
    private String triageCreatedTopic;

    @Value("${app.kafka.topics.triage-updated}")
    private String triageUpdatedTopic;

    @Value("${app.kafka.topics.triage-priority-changed}")
    private String triagePriorityChangedTopic;

    public void publishCreated(Triage triage) {
        publish(
                triageCreatedTopic,
                "TRIAGE_CREATED",
                triage,
                Map.of(
                        "triageId", triage.getId(),
                        "patientId", triage.getPatientId(),
                        "patientNameSnapshot", triage.getPatientNameSnapshot(),
                        "status", triage.getStatus(),
                        "priority", triage.getPriority()
                )
        );
    }

    public void publishUpdated(Triage triage) {
        publish(
                triageUpdatedTopic,
                "TRIAGE_UPDATED",
                triage,
                Map.of(
                        "triageId", triage.getId(),
                        "patientId", triage.getPatientId(),
                        "status", triage.getStatus(),
                        "priority", triage.getPriority()
                )
        );
    }

    public void publishPriorityChanged(Triage triage, TriagePriority previousPriority) {
        publish(
                triagePriorityChangedTopic,
                "TRIAGE_PRIORITY_CHANGED",
                triage,
                Map.of(
                        "triageId", triage.getId(),
                        "patientId", triage.getPatientId(),
                        "previousPriority", previousPriority,
                        "currentPriority", triage.getPriority(),
                        "status", triage.getStatus()
                )
        );
    }

    private void publish(String topic, String eventType, Triage triage, Object payload) {
        EventEnvelope envelope = EventEnvelope.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .aggregateId(String.valueOf(triage.getId()))
                .occurredAt(Instant.now())
                .payload(payload)
                .build();

        kafkaTemplate.send(topic, String.valueOf(triage.getId()), envelope);
    }
}
