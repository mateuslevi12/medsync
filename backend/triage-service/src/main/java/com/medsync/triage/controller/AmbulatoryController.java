package com.medsync.triage.controller;

import com.medsync.triage.dto.AmbulatoryAttendanceResponse;
import com.medsync.triage.dto.CompleteTriageRequest;
import com.medsync.triage.dto.CreateAmbulatoryAttendanceRequest;
import com.medsync.triage.dto.FinishMedicalAttendanceRequest;
import com.medsync.triage.service.AmbulatoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ambulatory")
@RequiredArgsConstructor
public class AmbulatoryController {

    private final AmbulatoryService ambulatoryService;

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public List<AmbulatoryAttendanceResponse> findQueue() {
        return ambulatoryService.findQueue();
    }

    @PostMapping("/queue")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public AmbulatoryAttendanceResponse create(@Valid @RequestBody CreateAmbulatoryAttendanceRequest request) {
        return ambulatoryService.createAttendance(request);
    }

    @GetMapping("/queue/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public AmbulatoryAttendanceResponse findById(@PathVariable Long id) {
        return ambulatoryService.findById(id);
    }

    @PatchMapping("/queue/{id}/call-triage")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public AmbulatoryAttendanceResponse callTriage(@PathVariable Long id) {
        return ambulatoryService.callTriage(id);
    }

    @PatchMapping("/queue/{id}/complete-triage")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL')")
    public AmbulatoryAttendanceResponse completeTriage(
            @PathVariable Long id,
            @Valid @RequestBody CompleteTriageRequest request
    ) {
        return ambulatoryService.completeTriage(id, request);
    }

    @PatchMapping("/queue/{id}/call-medical")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL')")
    public AmbulatoryAttendanceResponse callMedical(@PathVariable Long id) {
        return ambulatoryService.callMedical(id);
    }

    @PatchMapping("/queue/{id}/finish-medical")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL')")
    public AmbulatoryAttendanceResponse finishMedical(
            @PathVariable Long id,
            @Valid @RequestBody FinishMedicalAttendanceRequest request
    ) {
        return ambulatoryService.finishMedical(id, request);
    }
}
