package com.medsync.triage.dto;

import com.medsync.triage.model.RiskClassification;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CompleteTriageRequest(
        @Size(max = 1000, message = "observações devem ter no máximo 1000 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "observações contêm caracteres inválidos")
        String observations,

        @NotBlank(message = "destino do paciente é obrigatório")
        @Size(max = 120, message = "destino do paciente deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "destino do paciente contém caracteres inválidos")
        String destination,

        @NotNull(message = "classificação de risco é obrigatória")
        RiskClassification riskClassification,

        @Size(max = 6, message = "peso deve ter no máximo 6 caracteres")
        @Pattern(regexp = "^$|^\\d{1,3}([.,]\\d{1,2})?$", message = "peso deve ter formato numérico válido")
        String weightKg,

        @Size(max = 3, message = "altura deve ter no máximo 3 dígitos")
        @Pattern(regexp = "^$|^\\d{1,3}$", message = "altura deve conter apenas números")
        String heightCm,

        @Size(max = 20, message = "IMC deve ter no máximo 20 caracteres")
        String bmi,

        @Size(max = 6, message = "circunferência deve ter no máximo 6 caracteres")
        @Pattern(regexp = "^$|^\\d{1,3}([.,]\\d{1,2})?$", message = "circunferência deve ter formato numérico válido")
        String abdominalCircumference,

        @Size(max = 7, message = "pressão arterial deve ter no máximo 7 caracteres")
        @Pattern(regexp = "^$|^\\d{2,3}/\\d{2,3}$", message = "pressão arterial deve estar no formato 120/80")
        String bloodPressure,

        @Size(max = 2, message = "frequência respiratória deve ter no máximo 2 dígitos")
        @Pattern(regexp = "^$|^\\d{1,2}$", message = "frequência respiratória deve conter apenas números")
        String respiratoryRate,

        @Size(max = 3, message = "frequência cardíaca deve ter no máximo 3 dígitos")
        @Pattern(regexp = "^$|^\\d{1,3}$", message = "frequência cardíaca deve conter apenas números")
        String heartRate,

        @Size(max = 4, message = "temperatura deve ter no máximo 4 caracteres")
        @Pattern(regexp = "^$|^\\d{2}([.,]\\d)?$", message = "temperatura deve ter formato numérico válido")
        String temperature,

        @Size(max = 3, message = "saturação deve ter no máximo 3 dígitos")
        @Pattern(regexp = "^$|^\\d{1,3}$", message = "saturação deve conter apenas números")
        String oxygenSaturation,

        @Size(max = 3, message = "glicemia deve ter no máximo 3 dígitos")
        @Pattern(regexp = "^$|^\\d{1,3}$", message = "glicemia deve conter apenas números")
        String glucose,

        @Min(value = 0, message = "nível de dor deve estar entre 0 e 10")
        @Max(value = 10, message = "nível de dor deve estar entre 0 e 10")
        Integer painLevel,

        Boolean hasAllergy,

        @Size(max = 50, message = "tipo de alergia deve ter no máximo 50 caracteres")
        @Pattern(regexp = "^$|^(Medicamento|Alimento|Outro|MEDICAMENTO|ALIMENTO|OUTRO)$", message = "tipo de alergia é inválido")
        String allergyType,

        @Size(max = 120, message = "descrição da alergia deve ter no máximo 120 caracteres")
        @Pattern(regexp = "^[^<>]*$", message = "descrição da alergia contém caracteres inválidos")
        String allergyDescription,

        @Size(max = 30, message = "gravidade da alergia deve ter no máximo 30 caracteres")
        @Pattern(regexp = "^$|^(Leve|Moderada|Grave|LEVE|MODERADA|GRAVE)$", message = "gravidade da alergia é inválida")
        String allergySeverity,

        @Valid
        List<VaccineSnapshot> vaccines
) {
    @AssertTrue(message = "Peso deve estar entre 0 e 500 kg.")
    public boolean isWeightKgWithinRange() {
        return isBlank(weightKg) || isDecimalInRange(weightKg, 0D, 500D);
    }

    @AssertTrue(message = "Altura deve estar entre 30 e 250 cm.")
    public boolean isHeightCmWithinRange() {
        return isBlank(heightCm) || isIntegerInRange(heightCm, 30, 250);
    }

    @AssertTrue(message = "Circunferência abdominal deve estar entre 0 e 300 cm.")
    public boolean isAbdominalCircumferenceWithinRange() {
        return isBlank(abdominalCircumference) || isDecimalInRange(abdominalCircumference, 0D, 300D);
    }

    @AssertTrue(message = "Informe a pressão no formato 120/80.")
    public boolean isBloodPressureWithinRange() {
        if (isBlank(bloodPressure)) {
            return true;
        }

        String[] parts = bloodPressure.split("/");
        if (parts.length != 2) {
            return false;
        }

        Integer systolic = parseInteger(parts[0]);
        Integer diastolic = parseInteger(parts[1]);
        return systolic != null && diastolic != null
                && systolic >= 40 && systolic <= 300
                && diastolic >= 20 && diastolic <= 200;
    }

    @AssertTrue(message = "Frequência respiratória deve estar entre 0 e 80.")
    public boolean isRespiratoryRateWithinRange() {
        return isBlank(respiratoryRate) || isIntegerInRange(respiratoryRate, 0, 80);
    }

    @AssertTrue(message = "Frequência cardíaca deve estar entre 0 e 250.")
    public boolean isHeartRateWithinRange() {
        return isBlank(heartRate) || isIntegerInRange(heartRate, 0, 250);
    }

    @AssertTrue(message = "Temperatura deve estar entre 25°C e 45°C.")
    public boolean isTemperatureWithinRange() {
        return isBlank(temperature) || isDecimalInRange(temperature, 25D, 45D);
    }

    @AssertTrue(message = "Saturação deve estar entre 0% e 100%.")
    public boolean isOxygenSaturationWithinRange() {
        return isBlank(oxygenSaturation) || isIntegerInRange(oxygenSaturation, 0, 100);
    }

    @AssertTrue(message = "Glicemia deve estar entre 0 e 999.")
    public boolean isGlucoseWithinRange() {
        return isBlank(glucose) || isIntegerInRange(glucose, 0, 999);
    }

    @AssertTrue(message = "Descrição da alergia é obrigatória quando houver alergia.")
    public boolean isAllergyDescriptionConsistent() {
        if (hasAllergy == null || !hasAllergy) {
            return true;
        }
        return allergyDescription != null && !allergyDescription.trim().isEmpty();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static boolean isDecimalInRange(String value, double min, double max) {
        try {
            double parsed = Double.parseDouble(value.replace(',', '.'));
            return parsed >= min && parsed <= max;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private static boolean isIntegerInRange(String value, int min, int max) {
        Integer parsed = parseInteger(value);
        return parsed != null && parsed >= min && parsed <= max;
    }

    private static Integer parseInteger(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
