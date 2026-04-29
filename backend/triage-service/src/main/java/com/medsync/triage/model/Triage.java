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
@Table(name = "triage")
public class Triage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false, length = 150)
    private String patientNameSnapshot;

    @Column(nullable = false, length = 2500)
    private String symptoms;

    @Column(nullable = false, length = 20)
    private String bloodPressure;

    @Column(nullable = false)
    private Integer heartRate;

    @Column(nullable = false)
    private Integer respiratoryRate;

    @Column(nullable = false)
    private Double temperature;

    @Column(nullable = false)
    private Integer oxygenSaturation;

    @Column(nullable = false)
    private Integer painLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TriagePriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private TriageStatus status;

    @Column(length = 1000)
    private String notes;

    @Column
    private Long createdByUserId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
