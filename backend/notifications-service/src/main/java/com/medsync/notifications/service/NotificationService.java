package com.medsync.notifications.service;

import com.medsync.notifications.dto.NotificationResponse;
import com.medsync.notifications.exception.NotFoundException;
import com.medsync.notifications.model.Notification;
import com.medsync.notifications.model.NotificationType;
import com.medsync.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<NotificationResponse> findAll() {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public List<NotificationResponse> findUnread() {
        return notificationRepository.findByReadFalseOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notificação não encontrada"));
        
        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    public void markAllAsRead() {
        List<Notification> unread = notificationRepository.findByReadFalseOrderByCreatedAtDesc();
        if (unread.isEmpty()) {
            return;
        }

        unread.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void createFromEvent(
            String sourceEventId,
            String sourceAggregateId,
            NotificationType type,
            String title,
            String message
    ) {
        if (sourceEventId == null || sourceEventId.isBlank()) {
            return;
        }

        if (notificationRepository.existsBySourceEventId(sourceEventId)) {
            return;
        }

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .read(false)
                .sourceEventId(sourceEventId)
                .sourceAggregateId(sourceAggregateId == null ? "" : sourceAggregateId)
                .build();

        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getSourceEventId(),
                notification.getSourceAggregateId(),
                notification.getCreatedAt()
        );
    }
}
