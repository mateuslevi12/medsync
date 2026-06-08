package com.medsync.medicalrecords.messaging;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.medsync.medicalrecords.dto.InternalFlowEventRequest;
import com.medsync.medicalrecords.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AmbulatoryFlowConsumer {

    private final MedicalRecordService medicalRecordService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${app.kafka.topics.ambulatory-flow}", groupId = "${spring.kafka.consumer.group-id}")
    public void onAmbulatoryFlow(EventEnvelope event) {
        JsonNode payload = event.getPayload();
        Long patientId = longValue(payload, "patientId");
        if (patientId == null) {
            log.warn("Evento ambulatory.flow ignorado por falta de patientId: {}", event.getEventId());
            return;
        }

        medicalRecordService.registerInternalFlowEvent(new InternalFlowEventRequest(
                event.getEventId(),
                text(payload, "eventType", event.getEventType()),
                patientId,
                firstLong(payload, "attendanceId", parseLong(event.getAggregateId())),
                text(payload, "patientName", null),
                text(payload, "title", null),
                text(payload, "description", null),
                "triage-service",
                event.getOccurredAt() == null ? Instant.now() : event.getOccurredAt(),
                payload == null ? Map.of() : objectMapper.convertValue(payload, new TypeReference<LinkedHashMap<String, Object>>() {})
        ));
    }

    private String text(JsonNode payload, String key, String fallback) {
        if (payload == null || payload.get(key) == null || payload.get(key).isNull()) {
            return fallback;
        }
        String value = payload.get(key).asText();
        return value == null || value.isBlank() ? fallback : value;
    }

    private Long longValue(JsonNode payload, String key) {
        return firstLong(payload, key, null);
    }

    private Long firstLong(JsonNode payload, String key, Long fallback) {
        if (payload == null || payload.get(key) == null || payload.get(key).isNull()) {
            return fallback;
        }

        try {
            return payload.get(key).asLong();
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private Long parseLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
