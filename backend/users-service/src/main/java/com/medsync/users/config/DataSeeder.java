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

    @Value("${app.seed.admin-password:admin123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmailIgnoreCase(adminEmail)) {
            return;
        }

        User admin = User.builder()
                .name("Admin MedSync")
                .email(adminEmail.toLowerCase())
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);
    }
}
