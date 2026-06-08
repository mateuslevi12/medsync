package com.medsync.medicalrecords.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VitalSigns {
    private String weightKg;
    private String heightCm;
    private String imc;
    private String abdominalCircumferenceCm;
    private String bloodPressure;
    private String respiratoryRate;
    private String heartRate;
    private String temperature;
    private String oxygenSaturation;
    private String glucose;
    private Integer painLevel;
}
