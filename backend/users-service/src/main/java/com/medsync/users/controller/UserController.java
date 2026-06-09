package com.medsync.users.controller;

import com.medsync.users.dto.CreateUserRequest;
import com.medsync.users.dto.UpdateUserStatusRequest;
import com.medsync.users.dto.UpdateUserRequest;
import com.medsync.users.dto.UserResponse;
import com.medsync.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable("id") Long id) {
        return userService.findById(id);
    }

    @PutMapping("/{id}")
    public UserResponse update(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        return userService.update(authentication.getName(), id, request);
    }

    @PatchMapping("/{id}/status")
    public UserResponse updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication
    ) {
        return userService.updateStatus(authentication.getName(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id, Authentication authentication) {
        userService.delete(authentication.getName(), id);
    }
}
