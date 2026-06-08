package com.medsync.medicalrecords.dto;

import java.util.List;

public record MedicalRecordSummaryResponse(
        long totalRecords,
        long medicalAttendancesToday,
        long triagesRegistered,
        long patientsWithAllergies,
        long patientsWithPendingVaccines,
        List<LatestUpdateResponse> latestUpdates
) {
}
