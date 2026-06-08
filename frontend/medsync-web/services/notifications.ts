import { apiRequest } from "@/lib/api";
import { demoNotifications } from "@/lib/medsync-demo";
import type { NotificationResponse } from "@/lib/types";

type ServiceOptions = {
  demo?: boolean;
};

function mapDemoNotification(notification: (typeof demoNotifications)[number]): NotificationResponse {
  return {
    id: Number(notification.id),
    title: notification.title,
    message: notification.message,
    type: "TRIAGE_UPDATED",
    read: notification.read,
    sourceEventId: notification.id,
    sourceAggregateId: notification.id,
    createdAt: new Date().toISOString(),
  };
}

export async function getNotifications(options: ServiceOptions = {}) {
  if (options.demo) {
    return demoNotifications.map(mapDemoNotification);
  }

  return apiRequest<NotificationResponse[]>("/api/notifications");
}

export async function getUnreadNotifications(options: ServiceOptions = {}) {
  if (options.demo) {
    return demoNotifications.filter((notification) => !notification.read).map(mapDemoNotification);
  }

  return apiRequest<NotificationResponse[]>("/api/notifications/unread");
}

export async function markNotificationAsRead(notificationId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    const found = demoNotifications.find((notification) => notification.id === String(notificationId));
    return found ? mapDemoNotification({ ...found, read: true }) : null;
  }

  return apiRequest<NotificationResponse>(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}
