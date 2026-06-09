package com.medsync.users.config;

import com.medsync.users.model.Role;
import com.medsync.users.model.User;
import com.medsync.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email:admin@medsync.com}")
    private String adminEmail;

    @Value("${app.seed.admin-cpf:00000000000}")
    private String adminCpf;

    @Value("${app.seed.admin-password:admin123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        var existingAdmin = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(adminEmail.toLowerCase());
        if (existingAdmin.isPresent()) {
            User admin = existingAdmin.get();
            if (admin.getCpf() == null || admin.getCpf().isBlank()) {
                admin.setCpf(adminCpf);
                userRepository.save(admin);
            }
            return;
        }

        User admin = User.builder()
                .name("Admin MedSync")
                .cpf(adminCpf)
                .email(adminEmail.toLowerCase())
                .password(passwordEncoder.encode(adminPassword))
                .active(true)
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);
    }
}
