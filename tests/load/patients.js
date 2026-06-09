import { group, sleep } from "k6";
import {
  getPatientById,
  getPatientByCpf,
  listPatients,
  login,
  resolveOptions,
  smokeOptions,
  createPatient,
  updatePatient
} from "./config.js";

export const options = resolveOptions(smokeOptions);

export default function () {
  group("patients flow", () => {
    const auth = login();
    const token = auth.token;

    listPatients(token);
    const patient = createPatient(token);
    getPatientById(token, patient.id);
    getPatientByCpf(token, patient.documentNumber);
    const filtered = listPatients(token, { cpf: patient.documentNumber });

    if (!filtered.find((item) => String(item.id) === String(patient.id))) {
      throw new Error(`Paciente ${patient.id} nao apareceu na busca por CPF.`);
    }

    updatePatient(token, patient);

    sleep(1);
  });
}
