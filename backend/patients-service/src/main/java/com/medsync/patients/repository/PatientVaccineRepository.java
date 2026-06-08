package com.medsync.patients.repository;

import com.medsync.patients.model.PatientVaccine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientVaccineRepository extends JpaRepository<PatientVaccine, Long> {
    List<PatientVaccine> findByPatientIdOrderByNameAsc(Long patientId);

    Optional<PatientVaccine> findByIdAndPatientId(Long id, Long patientId);
}
