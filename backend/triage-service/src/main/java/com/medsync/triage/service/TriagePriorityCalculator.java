package com.medsync.triage.service;

import com.medsync.triage.dto.CreateTriageRequest;
import com.medsync.triage.dto.UpdateTriageRequest;
import com.medsync.triage.model.TriagePriority;
import org.springframework.stereotype.Component;

@Component
public class TriagePriorityCalculator {

    public TriagePriority calculate(CreateTriageRequest request) {
        return calculate(
                request.heartRate(),
                request.temperature(),
                request.oxygenSaturation(),
                request.painLevel(),
                request.symptoms()
        );
    }

    public TriagePriority calculate(UpdateTriageRequest request) {
        return calculate(
                request.heartRate(),
                request.temperature(),
                request.oxygenSaturation(),
                request.painLevel(),
                request.symptoms()
        );
    }

    private TriagePriority calculate(
            Integer heartRate,
            Double temperature,
            Integer oxygenSaturation,
            Integer painLevel,
            String symptoms
    ) {
        if (oxygenSaturation < 90 || heartRate > 130 || temperature >= 40.0 || painLevel >= 9) {
            return TriagePriority.RED;
        }

        if ((oxygenSaturation >= 90 && oxygenSaturation <= 93)
                || (heartRate >= 110 && heartRate <= 130)
                || (temperature >= 39.0 && temperature < 40.0)
                || (painLevel >= 7 && painLevel <= 8)) {
            return TriagePriority.ORANGE;
        }

        String normalizedSymptoms = symptoms == null ? "" : symptoms.toLowerCase();
        if (temperature >= 38.0 || painLevel >= 5
                || normalizedSymptoms.contains("falta de ar")
                || normalizedSymptoms.contains("dor no peito")
                || normalizedSymptoms.contains("desmaio")) {
            return TriagePriority.YELLOW;
        }

        if (painLevel <= 1 && normalizedSymptoms.contains("renovacao")) {
            return TriagePriority.BLUE;
        }

        return TriagePriority.GREEN;
    }
}
