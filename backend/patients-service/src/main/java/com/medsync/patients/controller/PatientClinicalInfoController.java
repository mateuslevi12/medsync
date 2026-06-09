package com.medsync.patients.controller;

import com.medsync.patients.dto.CreatePatientAllergyRequest;
import com.medsync.patients.dto.CreatePatientVaccineRequest;
import com.medsync.patients.dto.PatientAllergyResponse;
import com.medsync.patients.dto.PatientVaccineResponse;
import com.medsync.patients.dto.UpdatePatientVaccineRequest;
import com.medsync.patients.service.PatientClinicalInfoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}")
@RequiredArgsConstructor
public class PatientClinicalInfoController {

    private final PatientClinicalInfoService patientClinicalInfoService;

    @GetMapping("/allergies")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR','HEALTH_PROFESSIONAL')")
    public List<PatientAllergyResponse> findAllergies(@PathVariable Long patientId) {
        return patientClinicalInfoService.findAllergies(patientId);
    }

    @PostMapping("/allergies")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public PatientAllergyResponse createAllergy(
            @PathVariable Long patientId,
            @Valid @RequestBody CreatePatientAllergyRequest request
    ) {
        return patientClinicalInfoService.createAllergy(patientId, request);
    }

    @DeleteMapping("/allergies/{allergyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public void deleteAllergy(@PathVariable Long patientId, @PathVariable Long allergyId) {
        patientClinicalInfoService.deleteAllergy(patientId, allergyId);
    }

    @GetMapping("/vaccines")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR','HEALTH_PROFESSIONAL')")
    public List<PatientVaccineResponse> findVaccines(@PathVariable Long patientId) {
        return patientClinicalInfoService.findVaccines(patientId);
    }

    @PostMapping("/vaccines")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public PatientVaccineResponse createVaccine(
            @PathVariable Long patientId,
            @Valid @RequestBody CreatePatientVaccineRequest request
    ) {
        return patientClinicalInfoService.createVaccine(patientId, request);
    }

    @PutMapping("/vaccines/{vaccineId}")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','HEALTH_PROFESSIONAL')")
    public PatientVaccineResponse updateVaccine(
            @PathVariable Long patientId,
            @PathVariable Long vaccineId,
            @Valid @RequestBody UpdatePatientVaccineRequest request
    ) {
        return patientClinicalInfoService.updateVaccine(patientId, vaccineId, request);
    }
}
