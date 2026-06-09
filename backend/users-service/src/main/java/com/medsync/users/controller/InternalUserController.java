package com.medsync.users.controller;

import com.medsync.users.config.InternalRequestValidator;
import com.medsync.users.dto.InternalUserResponse;
import com.medsync.users.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/internal")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;
    private final InternalRequestValidator internalRequestValidator;

    @GetMapping("/by-email")
    public InternalUserResponse findByEmail(
            @RequestParam String email,
            @RequestHeader(value = "X-Internal-Token", required = false) String token
    ) {
        internalRequestValidator.validate(token);
        return userService.findByEmailForInternalAuth(email);
    }

    @GetMapping("/by-cpf")
    public InternalUserResponse findByCpf(
            @RequestParam String cpf,
            @RequestHeader(value = "X-Internal-Token", required = false) String token
    ) {
        internalRequestValidator.validate(token);
        return userService.findByCpfForInternalAuth(cpf);
    }

    @PostMapping("/by-email/last-login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void registerLastLogin(
            @RequestParam String email,
            @RequestHeader(value = "X-Internal-Token", required = false) String token
    ) {
        internalRequestValidator.validate(token);
        userService.registerSuccessfulLogin(email);
    }
}
