package com.medsync.triage.repository;

import com.medsync.triage.model.MedicalAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalAttendanceRepository extends JpaRepository<MedicalAttendance, Long> {
    List<MedicalAttendance> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
