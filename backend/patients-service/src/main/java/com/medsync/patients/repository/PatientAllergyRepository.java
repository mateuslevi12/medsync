package com.medsync.patients.repository;

import com.medsync.patients.model.PatientAllergy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientAllergyRepository extends JpaRepository<PatientAllergy, Long> {
    List<PatientAllergy> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    Optional<PatientAllergy> findByIdAndPatientId(Long id, Long patientId);
}
