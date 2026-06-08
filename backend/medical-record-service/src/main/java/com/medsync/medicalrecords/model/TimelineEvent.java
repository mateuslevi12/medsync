package com.medsync.medicalrecords.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEvent {
    private String id;
    private TimelineEventType type;
    private String title;
    private String description;
    private Long attendanceId;
    private String sourceService;
    private Instant createdAt;
    @Builder.Default
    private Map<String, Object> metadata = new LinkedHashMap<>();
}
