package com.medsync.patients.dto;

import com.medsync.patients.model.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreatePatientRequest(
        @NotBlank(message = "fullName is required")
        @Size(max = 150, message = "fullName must have at most 150 characters")
        String fullName,

        @NotNull(message = "birthDate is required")
        @Past(message = "birthDate must be in the past")
        LocalDate birthDate,

        @NotNull(message = "gender is required")
        Gender gender,

        @NotBlank(message = "phone is required")
        @Size(max = 30, message = "phone must have at most 30 characters")
        String phone,

        @NotBlank(message = "documentNumber is required")
        @Size(max = 50, message = "documentNumber must have at most 50 characters")
        String documentNumber,

        @NotBlank(message = "address is required")
        @Size(max = 255, message = "address must have at most 255 characters")
        String address
) {
}
