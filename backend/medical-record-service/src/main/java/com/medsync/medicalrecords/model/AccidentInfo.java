package com.medsync.medicalrecords.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccidentInfo {
    private boolean moto;
    private boolean carro;
    private boolean bicicleta;
    private boolean pedestre;
    private boolean outros;
}
