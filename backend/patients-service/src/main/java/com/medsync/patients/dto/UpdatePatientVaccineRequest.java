package com.medsync.patients.dto;

import com.medsync.patients.model.VaccineStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdatePatientVaccineRequest(
        @NotBlank(message = "nome da vacina é obrigatório")
        @Size(max = 80, message = "nome da vacina deve ter no máximo 80 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "nome da vacina contém caracteres inválidos")
        String name,

        @NotNull(message = "status da vacina é obrigatório")
        VaccineStatus status,

        @PastOrPresent(message = "data de aplicação deve ser válida")
        LocalDate applicationDate,

        @Size(max = 300, message = "observações devem ter no máximo 300 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "observações contêm caracteres inválidos")
        String notes
) {
}
