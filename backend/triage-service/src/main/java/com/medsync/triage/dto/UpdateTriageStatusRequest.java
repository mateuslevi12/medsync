package com.medsync.triage.dto;

import com.medsync.triage.model.TriageStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTriageStatusRequest(
        @NotNull(message = "status é obrigatório")
        TriageStatus status
) {
}
