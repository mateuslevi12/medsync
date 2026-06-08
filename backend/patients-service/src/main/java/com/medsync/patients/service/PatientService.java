package com.medsync.patients.service;

import com.medsync.patients.dto.CreatePatientRequest;
import com.medsync.patients.dto.PatientResponse;
import com.medsync.patients.dto.UpdatePatientRequest;
import com.medsync.patients.exception.ConflictException;
import com.medsync.patients.exception.NotFoundException;
import com.medsync.patients.model.Patient;
import com.medsync.patients.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final CacheManager cacheManager;

    public PatientResponse create(CreatePatientRequest request) {
        if (patientRepository.existsByDocumentNumberIgnoreCase(request.documentNumber())) {
            throw new ConflictException("Já existe paciente com este documento");
        }

        Patient patient = Patient.builder()
                .fullName(request.fullName().trim())
                .birthDate(request.birthDate())
                .gender(request.gender())
                .phone(request.phone().trim())
                .documentNumber(request.documentNumber().trim())
                .cns(trimToNull(request.cns()))
                .address(request.address().trim())
                .build();

        Patient saved = patientRepository.save(patient);
        return toResponse(saved);
    }

    public List<PatientResponse> findAll(String name, String cpf) {
        String normalizedName = StringUtils.hasText(name) ? name.trim() : null;
        String normalizedCpf = StringUtils.hasText(cpf) ? cpf.trim() : null;

        List<Patient> patients;

        if (normalizedName != null && normalizedCpf != null) {
            patients = patientRepository.findByFullNameContainingIgnoreCaseAndDocumentNumberIgnoreCase(
                    normalizedName,
                    normalizedCpf
            );
        } else if (normalizedName != null) {
            patients = patientRepository.findByFullNameContainingIgnoreCase(normalizedName);
        } else if (normalizedCpf != null) {
            patients = patientRepository.findByDocumentNumberIgnoreCase(normalizedCpf)
                    .map(List::of)
                    .orElse(List.of());
        } else {
            patients = patientRepository.findAll();
        }

        return patients.stream().map(this::toResponse).toList();
    }

    @Cacheable(value = "patientsById", key = "#id")
    public PatientResponse findById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Paciente não encontrado"));
        return toResponse(patient);
    }

    @Cacheable(value = "patientsByCpf", key = "#cpf.trim().toLowerCase()")
    public PatientResponse findByCpf(String cpf) {
        Patient patient = patientRepository.findByDocumentNumberIgnoreCase(cpf.trim())
                .orElseThrow(() -> new NotFoundException("Paciente não encontrado"));
        return toResponse(patient);
    }

    public PatientResponse update(Long id, UpdatePatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Paciente não encontrado"));

        String oldCpf = patient.getDocumentNumber().trim().toLowerCase();
        String newCpf = request.documentNumber().trim().toLowerCase();

        if (!patient.getDocumentNumber().equalsIgnoreCase(request.documentNumber())
                && patientRepository.existsByDocumentNumberIgnoreCase(request.documentNumber())) {
            throw new ConflictException("Já existe paciente com este documento");
        }

        patient.setFullName(request.fullName().trim());
        patient.setBirthDate(request.birthDate());
        patient.setGender(request.gender());
        patient.setPhone(request.phone().trim());
        patient.setDocumentNumber(request.documentNumber().trim());
        patient.setCns(trimToNull(request.cns()));
        patient.setAddress(request.address().trim());

        Patient updated = patientRepository.save(patient);
        evictPatientCaches(updated.getId(), oldCpf, newCpf);
        return toResponse(updated);
    }

    public void delete(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Paciente não encontrado"));
        String cpf = patient.getDocumentNumber().trim().toLowerCase();
        patientRepository.delete(patient);
        evictPatientCaches(id, cpf);
    }

    private void evictPatientCaches(Long id, String... cpfs) {
        Cache idCache = cacheManager.getCache("patientsById");
        if (idCache != null) {
            idCache.evict(id);
        }

        Cache cpfCache = cacheManager.getCache("patientsByCpf");
        if (cpfCache != null && cpfs != null) {
            for (String cpf : cpfs) {
                if (cpf != null && !cpf.isBlank()) {
                    cpfCache.evict(cpf);
                }
            }
        }
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getFullName(),
                patient.getBirthDate(),
                patient.getGender(),
                patient.getPhone(),
                patient.getDocumentNumber(),
                patient.getCns(),
                patient.getAddress(),
                patient.getCreatedAt(),
                patient.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
