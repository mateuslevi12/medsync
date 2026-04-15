package com.medsync.patients.repository;

import com.medsync.patients.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    boolean existsByDocumentNumberIgnoreCase(String documentNumber);

    Optional<Patient> findByDocumentNumberIgnoreCase(String documentNumber);

    List<Patient> findByFullNameContainingIgnoreCase(String fullName);

    List<Patient> findByFullNameContainingIgnoreCaseAndDocumentNumberIgnoreCase(String fullName, String documentNumber);
}
