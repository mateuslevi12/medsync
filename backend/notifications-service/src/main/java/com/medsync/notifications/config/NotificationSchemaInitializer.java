package com.medsync.notifications.config;

import com.medsync.notifications.model.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class NotificationSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        String allowedTypes = Arrays.stream(NotificationType.values())
                .map(NotificationType::name)
                .map(type -> "'" + type + "'")
                .collect(Collectors.joining(", "));

        // Hibernate does not refresh enum-generated CHECK constraints on existing tables.
        jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_name = 'notifications'
                    ) THEN
                        ALTER TABLE notifications
                            DROP CONSTRAINT IF EXISTS notifications_type_check;

                        ALTER TABLE notifications
                            ADD CONSTRAINT notifications_type_check
                            CHECK (type IN (%s));
                    END IF;
                END
                $$;
                """.formatted(allowedTypes));
    }
}
