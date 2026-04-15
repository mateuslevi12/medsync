package com.medsync.users.config;

import com.medsync.users.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InternalRequestValidator {

    @Value("${app.internal-token}")
    private String internalToken;

    public void validate(String providedToken) {
        if (providedToken == null || !providedToken.equals(internalToken)) {
            throw new UnauthorizedException("Invalid internal token");
        }
    }
}
