package com.medsync.triage.repository;

import com.medsync.triage.model.AmbulatoryAttendance;
import com.medsync.triage.model.AmbulatoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AmbulatoryAttendanceRepository extends JpaRepository<AmbulatoryAttendance, Long> {
    List<AmbulatoryAttendance> findByStatusNotOrderByWaitingSinceAsc(AmbulatoryStatus status);

    List<AmbulatoryAttendance> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    Optional<AmbulatoryAttendance> findTopByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<AmbulatoryAttendance> findByIdIn(Collection<Long> ids);
}
