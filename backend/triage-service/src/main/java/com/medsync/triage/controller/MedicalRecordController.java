package com.medsync.triage.controller;

import com.medsync.triage.dto.FinishMedicalAttendanceRequest;
import com.medsync.triage.dto.MedicalAttendanceResponse;
import com.medsync.triage.dto.MedicalRecordResponse;
import com.medsync.triage.dto.PatientTimelineEventResponse;
import com.medsync.triage.service.MedicalRecordService;
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
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public MedicalRecordResponse findPatientRecord(@PathVariable Long patientId) {
        return medicalRecordService.findByPatientId(patientId);
    }

    @GetMapping("/patient/{patientId}/timeline")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public List<PatientTimelineEventResponse> findPatientTimeline(@PathVariable Long patientId) {
        return medicalRecordService.findTimeline(patientId);
    }

    @PostMapping("/patient/{patientId}/medical-attendances")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL')")
    public MedicalAttendanceResponse createManualMedicalAttendance(
            @PathVariable Long patientId,
            @Valid @RequestBody FinishMedicalAttendanceRequest request
    ) {
        return medicalRecordService.createManualMedicalAttendance(patientId, request);
    }
}
