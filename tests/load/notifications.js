import { fail, group, sleep } from "k6";
import {
  createTriage,
  ensurePatient,
  listNotifications,
  login,
  markNotificationAsRead,
  resolveOptions,
  smokeOptions,
  waitForNotification
} from "./config.js";

export const options = resolveOptions(smokeOptions);

export default function () {
  group("notifications flow", () => {
    const auth = login();
    const token = auth.token;

    listNotifications(token, false);
    let unread = listNotifications(token, true);
    let notification = unread[0];

    if (!notification) {
      const patient = ensurePatient(token);
      const triage = createTriage(token, patient, {
        symptoms: "Disparo de evento para notificacao",
        painLevel: 6
      });

      sleep(2);
      notification = waitForNotification(token, triage.id, { attempts: 5, pauseSeconds: 2 });
    }

    if (notification) {
      markNotificationAsRead(token, notification.id);
    } else {
      fail("Nenhuma notificacao ficou disponivel para validacao no fluxo de notificacoes.");
    }
  });
}
