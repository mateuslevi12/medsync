import { group, sleep } from "k6";
import {
  createTriage,
  ensurePatient,
  listTriages,
  login,
  resolveOptions,
  smokeOptions
} from "./config.js";

export const options = resolveOptions(smokeOptions);

export default function () {
  group("triage flow", () => {
    const auth = login();
    const token = auth.token;

    const patient = ensurePatient(token);
    const triage = createTriage(token, patient);

    listTriages(token, false);
    const waiting = listTriages(token, true);

    if (!waiting.find((item) => String(item.id) === String(triage.id))) {
      throw new Error(`Triagem ${triage.id} nao apareceu na fila de espera.`);
    }

    // A criacao da triagem dispara o evento Kafka que o notifications-service consome.
    sleep(1);
  });
}
