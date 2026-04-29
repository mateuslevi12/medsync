package com.medsync.notifications.controller;

import com.medsync.notifications.dto.NotificationResponse;
import com.medsync.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public List<NotificationResponse> findAll() {
        return notificationService.findAll();
    }

    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public List<NotificationResponse> findUnread() {
        return notificationService.findUnread();
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public NotificationResponse markAsRead(@PathVariable Long id) {
        return notificationService.markAsRead(id);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','HEALTH_PROFESSIONAL','RECEPTIONIST')")
    public void markAllAsRead() {
        notificationService.markAllAsRead();
    }
}
