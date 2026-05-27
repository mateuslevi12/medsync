import { group, sleep } from "k6";
import {
  getPatientById,
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
    updatePatient(token, patient);

    sleep(1);
  });
}
