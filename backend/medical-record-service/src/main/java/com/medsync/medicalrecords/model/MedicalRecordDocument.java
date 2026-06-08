package com.medsync.medicalrecords.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "medical_records")
public class MedicalRecordDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private Long patientId;

    private String patientName;
    private String patientCpf;
    private String patientCns;
    private Integer patientAge;
    private String patientPhone;
    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    private List<AllergySnapshot> allergiesSnapshot = new ArrayList<>();

    @Builder.Default
    private List<VaccineSnapshot> vaccinesSnapshot = new ArrayList<>();

    @Builder.Default
    private List<TriageRecord> triages = new ArrayList<>();

    @Builder.Default
    private List<MedicalAttendanceRecord> medicalAttendances = new ArrayList<>();

    @Builder.Default
    private List<TimelineEvent> timelineEvents = new ArrayList<>();
}
