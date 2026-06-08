package com.medsync.patients.service;

import com.medsync.patients.dto.CreatePatientAllergyRequest;
import com.medsync.patients.dto.CreatePatientVaccineRequest;
import com.medsync.patients.dto.PatientAllergyResponse;
import com.medsync.patients.dto.PatientVaccineResponse;
import com.medsync.patients.dto.UpdatePatientVaccineRequest;
import com.medsync.patients.exception.NotFoundException;
import com.medsync.patients.model.Patient;
import com.medsync.patients.model.PatientAllergy;
import com.medsync.patients.model.PatientVaccine;
import com.medsync.patients.repository.PatientAllergyRepository;
import com.medsync.patients.repository.PatientRepository;
import com.medsync.patients.repository.PatientVaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientClinicalInfoService {

    private final PatientRepository patientRepository;
    private final PatientAllergyRepository patientAllergyRepository;
    private final PatientVaccineRepository patientVaccineRepository;
    private final CacheManager cacheManager;

    @Transactional(readOnly = true)
    public List<PatientAllergyResponse> findAllergies(Long patientId) {
        assertPatientExists(patientId);
        return patientAllergyRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::toAllergyResponse)
                .toList();
    }

    @Transactional
    public PatientAllergyResponse createAllergy(Long patientId, CreatePatientAllergyRequest request) {
        Patient patient = getPatient(patientId);

        PatientAllergy saved = patientAllergyRepository.save(
                PatientAllergy.builder()
                        .patient(patient)
                        .type(request.type())
                        .description(request.description().trim())
                        .severity(request.severity())
                        .build()
        );

        evictPatientCaches(patientId, patient.getDocumentNumber());
        return toAllergyResponse(saved);
    }

    @Transactional
    public void deleteAllergy(Long patientId, Long allergyId) {
        Patient patient = getPatient(patientId);
        PatientAllergy allergy = patientAllergyRepository.findByIdAndPatientId(allergyId, patientId)
                .orElseThrow(() -> new NotFoundException("Alergia não encontrada"));

        patientAllergyRepository.delete(allergy);
        evictPatientCaches(patientId, patient.getDocumentNumber());
    }

    @Transactional(readOnly = true)
    public List<PatientVaccineResponse> findVaccines(Long patientId) {
        assertPatientExists(patientId);
        return patientVaccineRepository.findByPatientIdOrderByNameAsc(patientId)
                .stream()
                .map(this::toVaccineResponse)
                .toList();
    }

    @Transactional
    public PatientVaccineResponse createVaccine(Long patientId, CreatePatientVaccineRequest request) {
        Patient patient = getPatient(patientId);

        PatientVaccine saved = patientVaccineRepository.save(
                PatientVaccine.builder()
                        .patient(patient)
                        .name(request.name().trim())
                        .status(request.status())
                        .applicationDate(request.applicationDate())
                        .notes(trimToNull(request.notes()))
                        .build()
        );

        evictPatientCaches(patientId, patient.getDocumentNumber());
        return toVaccineResponse(saved);
    }

    @Transactional
    public PatientVaccineResponse updateVaccine(Long patientId, Long vaccineId, UpdatePatientVaccineRequest request) {
        Patient patient = getPatient(patientId);
        PatientVaccine vaccine = patientVaccineRepository.findByIdAndPatientId(vaccineId, patientId)
                .orElseThrow(() -> new NotFoundException("Vacina não encontrada"));

        vaccine.setName(request.name().trim());
        vaccine.setStatus(request.status());
        vaccine.setApplicationDate(request.applicationDate());
        vaccine.setNotes(trimToNull(request.notes()));

        PatientVaccine saved = patientVaccineRepository.save(vaccine);
        evictPatientCaches(patientId, patient.getDocumentNumber());
        return toVaccineResponse(saved);
    }

    private void assertPatientExists(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new NotFoundException("Paciente não encontrado");
        }
    }

    private Patient getPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new NotFoundException("Paciente não encontrado"));
    }

    private PatientAllergyResponse toAllergyResponse(PatientAllergy allergy) {
        return new PatientAllergyResponse(
                allergy.getId(),
                allergy.getPatient().getId(),
                allergy.getType(),
                allergy.getDescription(),
                allergy.getSeverity(),
                allergy.getCreatedAt()
        );
    }

    private PatientVaccineResponse toVaccineResponse(PatientVaccine vaccine) {
        return new PatientVaccineResponse(
                vaccine.getId(),
                vaccine.getPatient().getId(),
                vaccine.getName(),
                vaccine.getStatus(),
                vaccine.getApplicationDate(),
                vaccine.getNotes(),
                vaccine.getCreatedAt()
        );
    }

    private void evictPatientCaches(Long patientId, String cpf) {
        Cache idCache = cacheManager.getCache("patientsById");
        if (idCache != null) {
            idCache.evict(patientId);
        }

        Cache cpfCache = cacheManager.getCache("patientsByCpf");
        if (cpfCache != null && cpf != null && !cpf.isBlank()) {
            cpfCache.evict(cpf.trim().toLowerCase());
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
