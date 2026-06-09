import { group, sleep } from "k6";
import {
  callAmbulatoryMedical,
  callAmbulatoryTriage,
  completeAmbulatoryTriage,
  createAmbulatoryAttendance,
  createPatient,
  createPatientAllergy,
  createPatientVaccine,
  findNotificationByAggregate,
  fullFlowOptions,
  getAmbulatoryAttendance,
  getAuthMe,
  getMedicalRecord,
  getMedicalRecordSummary,
  getMedicalTimeline,
  getPatientById,
  getPatientByCpf,
  listAmbulatoryQueue,
  listPatientAllergies,
  listPatientVaccines,
  listNotifications,
  markAllNotificationsAsRead,
  login,
  markNotificationAsRead,
  finishAmbulatoryMedical,
  resolveOptions,
  updatePatientVaccine,
  waitForNotification
} from "./config.js";

export const options = resolveOptions(fullFlowOptions);

export default function () {
  group("full distributed flow", () => {
    const auth = login();
    const token = auth.token;
    getAuthMe(token, {
      id: auth.user && auth.user.id,
      cpf: auth.user && auth.user.cpf,
      email: auth.user && auth.user.email,
      role: auth.user && auth.user.role
    });

    markAllNotificationsAsRead(token);

    const patient = createPatient(token);
    getPatientById(token, patient.id);
    getPatientByCpf(token, patient.documentNumber);

    createPatientAllergy(token, patient.id, {
      description: "Dipirona monoidratada"
    });
    listPatientAllergies(token, patient.id);

    const covid = createPatientVaccine(token, patient.id, {
      name: "COVID-19",
      status: "EM_DIA",
      applicationDate: "2026-01-10"
    });
    createPatientVaccine(token, patient.id, {
      name: "Influenza",
      status: "PENDENTE"
    });
    createPatientVaccine(token, patient.id, {
      name: "Hepatite B",
      status: "EM_DIA",
      applicationDate: "2025-08-01"
    });
    createPatientVaccine(token, patient.id, {
      name: "Tetano",
      status: "DESCONHECIDO"
    });
    updatePatientVaccine(token, patient.id, covid.id, {
      name: "COVID-19",
      status: "EM_DIA",
      applicationDate: "2026-01-12",
      notes: "Dose reforco validada pelo k6"
    });
    listPatientVaccines(token, patient.id);

    const attendance = createAmbulatoryAttendance(token, patient, {
      queueName: "ACOLHIMENTO"
    });
    listAmbulatoryQueue(token);
    getAmbulatoryAttendance(token, attendance.id);
    callAmbulatoryTriage(token, attendance.id);
    completeAmbulatoryTriage(token, attendance.id);
    callAmbulatoryMedical(token, attendance.id);
    finishAmbulatoryMedical(token, attendance.id);
    getAmbulatoryAttendance(token, attendance.id);
    const record = getMedicalRecord(token, patient.id);
    const timeline = getMedicalTimeline(token, patient.id);
    getMedicalRecordSummary(token);

    if (!record.medicalAttendances || record.medicalAttendances.length === 0) {
      throw new Error(`Nenhum atendimento medico foi retornado para o paciente ${patient.id}.`);
    }

    if (!timeline.length) {
      throw new Error(`Nenhum evento de timeline foi retornado para o paciente ${patient.id}.`);
    }

    // O notifications-service consome o evento Kafka gerado pelo fluxo ambulatorial.
    sleep(2);

    const notifications = listNotifications(token, false);
    let relatedNotification = findNotificationByAggregate(notifications, attendance.id, ["MEDICAL_FINISHED"]);

    if (!relatedNotification) {
      relatedNotification = waitForNotification(token, attendance.id, {
        attempts: 6,
        pauseSeconds: 2,
        expectedTypes: ["MEDICAL_FINISHED"]
      });
    }

    if (relatedNotification) {
      markNotificationAsRead(token, relatedNotification.id);
    } else {
      throw new Error(`Nenhuma notificacao final foi encontrada para o atendimento ${attendance.id}.`);
    }
  });
}
