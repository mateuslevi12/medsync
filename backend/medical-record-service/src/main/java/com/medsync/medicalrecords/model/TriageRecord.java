package com.medsync.medicalrecords.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageRecord {
    private String id;
    private Long attendanceId;
    private Long triageId;
    private String queueName;
    private String status;
    private String priority;
    private String riskClassification;
    private Instant waitingSince;
    private Instant triageStartedAt;
    private Instant triageCompletedAt;
    private VitalSigns vitalSigns;
    @Builder.Default
    private List<AllergySnapshot> allergiesSnapshot = new ArrayList<>();
    @Builder.Default
    private List<VaccineSnapshot> vaccinesSnapshot = new ArrayList<>();
    private String observations;
    private String destination;
    private String professionalName;
    private Instant createdAt;
}
