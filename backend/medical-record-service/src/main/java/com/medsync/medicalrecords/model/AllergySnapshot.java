package com.medsync.medicalrecords.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllergySnapshot {
    private String type;
    private String description;
    private String severity;
    private Instant createdAt;
}
