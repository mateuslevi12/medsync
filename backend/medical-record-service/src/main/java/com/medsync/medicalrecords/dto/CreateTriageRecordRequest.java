package com.medsync.medicalrecords.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record CreateTriageRecordRequest(
        Long attendanceId,
        Long triageId,

        @Size(max = 60, message = "fila deve ter no máximo 60 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "fila contém caracteres inválidos")
        String queueName,

        @Size(max = 40, message = "status deve ter no máximo 40 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "status contém caracteres inválidos")
        String status,

        @Size(max = 20, message = "prioridade deve ter no máximo 20 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "prioridade contém caracteres inválidos")
        String priority,

        @NotBlank(message = "classificação de risco é obrigatória")
        @Size(max = 30, message = "classificação de risco deve ter no máximo 30 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "classificação de risco contém caracteres inválidos")
        String riskClassification,

        Instant waitingSince,
        Instant triageStartedAt,
        Instant triageCompletedAt,

        @NotNull(message = "sinais vitais são obrigatórios")
        @Valid
        VitalSignsDto vitalSigns,

        @Valid
        List<AllergySnapshotDto> allergiesSnapshot,

        @Valid
        List<VaccineSnapshotDto> vaccinesSnapshot,

        @Size(max = 1000, message = "observações devem ter no máximo 1000 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "observações contêm caracteres inválidos")
        String observations,

        @Size(max = 120, message = "destino deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "destino contém caracteres inválidos")
        String destination,

        @Size(max = 120, message = "nome do profissional deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "nome do profissional contém caracteres inválidos")
        String professionalName,

        Instant createdAt,

        @Valid
        UpsertPatientSnapshotRequest patientSnapshot
) {
}
