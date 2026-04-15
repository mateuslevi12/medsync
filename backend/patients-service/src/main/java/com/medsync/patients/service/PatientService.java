package com.medsync.patients.service;

import com.medsync.patients.dto.CreatePatientRequest;
import com.medsync.patients.dto.PatientResponse;
import com.medsync.patients.dto.UpdatePatientRequest;
import com.medsync.patients.exception.ConflictException;
import com.medsync.patients.exception.NotFoundException;
import com.medsync.patients.model.Patient;
import com.medsync.patients.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientResponse create(CreatePatientRequest request) {
        if (patientRepository.existsByDocumentNumberIgnoreCase(request.documentNumber())) {
            throw new ConflictException("Patient with this documentNumber already exists");
        }

        Patient patient = Patient.builder()
                .fullName(request.fullName().trim())
                .birthDate(request.birthDate())
                .gender(request.gender())
                .phone(request.phone().trim())
                .documentNumber(request.documentNumber().trim())
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

    public PatientResponse findById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Patient not found"));
        return toResponse(patient);
    }

    public PatientResponse findByCpf(String cpf) {
        Patient patient = patientRepository.findByDocumentNumberIgnoreCase(cpf.trim())
                .orElseThrow(() -> new NotFoundException("Patient not found"));
        return toResponse(patient);
    }

    public PatientResponse update(Long id, UpdatePatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Patient not found"));

        if (!patient.getDocumentNumber().equalsIgnoreCase(request.documentNumber())
                && patientRepository.existsByDocumentNumberIgnoreCase(request.documentNumber())) {
            throw new ConflictException("Patient with this documentNumber already exists");
        }

        patient.setFullName(request.fullName().trim());
        patient.setBirthDate(request.birthDate());
        patient.setGender(request.gender());
        patient.setPhone(request.phone().trim());
        patient.setDocumentNumber(request.documentNumber().trim());
        patient.setAddress(request.address().trim());

        Patient updated = patientRepository.save(patient);
        return toResponse(updated);
    }

    public void delete(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Patient not found"));
        patientRepository.delete(patient);
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getFullName(),
                patient.getBirthDate(),
                patient.getGender(),
                patient.getPhone(),
                patient.getDocumentNumber(),
                patient.getAddress(),
                patient.getCreatedAt(),
                patient.getUpdatedAt()
        );
    }
}
