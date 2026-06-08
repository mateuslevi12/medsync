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
public class MedicalAttendanceRecord {
    private String id;
    private Long attendanceId;
    private String assessment;
    private String plan;
    private String procedureCode;
    private String cidCodesJson;
    private String medicationsJson;
    private String proceduresJson;
    private String observationPrescriptionsJson;
    private String examsJson;
    private String orientationsJson;
    private String certificatesJson;
    private String declarationsJson;
    private String recipesJson;
    private String notifications;
    private AccidentInfo accidentInfo;
    private String notes;
    private String professionalName;
    private Instant startedAt;
    private Instant completedAt;
}
