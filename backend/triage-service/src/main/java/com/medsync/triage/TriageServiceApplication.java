package com.medsync.triage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class TriageServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(TriageServiceApplication.class, args);
    }
}
