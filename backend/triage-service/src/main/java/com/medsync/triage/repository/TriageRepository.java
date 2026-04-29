package com.medsync.triage.repository;

import com.medsync.triage.model.Triage;
import com.medsync.triage.model.TriageStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TriageRepository extends JpaRepository<Triage, Long> {
    List<Triage> findAllByOrderByCreatedAtDesc();

    List<Triage> findByStatusOrderByCreatedAtAsc(TriageStatus status);
}
