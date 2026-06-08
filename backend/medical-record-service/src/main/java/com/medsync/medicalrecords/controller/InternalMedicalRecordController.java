package com.medsync.medicalrecords.controller;

import com.medsync.medicalrecords.dto.*;
import com.medsync.medicalrecords.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medical-records/internal")
@RequiredArgsConstructor
public class InternalMedicalRecordController {

    private static final String INTERNAL_HEADER = "X-Internal-Token";

    private final MedicalRecordService medicalRecordService;

    @Value("${app.internal.token}")
    private String internalToken;

    @PutMapping("/patient/{patientId}/snapshot")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void upsertPatientSnapshot(
            @RequestHeader(INTERNAL_HEADER) String token,
            @PathVariable Long patientId,
            @Valid @RequestBody UpsertPatientSnapshotRequest request
    ) {
        assertInternalToken(token);
        medicalRecordService.upsertPatientSnapshot(patientId, request);
    }

    @PostMapping("/patient/{patientId}/triage-records")
    @ResponseStatus(HttpStatus.CREATED)
    public AmbulatoryAttendanceResponse createTriageRecord(
            @RequestHeader(INTERNAL_HEADER) String token,
            @PathVariable Long patientId,
            @Valid @RequestBody CreateTriageRecordRequest request
    ) {
        assertInternalToken(token);
        return medicalRecordService.registerTriageRecord(patientId, request);
    }

    @PostMapping("/patient/{patientId}/medical-attendances")
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalAttendanceResponse createMedicalAttendance(
            @RequestHeader(INTERNAL_HEADER) String token,
            @PathVariable Long patientId,
            @Valid @RequestBody CreateMedicalAttendanceRequest request
    ) {
        assertInternalToken(token);
        return medicalRecordService.registerMedicalAttendance(patientId, request);
    }

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void createEvent(
            @RequestHeader(INTERNAL_HEADER) String token,
            @Valid @RequestBody InternalFlowEventRequest request
    ) {
        assertInternalToken(token);
        medicalRecordService.registerInternalFlowEvent(request);
    }

    private void assertInternalToken(String token) {
        if (internalToken == null || !internalToken.equals(token)) {
            throw new org.springframework.security.access.AccessDeniedException("Token interno inválido");
        }
    }
}
