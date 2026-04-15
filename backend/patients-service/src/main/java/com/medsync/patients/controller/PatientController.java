package com.medsync.patients.controller;

import com.medsync.patients.dto.CreatePatientRequest;
import com.medsync.patients.dto.PatientResponse;
import com.medsync.patients.dto.UpdatePatientRequest;
import com.medsync.patients.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public PatientResponse create(@Valid @RequestBody CreatePatientRequest request) {
        return patientService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public List<PatientResponse> findAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String cpf
    ) {
        return patientService.findAll(name, cpf);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public PatientResponse findById(@PathVariable Long id) {
        return patientService.findById(id);
    }

    @GetMapping("/cpf/{cpf}")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public PatientResponse findByCpf(@PathVariable String cpf) {
        return patientService.findByCpf(cpf);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public PatientResponse update(@PathVariable Long id, @Valid @RequestBody UpdatePatientRequest request) {
        return patientService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public void delete(@PathVariable Long id) {
        patientService.delete(id);
    }
}
