"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, parseApiError } from "../../../lib/api";
import { notificationTypeLabel } from "../../../lib/labels";
import type { NotificationResponse } from "../../../lib/types";

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [status, setStatus] = useState<{ message: string; isError: boolean }>({ message: "", isError: false });

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications(false);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  async function loadNotifications(showStatus = true) {
    try {
      const data = await apiRequest<NotificationResponse[]>("/api/notifications");
      setNotifications(Array.isArray(data) ? data : []);
      if (showStatus) {
        setStatus({ message: "Notificações carregadas.", isError: false });
      }
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  async function markAsRead(id: number) {
    try {
      await apiRequest<NotificationResponse>(`/api/notifications/${id}/read`, { method: "PATCH" });
      await loadNotifications();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  async function markAllAsRead() {
    try {
      await apiRequest<void>("/api/notifications/read-all", { method: "PATCH" });
      await loadNotifications();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  return (
    <main className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Notificações</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => void loadNotifications()}
          >
            Atualizar
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            onClick={() => void markAllAsRead()}
            disabled={unreadCount === 0}
          >
            Marcar todas como lidas
          </button>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-700">Não lidas: {unreadCount}</p>

        {status.message ? (
          <p className={`mt-2 text-sm font-medium ${status.isError ? "text-red-700" : "text-emerald-700"}`}>
            {status.message}
          </p>
        ) : null}

        <div className="mt-3 grid gap-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-lg border p-3 ${
                notification.read ? "border-slate-200 bg-slate-50" : "border-blue-300 bg-blue-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{notification.title}</h2>
                <span className="text-xs text-slate-600">{notificationTypeLabel(notification.type)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
              <p className="mt-1 text-xs text-slate-600">
                {notification.createdAt ? new Date(notification.createdAt).toLocaleString("pt-BR") : "-"}
              </p>
              {!notification.read ? (
                <button
                  type="button"
                  className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                  onClick={() => void markAsRead(notification.id)}
                >
                  Marcar como lida
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
