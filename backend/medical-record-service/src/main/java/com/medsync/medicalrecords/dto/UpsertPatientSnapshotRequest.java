package com.medsync.medicalrecords.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpsertPatientSnapshotRequest(
        @NotNull(message = "patientId é obrigatório")
        Long patientId,

        @NotBlank(message = "nome do paciente é obrigatório")
        @Size(max = 120, message = "nome do paciente deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[\\p{L}](?:[\\p{L}\\s'’-]*[\\p{L}])?$", message = "nome do paciente contém caracteres inválidos")
        String patientName,

        @NotBlank(message = "CPF do paciente é obrigatório")
        @Pattern(regexp = "^\\d{11}$", message = "CPF do paciente deve conter 11 dígitos")
        String patientCpf,

        @Pattern(regexp = "^\\d{15}$", message = "CNS do paciente deve conter 15 dígitos")
        String patientCns,

        @Min(value = 0, message = "idade do paciente não pode ser negativa")
        @Max(value = 130, message = "idade do paciente deve ser válida")
        Integer patientAge,

        @Pattern(regexp = "^\\d{10,11}$", message = "telefone deve conter DDD e número")
        String patientPhone,

        @Valid
        List<AllergySnapshotDto> allergiesSnapshot,

        @Valid
        List<VaccineSnapshotDto> vaccinesSnapshot
) {
}
