package com.medsync.notifications.dto;

import com.medsync.notifications.model.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        NotificationType type,
        boolean read,
        String sourceEventId,
        String sourceAggregateId,
        Instant createdAt
) {
}
