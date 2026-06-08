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
@Table(name = "medical_attendance")
public class MedicalAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long attendanceId;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false, length = 150)
    private String patientName;

    @Column(nullable = false, length = 4000)
    private String assessment;

    @Column(nullable = false, length = 4000)
    private String plan;

    @Column(length = 50)
    private String procedureCode;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String cidCodesJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String medicationsJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String proceduresJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String observationPrescriptionsJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String examsJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String orientationsJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String certificatesJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String declarationsJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String recipesJson;

    @Column(length = 255)
    private String notifications;

    @Column(nullable = false)
    private boolean accidentMoto;

    @Column(nullable = false)
    private boolean accidentCarro;

    @Column(nullable = false)
    private boolean accidentBicicleta;

    @Column(nullable = false)
    private boolean accidentPedestre;

    @Column(nullable = false)
    private boolean accidentOutros;

    @Column(length = 2000)
    private String notes;

    @Column(length = 120)
    private String professionalName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private Instant completedAt;

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
