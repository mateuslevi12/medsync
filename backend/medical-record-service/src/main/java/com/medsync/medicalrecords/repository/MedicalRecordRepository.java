package com.medsync.medicalrecords.repository;

import com.medsync.medicalrecords.model.MedicalRecordDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface MedicalRecordRepository extends MongoRepository<MedicalRecordDocument, String> {
    Optional<MedicalRecordDocument> findByPatientId(Long patientId);
}
