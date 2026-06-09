package com.medsync.triage.controller;

import com.medsync.triage.dto.CreateTriageRequest;
import com.medsync.triage.dto.TriageResponse;
import com.medsync.triage.dto.UpdateTriageRequest;
import com.medsync.triage.dto.UpdateTriageStatusRequest;
import com.medsync.triage.service.TriageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/triage")
@RequiredArgsConstructor
public class TriageController {

    private final TriageService triageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public TriageResponse create(@Valid @RequestBody CreateTriageRequest request) {
        return triageService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR','HEALTH_PROFESSIONAL')")
    public List<TriageResponse> findAll() {
        return triageService.findAll();
    }

    @GetMapping("/waiting")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR','HEALTH_PROFESSIONAL')")
    public List<TriageResponse> findWaiting() {
        return triageService.findWaiting();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR','HEALTH_PROFESSIONAL')")
    public TriageResponse findById(@PathVariable Long id) {
        return triageService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public TriageResponse update(@PathVariable Long id, @Valid @RequestBody UpdateTriageRequest request) {
        return triageService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public TriageResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateTriageStatusRequest request) {
        return triageService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public void delete(@PathVariable Long id) {
        triageService.delete(id);
    }
}
