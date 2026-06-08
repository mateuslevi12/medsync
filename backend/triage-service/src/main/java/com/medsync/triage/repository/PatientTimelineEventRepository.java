package com.medsync.triage.repository;

import com.medsync.triage.model.PatientTimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatientTimelineEventRepository extends JpaRepository<PatientTimelineEvent, Long> {
    List<PatientTimelineEvent> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
