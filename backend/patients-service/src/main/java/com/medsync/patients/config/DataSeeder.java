package com.medsync.patients.config;

import com.medsync.patients.model.AllergySeverity;
import com.medsync.patients.model.AllergyType;
import com.medsync.patients.model.Gender;
import com.medsync.patients.model.Patient;
import com.medsync.patients.model.PatientAllergy;
import com.medsync.patients.model.PatientVaccine;
import com.medsync.patients.model.VaccineStatus;
import com.medsync.patients.repository.PatientAllergyRepository;
import com.medsync.patients.repository.PatientRepository;
import com.medsync.patients.repository.PatientVaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final PatientRepository patientRepository;
    private final PatientAllergyRepository patientAllergyRepository;
    private final PatientVaccineRepository patientVaccineRepository;

    @Override
    public void run(String... args) {
        if (patientRepository.count() > 0) {
            return;
        }

        Patient abda = patientRepository.save(Patient.builder()
                .fullName("ABDA BARBOZA DOS SANTOS")
                .birthDate(LocalDate.of(2018, 1, 12))
                .gender(Gender.FEMALE)
                .phone("(85) 99740-0655")
                .documentNumber("10209405309")
                .cns("706203549544067")
                .address("Rua das Flores, 210, Centro, Fortaleza - CE")
                .build());

        Patient pacienteTeste = patientRepository.save(Patient.builder()
                .fullName("PACIENTE TESTE")
                .birthDate(LocalDate.of(2001, 3, 15))
                .gender(Gender.MALE)
                .phone("(85) 99999-9999")
                .documentNumber("00000000000")
                .cns("000000000000000")
                .address("Avenida Principal, 1200, Maraponga, Fortaleza - CE")
                .build());

        patientRepository.save(Patient.builder()
                .fullName("JOÃO DA SILVA")
                .birthDate(LocalDate.of(1984, 8, 4))
                .gender(Gender.MALE)
                .phone("(85) 98888-1111")
                .documentNumber("12345678900")
                .cns("123456789012345")
                .address("Travessa São José, 45, Messejana, Fortaleza - CE")
                .build());

        patientAllergyRepository.save(PatientAllergy.builder()
                .patient(abda)
                .type(AllergyType.MEDICAMENTO)
                .description("Dipirona")
                .severity(AllergySeverity.MODERADA)
                .build());

        seedVaccines(abda);
        seedVaccines(pacienteTeste);
    }

    private void seedVaccines(Patient patient) {
        patientVaccineRepository.save(PatientVaccine.builder()
                .patient(patient)
                .name("COVID-19")
                .status(VaccineStatus.EM_DIA)
                .applicationDate(LocalDate.of(2025, 5, 10))
                .notes("Esquema básico completo")
                .build());

        patientVaccineRepository.save(PatientVaccine.builder()
                .patient(patient)
                .name("Influenza")
                .status(VaccineStatus.PENDENTE)
                .build());

        patientVaccineRepository.save(PatientVaccine.builder()
                .patient(patient)
                .name("Hepatite B")
                .status(VaccineStatus.EM_DIA)
                .applicationDate(LocalDate.of(2024, 11, 8))
                .build());

        patientVaccineRepository.save(PatientVaccine.builder()
                .patient(patient)
                .name("Tétano")
                .status(VaccineStatus.DESCONHECIDO)
                .build());
    }
}
