package com.medsync.medicalrecords.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record CreateMedicalAttendanceRequest(
        Long attendanceId,

        @NotBlank(message = "avaliação é obrigatória")
        @Size(min = 5, max = 2000, message = "avaliação deve ter entre 5 e 2000 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "avaliação contém caracteres inválidos")
        String assessment,

        @NotBlank(message = "plano é obrigatório")
        @Size(min = 5, max = 2000, message = "plano deve ter entre 5 e 2000 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "plano contém caracteres inválidos")
        String plan,

        @Pattern(regexp = "^$|^\\d{1,10}$", message = "código do procedimento deve conter apenas números")
        String procedureCode,

        List<@Pattern(regexp = "^[A-Z]\\d{2}(\\.\\d{1,4})?$", message = "CID deve estar em formato válido") String> cidCodes,

        List<@Size(max = 255, message = "exame deve ter no máximo 255 caracteres") String> exams,

        List<@Size(max = 255, message = "medicamento deve ter no máximo 255 caracteres") String> medications,

        List<@Size(max = 255, message = "prescrição deve ter no máximo 255 caracteres") String> prescriptions,

        @Size(max = 255, message = "notificações devem ter no máximo 255 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "notificações contêm caracteres inválidos")
        String notifications,

        Boolean accidentMoto,
        Boolean accidentCarro,
        Boolean accidentBicicleta,
        Boolean accidentPedestre,
        Boolean accidentOutros,

        @Size(max = 1000, message = "observações devem ter no máximo 1000 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "observações contêm caracteres inválidos")
        String notes,

        @Size(max = 120, message = "nome do profissional deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "nome do profissional contém caracteres inválidos")
        String professionalName,

        Instant startedAt,
        Instant completedAt,

        @Valid
        UpsertPatientSnapshotRequest patientSnapshot
) {
}
