package com.medsync.triage.dto;

import com.medsync.triage.model.TriagePriority;
import jakarta.validation.constraints.*;

public record CreateTriageRequest(
        @NotNull(message = "patientId é obrigatório")
        Long patientId,

        @NotBlank(message = "nome do paciente é obrigatório")
        @Size(max = 150, message = "nome do paciente deve ter no máximo 150 caracteres")
        String patientNameSnapshot,

        @NotBlank(message = "sintomas são obrigatórios")
        @Size(max = 2500, message = "sintomas devem ter no máximo 2500 caracteres")
        String symptoms,

        @NotBlank(message = "pressão arterial é obrigatória")
        @Size(max = 20, message = "pressão arterial deve ter no máximo 20 caracteres")
        String bloodPressure,

        @NotNull(message = "frequência cardíaca é obrigatória")
        @Min(value = 20, message = "frequência cardíaca deve ser no mínimo 20")
        @Max(value = 250, message = "frequência cardíaca deve ser no máximo 250")
        Integer heartRate,

        @NotNull(message = "frequência respiratória é obrigatória")
        @Min(value = 5, message = "frequência respiratória deve ser no mínimo 5")
        @Max(value = 80, message = "frequência respiratória deve ser no máximo 80")
        Integer respiratoryRate,

        @NotNull(message = "temperatura é obrigatória")
        @DecimalMin(value = "30.0", message = "temperatura deve ser no mínimo 30")
        @DecimalMax(value = "45.0", message = "temperatura deve ser no máximo 45")
        Double temperature,

        @NotNull(message = "saturação de oxigênio é obrigatória")
        @Min(value = 50, message = "saturação de oxigênio deve ser no mínimo 50")
        @Max(value = 100, message = "saturação de oxigênio deve ser no máximo 100")
        Integer oxygenSaturation,

        @NotNull(message = "nível de dor é obrigatório")
        @Min(value = 0, message = "nível de dor deve ser no mínimo 0")
        @Max(value = 10, message = "nível de dor deve ser no máximo 10")
        Integer painLevel,

        TriagePriority priority,

        @Size(max = 1000, message = "observações devem ter no máximo 1000 caracteres")
        String notes,

        Long createdByUserId
) {
}
