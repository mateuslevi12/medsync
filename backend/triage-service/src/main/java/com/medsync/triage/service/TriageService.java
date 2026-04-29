package com.medsync.triage.service;

import com.medsync.triage.dto.CreateTriageRequest;
import com.medsync.triage.dto.TriageResponse;
import com.medsync.triage.dto.UpdateTriageRequest;
import com.medsync.triage.dto.UpdateTriageStatusRequest;
import com.medsync.triage.exception.NotFoundException;
import com.medsync.triage.messaging.TriageEventProducer;
import com.medsync.triage.model.Triage;
import com.medsync.triage.model.TriagePriority;
import com.medsync.triage.model.TriageStatus;
import com.medsync.triage.repository.TriageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TriageService {

    private final TriageRepository triageRepository;
    private final TriagePriorityCalculator priorityCalculator;
    private final TriageEventProducer triageEventProducer;
    private final CacheManager cacheManager;

    public TriageResponse create(CreateTriageRequest request) {
        Triage triage = Triage.builder()
                .patientId(request.patientId())
                .patientNameSnapshot(request.patientNameSnapshot().trim())
                .symptoms(request.symptoms().trim())
                .bloodPressure(request.bloodPressure().trim())
                .heartRate(request.heartRate())
                .respiratoryRate(request.respiratoryRate())
                .temperature(request.temperature())
                .oxygenSaturation(request.oxygenSaturation())
                .painLevel(request.painLevel())
                .priority(request.priority() != null ? request.priority() : priorityCalculator.calculate(request))
                .status(TriageStatus.WAITING)
                .notes(request.notes() == null ? null : request.notes().trim())
                .createdByUserId(request.createdByUserId())
                .build();

        Triage saved = triageRepository.save(triage);
        evictWaitingCache();
        triageEventProducer.publishCreated(saved);
        return toResponse(saved);
    }

    public List<TriageResponse> findAll() {
        return triageRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    // @Cacheable(value = "triageWaiting", key = "'all'")
    public List<TriageResponse> findWaiting() {
        return triageRepository.findByStatusOrderByCreatedAtAsc(TriageStatus.WAITING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TriageResponse findById(Long id) {
        Triage triage = triageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Triagem não encontrada"));
        return toResponse(triage);
    }

    public TriageResponse update(Long id, UpdateTriageRequest request) {
        Triage triage = triageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Triagem não encontrada"));

        TriagePriority previousPriority = triage.getPriority();

        triage.setSymptoms(request.symptoms().trim());
        triage.setBloodPressure(request.bloodPressure().trim());
        triage.setHeartRate(request.heartRate());
        triage.setRespiratoryRate(request.respiratoryRate());
        triage.setTemperature(request.temperature());
        triage.setOxygenSaturation(request.oxygenSaturation());
        triage.setPainLevel(request.painLevel());
        triage.setNotes(request.notes() == null ? null : request.notes().trim());

        TriagePriority nextPriority = request.priority() != null
                ? request.priority()
                : priorityCalculator.calculate(request);
        triage.setPriority(nextPriority);

        Triage saved = triageRepository.save(triage);
        evictWaitingCache();

        triageEventProducer.publishUpdated(saved);
        if (previousPriority != saved.getPriority()) {
            triageEventProducer.publishPriorityChanged(saved, previousPriority);
        }

        return toResponse(saved);
    }

    public TriageResponse updateStatus(Long id, UpdateTriageStatusRequest request) {
        Triage triage = triageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Triagem não encontrada"));

        triage.setStatus(request.status());
        Triage saved = triageRepository.save(triage);

        evictWaitingCache();
        triageEventProducer.publishUpdated(saved);

        return toResponse(saved);
    }

    public void delete(Long id) {
        Triage triage = triageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Triagem não encontrada"));
        triageRepository.delete(triage);
        evictWaitingCache();
    }

    private void evictWaitingCache() {
        Cache cache = cacheManager.getCache("triageWaiting");
        if (cache != null) {
            cache.evict("all");
        }
    }

    private TriageResponse toResponse(Triage triage) {
        return new TriageResponse(
                triage.getId(),
                triage.getPatientId(),
                triage.getPatientNameSnapshot(),
                triage.getSymptoms(),
                triage.getBloodPressure(),
                triage.getHeartRate(),
                triage.getRespiratoryRate(),
                triage.getTemperature(),
                triage.getOxygenSaturation(),
                triage.getPainLevel(),
                triage.getPriority(),
                triage.getStatus(),
                triage.getNotes(),
                triage.getCreatedByUserId(),
                triage.getCreatedAt(),
                triage.getUpdatedAt()
        );
    }
}
