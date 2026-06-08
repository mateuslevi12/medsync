package com.medsync.medicalrecords.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventEnvelope {
    private String eventId;
    private String eventType;
    private String aggregateId;
    private Instant occurredAt;
    private JsonNode payload;
}
