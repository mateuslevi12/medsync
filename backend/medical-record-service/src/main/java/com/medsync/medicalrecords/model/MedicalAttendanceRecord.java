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
    @Builder.Default
    private List<String> cidCodes = new ArrayList<>();
    @Builder.Default
    private List<String> exams = new ArrayList<>();
    @Builder.Default
    private List<String> medications = new ArrayList<>();
    @Builder.Default
    private List<String> prescriptions = new ArrayList<>();
    private String notifications;
    private AccidentInfo accidentInfo;
    private String notes;
    private String professionalName;
    private Instant startedAt;
    private Instant completedAt;
}
