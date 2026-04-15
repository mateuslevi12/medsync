package com.medsync.patients.config;

import com.medsync.patients.model.Gender;
import com.medsync.patients.model.Patient;
import com.medsync.patients.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final PatientRepository patientRepository;

    @Override
    public void run(String... args) {
        if (patientRepository.count() > 0) {
            return;
        }

        patientRepository.save(Patient.builder()
                .fullName("Maria Silva")
                .birthDate(LocalDate.of(1992, 4, 10))
                .gender(Gender.FEMALE)
                .phone("85999990001")
                .documentNumber("11122233344")
                .address("Rua das Flores, 100 - Fortaleza/CE")
                .build());

        patientRepository.save(Patient.builder()
                .fullName("João Costa")
                .birthDate(LocalDate.of(1985, 11, 2))
                .gender(Gender.MALE)
                .phone("85999990002")
                .documentNumber("55566677788")
                .address("Av. Beira Mar, 200 - Fortaleza/CE")
                .build());
    }
}
