package com.medsync.triage.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ambulatory_attendance")
public class AmbulatoryAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false, length = 150)
    private String patientName;

    @Column(nullable = false, length = 50)
    private String patientCpf;

    @Column(length = 50)
    private String patientCns;

    @Column(length = 30)
    private String patientPhone;

    @Column
    private Integer patientAge;

    @Column(nullable = false, length = 60)
    private String queueName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AmbulatoryStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private RiskClassification riskClassification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AmbulatoryPriority priority;

    @Column(nullable = false)
    private Instant waitingSince;

    @Column
    private Instant triageStartedAt;

    @Column
    private Instant triageCompletedAt;

    @Column
    private Instant medicalStartedAt;

    @Column
    private Instant medicalCompletedAt;

    @Column
    private Long triageId;

    @Column
    private Long medicalAttendanceId;

    @Column(length = 2000)
    private String observations;

    @Column(length = 120)
    private String destination;

    @Column(length = 20)
    private String weightKg;

    @Column(length = 20)
    private String heightCm;

    @Column(length = 20)
    private String bmi;

    @Column(length = 20)
    private String abdominalCircumference;

    @Column(length = 20)
    private String bloodPressure;

    @Column(length = 20)
    private String respiratoryRate;

    @Column(length = 20)
    private String heartRate;

    @Column(length = 20)
    private String temperature;

    @Column(length = 20)
    private String oxygenSaturation;

    @Column(length = 20)
    private String glucose;

    @Column
    private Integer painLevel;

    @Column
    private Boolean hasAllergy;

    @Column(length = 50)
    private String allergyType;

    @Column(length = 255)
    private String allergyDescription;

    @Column(length = 30)
    private String allergySeverity;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String vaccineSnapshotJson;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.waitingSince == null) {
            this.waitingSince = now;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
