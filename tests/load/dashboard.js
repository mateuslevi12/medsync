import { group, sleep } from "k6";
import {
  createPatient,
  getAuthMe,
  getMedicalRecordSummary,
  getPatientByCpf,
  listAmbulatoryQueue,
  listNotifications,
  listPatients,
  listUsers,
  login,
  resolveOptions,
  smokeOptions
} from "./config.js";

export const options = resolveOptions(smokeOptions);

export default function () {
  group("dashboard and read models", () => {
    const auth = login();
    const token = auth.token;

    getAuthMe(token, {
      id: auth.user && auth.user.id,
      cpf: auth.user && auth.user.cpf,
      email: auth.user && auth.user.email,
      role: auth.user && auth.user.role
    });

    const patient = createPatient(token);
    listUsers(token);
    listPatients(token);
    const filtered = listPatients(token, { cpf: patient.documentNumber });
    getPatientByCpf(token, patient.documentNumber);
    listAmbulatoryQueue(token);
    getMedicalRecordSummary(token);
    listNotifications(token, false);
    listNotifications(token, true);

    if (!filtered.find((item) => String(item.id) === String(patient.id))) {
      throw new Error(`Paciente ${patient.id} nao apareceu na leitura do dashboard por CPF.`);
    }

    sleep(1);
  });
}
