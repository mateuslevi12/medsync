package com.medsync.medicalrecords.controller;

import com.medsync.medicalrecords.dto.*;
import com.medsync.medicalrecords.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR','HEALTH_PROFESSIONAL')")
    public MedicalRecordResponse findPatientRecord(@PathVariable Long patientId) {
        return medicalRecordService.findByPatientId(patientId);
    }

    @GetMapping("/patient/{patientId}/timeline")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR','HEALTH_PROFESSIONAL')")
    public List<PatientTimelineEventResponse> findPatientTimeline(@PathVariable Long patientId) {
        return medicalRecordService.findTimeline(patientId);
    }

    @PostMapping("/patient/{patientId}/triage-records")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public AmbulatoryAttendanceResponse createTriageRecord(
            @PathVariable Long patientId,
            @Valid @RequestBody CreateTriageRecordRequest request
    ) {
        return medicalRecordService.registerTriageRecord(patientId, request);
    }

    @PostMapping("/patient/{patientId}/medical-attendances")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','HEALTH_PROFESSIONAL')")
    public MedicalAttendanceResponse createMedicalAttendance(
            @PathVariable Long patientId,
            @Valid @RequestBody CreateMedicalAttendanceRequest request
    ) {
        return medicalRecordService.registerMedicalAttendance(patientId, request);
    }

    @PostMapping("/patient/{patientId}/timeline-events")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','HEALTH_PROFESSIONAL')")
    public PatientTimelineEventResponse createTimelineEvent(
            @PathVariable Long patientId,
            @Valid @RequestBody CreateTimelineEventRequest request
    ) {
        return medicalRecordService.registerTimelineEvent(patientId, request);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR','HEALTH_PROFESSIONAL')")
    public MedicalRecordSummaryResponse getSummary() {
        return medicalRecordService.findSummary();
    }
}
