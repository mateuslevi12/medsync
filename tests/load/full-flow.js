import { group, sleep } from "k6";
import {
  createPatient,
  createTriage,
  findNotificationByTriage,
  fullFlowOptions,
  getPatientById,
  listNotifications,
  listTriages,
  login,
  markNotificationAsRead,
  resolveOptions,
  waitForNotification
} from "./config.js";

export const options = resolveOptions(fullFlowOptions);

export default function () {
  group("full distributed flow", () => {
    const auth = login();
    const token = auth.token;

    const patient = createPatient(token);
    getPatientById(token, patient.id);

    const triage = createTriage(token, patient, {
      symptoms: "Paciente criado pelo fluxo completo do k6",
      painLevel: 7,
      notes: "Fluxo completo validando API Gateway, triagem e notificacoes"
    });

    listTriages(token, true);

    // O notifications-service consome o evento Kafka gerado pela triagem.
    sleep(2);

    const notifications = listNotifications(token, false);
    let relatedNotification = findNotificationByTriage(notifications, triage.id);

    if (!relatedNotification) {
      relatedNotification = waitForNotification(token, triage.id, {
        attempts: 6,
        pauseSeconds: 2
      });
    }

    if (relatedNotification) {
      markNotificationAsRead(token, relatedNotification.id);
    } else {
      throw new Error(`Nenhuma notificacao foi encontrada para a triagem ${triage.id}.`);
    }
  });
}
