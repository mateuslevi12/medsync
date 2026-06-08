import http from "k6/http";
import { check, fail, sleep } from "k6";

export const BASE_URL = String(__ENV.BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
export const MEDSYNC_EMAIL = __ENV.MEDSYNC_EMAIL || "admin@medsync.com";
export const MEDSYNC_PASSWORD = __ENV.MEDSYNC_PASSWORD || "admin123";
export const LOAD_PROFILE = (__ENV.LOAD_PROFILE || "").toLowerCase();

export const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

export const commonThresholds = {
  http_req_failed: ["rate==0"],
  http_req_duration: ["p(95)<2000"],
  checks: ["rate==1"]
};

export const smokeOptions = {
  vus: 1,
  duration: "30s",
  thresholds: commonThresholds
};

export const fullFlowOptions = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 5 },
    { duration: "30s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "30s", target: 0 }
  ],
  thresholds: commonThresholds
};

export function resolveOptions(defaultOptions) {
  if (LOAD_PROFILE === "smoke") {
    return smokeOptions;
  }

  return defaultOptions;
}

export function authHeaders(token) {
  return {
    ...jsonHeaders,
    Authorization: `Bearer ${token}`
  };
}

export function parseJson(response) {
  if (!response || !response.body) {
    return null;
  }

  try {
    return response.json();
  } catch {
    return null;
  }
}

export function checkResponse(response, label, options = {}) {
  const expectedStatus = Array.isArray(options.expectedStatus)
    ? options.expectedStatus
    : [options.expectedStatus || 200];
  const extraChecks = options.extraChecks || {};

  return check(response, {
    [`${label} status ${expectedStatus.join("/")}`]: (res) => expectedStatus.includes(res.status),
    [`${label} duration < 2000ms`]: (res) => res.timings.duration < 2000,
    ...extraChecks
  });
}

export function login() {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: MEDSYNC_EMAIL,
      password: MEDSYNC_PASSWORD
    }),
    {
      headers: jsonHeaders,
      tags: {
        flow: "auth",
        endpoint: "login"
      }
    }
  );

  const payload = parseJson(response);
  checkResponse(response, "login", {
    expectedStatus: 200,
    extraChecks: {
      "login token exists": () => Boolean(payload && payload.token),
      "login user exists": () => Boolean(payload && payload.user)
    }
  });

  if (!payload || !payload.token) {
    fail(`Login falhou em ${BASE_URL}. Verifique BASE_URL e credenciais.`);
  }

  return payload;
}

export function buildUniqueSuffix() {
  return `${Date.now()}-${__VU}-${__ITER}-${Math.floor(Math.random() * 10000)}`;
}

export function randomCpf() {
  const digits = buildUniqueSuffix().replace(/\D/g, "").slice(-11);
  return digits.padStart(11, "0");
}

export function randomPatient() {
  const suffix = buildUniqueSuffix();
  return {
    fullName: `Paciente K6 ${suffix}`,
    birthDate: "1990-01-01",
    gender: "OTHER",
    phone: `8599${randomCpf().slice(0, 7)}`,
    documentNumber: randomCpf(),
    address: `Rua de Teste ${suffix}, 100`
  };
}

export function calculateAgeFromBirthDate(birthDate) {
  if (!birthDate) {
    return 0;
  }

  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return Math.max(age, 0);
}

export function createPatient(token, overrides = {}) {
  const request = {
    ...randomPatient(),
    ...overrides
  };

  const response = http.post(`${BASE_URL}/api/patients`, JSON.stringify(request), {
    headers: authHeaders(token),
    tags: {
      flow: "patients",
      endpoint: "create"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "create patient", {
    expectedStatus: 201,
    extraChecks: {
      "create patient id exists": () => Boolean(payload && payload.id)
    }
  });

  if (!payload || !payload.id) {
    fail("Nao foi possivel criar paciente para o teste de carga.");
  }

  return payload;
}

export function listPatients(token) {
  const response = http.get(`${BASE_URL}/api/patients`, {
    headers: authHeaders(token),
    tags: {
      flow: "patients",
      endpoint: "list"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "list patients", {
    expectedStatus: 200,
    extraChecks: {
      "list patients returns array": () => Array.isArray(payload)
    }
  });

  return Array.isArray(payload) ? payload : [];
}

export function getPatientById(token, patientId) {
  const response = http.get(`${BASE_URL}/api/patients/${patientId}`, {
    headers: authHeaders(token),
    tags: {
      flow: "patients",
      endpoint: "detail"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "get patient by id", {
    expectedStatus: 200,
    extraChecks: {
      "get patient by id matches": () => String(payload && payload.id) === String(patientId)
    }
  });

  return payload;
}

export function listPatientAllergies(token, patientId) {
  const response = http.get(`${BASE_URL}/api/patients/${patientId}/allergies`, {
    headers: authHeaders(token),
    tags: {
      flow: "patients-clinical",
      endpoint: "list-allergies"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "list patient allergies", {
    expectedStatus: 200,
    extraChecks: {
      "list patient allergies returns array": () => Array.isArray(payload)
    }
  });

  return Array.isArray(payload) ? payload : [];
}

export function createPatientAllergy(token, patientId, overrides = {}) {
  const request = {
    type: "MEDICAMENTO",
    description: "Dipirona",
    severity: "MODERADA",
    ...overrides
  };

  const response = http.post(`${BASE_URL}/api/patients/${patientId}/allergies`, JSON.stringify(request), {
    headers: authHeaders(token),
    tags: {
      flow: "patients-clinical",
      endpoint: "create-allergy"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "create patient allergy", {
    expectedStatus: 201,
    extraChecks: {
      "create patient allergy id exists": () => Boolean(payload && payload.id),
      "create patient allergy patient matches": () => String(payload && payload.patientId) === String(patientId)
    }
  });

  if (!payload || !payload.id) {
    fail("Nao foi possivel criar a alergia do paciente.");
  }

  return payload;
}

export function listPatientVaccines(token, patientId) {
  const response = http.get(`${BASE_URL}/api/patients/${patientId}/vaccines`, {
    headers: authHeaders(token),
    tags: {
      flow: "patients-clinical",
      endpoint: "list-vaccines"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "list patient vaccines", {
    expectedStatus: 200,
    extraChecks: {
      "list patient vaccines returns array": () => Array.isArray(payload)
    }
  });

  return Array.isArray(payload) ? payload : [];
}

export function createPatientVaccine(token, patientId, overrides = {}) {
  const request = {
    name: "COVID-19",
    status: "EM_DIA",
    applicationDate: "2026-01-10",
    notes: "Registro criado pelo k6",
    ...overrides
  };

  const response = http.post(`${BASE_URL}/api/patients/${patientId}/vaccines`, JSON.stringify(request), {
    headers: authHeaders(token),
    tags: {
      flow: "patients-clinical",
      endpoint: "create-vaccine"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "create patient vaccine", {
    expectedStatus: 201,
    extraChecks: {
      "create patient vaccine id exists": () => Boolean(payload && payload.id),
      "create patient vaccine patient matches": () => String(payload && payload.patientId) === String(patientId)
    }
  });

  if (!payload || !payload.id) {
    fail("Nao foi possivel criar a vacina do paciente.");
  }

  return payload;
}

export function updatePatientVaccine(token, patientId, vaccineId, overrides = {}) {
  const request = {
    name: "COVID-19",
    status: "EM_DIA",
    applicationDate: "2026-01-10",
    notes: "Vacina atualizada pelo k6",
    ...overrides
  };

  const response = http.put(
    `${BASE_URL}/api/patients/${patientId}/vaccines/${vaccineId}`,
    JSON.stringify(request),
    {
      headers: authHeaders(token),
      tags: {
        flow: "patients-clinical",
        endpoint: "update-vaccine"
      }
    }
  );

  const payload = parseJson(response);
  checkResponse(response, "update patient vaccine", {
    expectedStatus: 200,
    extraChecks: {
      "update patient vaccine id matches": () => String(payload && payload.id) === String(vaccineId)
    }
  });

  return payload;
}

export function updatePatient(token, patient) {
  const request = {
    ...patient,
    address: `${patient.address} - atualizado`
  };

  const response = http.put(`${BASE_URL}/api/patients/${patient.id}`, JSON.stringify(request), {
    headers: authHeaders(token),
    tags: {
      flow: "patients",
      endpoint: "update"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "update patient", {
    expectedStatus: 200,
    extraChecks: {
      "update patient id matches": () => String(payload && payload.id) === String(patient.id)
    }
  });

  return payload;
}

export function ensurePatient(token) {
  const patients = listPatients(token);
  if (patients.length > 0) {
    return patients[0];
  }

  return createPatient(token);
}

export function createTriage(token, patient, overrides = {}) {
  const request = {
    patientId: patient.id,
    patientNameSnapshot: patient.fullName,
    symptoms: "Dor moderada e febre em observacao",
    bloodPressure: "12x8",
    heartRate: 88,
    respiratoryRate: 18,
    temperature: 37.6,
    oxygenSaturation: 98,
    painLevel: 5,
    priority: null,
    notes: "Triagem criada pelo k6",
    ...overrides
  };

  const response = http.post(`${BASE_URL}/api/triage`, JSON.stringify(request), {
    headers: authHeaders(token),
    tags: {
      flow: "triage",
      endpoint: "create"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "create triage", {
    expectedStatus: 201,
    extraChecks: {
      "create triage id exists": () => Boolean(payload && payload.id),
      "create triage patient matches": () => String(payload && payload.patientId) === String(patient.id)
    }
  });

  if (!payload || !payload.id) {
    fail("Nao foi possivel criar triagem para o teste.");
  }

  return payload;
}

export function listTriages(token, waitingOnly = false) {
  const path = waitingOnly ? "/api/triage/waiting" : "/api/triage";
  const endpoint = waitingOnly ? "waiting" : "list";

  const response = http.get(`${BASE_URL}${path}`, {
    headers: authHeaders(token),
    tags: {
      flow: "triage",
      endpoint
    }
  });

  const payload = parseJson(response);
  checkResponse(response, waitingOnly ? "list waiting triages" : "list triages", {
    expectedStatus: 200,
    extraChecks: {
      "list triages returns array": () => Array.isArray(payload)
    }
  });

  return Array.isArray(payload) ? payload : [];
}

export function listAmbulatoryQueue(token) {
  const response = http.get(`${BASE_URL}/api/ambulatory/queue`, {
    headers: authHeaders(token),
    tags: {
      flow: "ambulatory",
      endpoint: "queue-list"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "list ambulatory queue", {
    expectedStatus: 200,
    extraChecks: {
      "list ambulatory queue returns array": () => Array.isArray(payload)
    }
  });

  return Array.isArray(payload) ? payload : [];
}

export function createAmbulatoryAttendance(token, patient, overrides = {}) {
  const request = {
    patientId: patient.id,
    patientName: patient.fullName,
    patientCpf: patient.documentNumber,
    patientCns: patient.cns || null,
    patientPhone: patient.phone || null,
    patientAge: calculateAgeFromBirthDate(patient.birthDate),
    queueName: "ACOLHIMENTO",
    priority: "NORMAL",
    ...overrides
  };

  const response = http.post(`${BASE_URL}/api/ambulatory/queue`, JSON.stringify(request), {
    headers: authHeaders(token),
    tags: {
      flow: "ambulatory",
      endpoint: "queue-create"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "create ambulatory attendance", {
    expectedStatus: 201,
    extraChecks: {
      "create ambulatory attendance id exists": () => Boolean(payload && payload.id),
      "create ambulatory attendance patient matches": () => String(payload && payload.patientId) === String(patient.id)
    }
  });

  if (!payload || !payload.id) {
    fail("Nao foi possivel inserir o paciente na fila ambulatorial.");
  }

  return payload;
}

export function getAmbulatoryAttendance(token, attendanceId) {
  const response = http.get(`${BASE_URL}/api/ambulatory/queue/${attendanceId}`, {
    headers: authHeaders(token),
    tags: {
      flow: "ambulatory",
      endpoint: "queue-detail"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "get ambulatory attendance", {
    expectedStatus: 200,
    extraChecks: {
      "get ambulatory attendance id matches": () => String(payload && payload.id) === String(attendanceId)
    }
  });

  return payload;
}

export function callAmbulatoryTriage(token, attendanceId) {
  const response = http.patch(`${BASE_URL}/api/ambulatory/queue/${attendanceId}/call-triage`, null, {
    headers: authHeaders(token),
    tags: {
      flow: "ambulatory",
      endpoint: "call-triage"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "call ambulatory triage", {
    expectedStatus: 200,
    extraChecks: {
      "call ambulatory triage status matches": () => payload && payload.status === "EM_TRIAGEM"
    }
  });

  return payload;
}

export function completeAmbulatoryTriage(token, attendanceId, overrides = {}) {
  const request = {
    observations: "Paciente estabilizado durante o acolhimento pelo k6.",
    destination: "Atendimento Médico",
    riskClassification: "URGENTE",
    weightKg: "70",
    heightCm: "170",
    bmi: "24.22",
    abdominalCircumference: "82",
    bloodPressure: "12x8",
    respiratoryRate: "18",
    heartRate: "86",
    temperature: "37.4",
    oxygenSaturation: "98",
    glucose: "102",
    painLevel: 6,
    hasAllergy: true,
    allergyType: "MEDICAMENTO",
    allergyDescription: "Dipirona",
    allergySeverity: "MODERADA",
    vaccines: [
      { name: "COVID-19", status: "EM_DIA" },
      { name: "Influenza", status: "PENDENTE" },
      { name: "Hepatite B", status: "EM_DIA" },
      { name: "Tetano", status: "DESCONHECIDO" }
    ],
    ...overrides
  };

  const response = http.patch(
    `${BASE_URL}/api/ambulatory/queue/${attendanceId}/complete-triage`,
    JSON.stringify(request),
    {
      headers: authHeaders(token),
      tags: {
        flow: "ambulatory",
        endpoint: "complete-triage"
      }
    }
  );

  const payload = parseJson(response);
  checkResponse(response, "complete ambulatory triage", {
    expectedStatus: 200,
    extraChecks: {
      "complete ambulatory triage status matches": () => payload && payload.status === "AGUARDANDO_MEDICO",
      "complete ambulatory triage risk matches": () => payload && payload.riskClassification === request.riskClassification
    }
  });

  return payload;
}

export function callAmbulatoryMedical(token, attendanceId) {
  const response = http.patch(`${BASE_URL}/api/ambulatory/queue/${attendanceId}/call-medical`, null, {
    headers: authHeaders(token),
    tags: {
      flow: "ambulatory",
      endpoint: "call-medical"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "call ambulatory medical", {
    expectedStatus: 200,
    extraChecks: {
      "call ambulatory medical status matches": () => payload && payload.status === "EM_ATENDIMENTO_MEDICO"
    }
  });

  return payload;
}

export function finishAmbulatoryMedical(token, attendanceId, overrides = {}) {
  const request = {
    assessment: "Paciente com quadro estável e sem sinais de alarme.",
    plan: "Sintomáticos, hidratação oral e retorno se piora clínica.",
    procedureCode: "0301060096",
    cidCodes: ["J00", "R50"],
    notifications: "NOTIFICACAO COMPULSORIA NAO NECESSARIA",
    accidentMoto: false,
    accidentCarro: false,
    accidentBicicleta: false,
    accidentPedestre: false,
    accidentOutros: false,
    notes: "Atendimento encerrado pelo fluxo de carga.",
    professionalName: "Medico K6",
    ...overrides
  };

  const response = http.patch(
    `${BASE_URL}/api/ambulatory/queue/${attendanceId}/finish-medical`,
    JSON.stringify(request),
    {
      headers: authHeaders(token),
      tags: {
        flow: "ambulatory",
        endpoint: "finish-medical"
      }
    }
  );

  const payload = parseJson(response);
  checkResponse(response, "finish ambulatory medical", {
    expectedStatus: 200,
    extraChecks: {
      "finish ambulatory medical status matches": () => payload && payload.status === "FINALIZADO",
      "finish ambulatory medical record id exists": () => Boolean(payload && payload.medicalAttendanceId)
    }
  });

  return payload;
}

export function getMedicalRecord(token, patientId) {
  const response = http.get(`${BASE_URL}/api/medical-records/patient/${patientId}`, {
    headers: authHeaders(token),
    tags: {
      flow: "medical-records",
      endpoint: "record"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "get medical record", {
    expectedStatus: 200,
    extraChecks: {
      "get medical record patient matches": () => String(payload && payload.patientId) === String(patientId),
      "get medical record triages exists": () => Array.isArray(payload && payload.triages),
      "get medical record attendances exists": () => Array.isArray(payload && payload.medicalAttendances),
      "get medical record timeline exists": () => Array.isArray(payload && payload.timeline)
    }
  });

  return payload;
}

export function getMedicalTimeline(token, patientId) {
  const response = http.get(`${BASE_URL}/api/medical-records/patient/${patientId}/timeline`, {
    headers: authHeaders(token),
    tags: {
      flow: "medical-records",
      endpoint: "timeline"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "get medical timeline", {
    expectedStatus: 200,
    extraChecks: {
      "get medical timeline returns array": () => Array.isArray(payload)
    }
  });

  return Array.isArray(payload) ? payload : [];
}

export function listNotifications(token, unreadOnly = false) {
  const path = unreadOnly ? "/api/notifications/unread" : "/api/notifications";
  const endpoint = unreadOnly ? "unread" : "list";

  const response = http.get(`${BASE_URL}${path}`, {
    headers: authHeaders(token),
    tags: {
      flow: "notifications",
      endpoint
    }
  });

  const payload = parseJson(response);
  checkResponse(response, unreadOnly ? "list unread notifications" : "list notifications", {
    expectedStatus: 200,
    extraChecks: {
      "list notifications returns array": () => Array.isArray(payload)
    }
  });

  return Array.isArray(payload) ? payload : [];
}

export function markNotificationAsRead(token, notificationId) {
  const response = http.patch(`${BASE_URL}/api/notifications/${notificationId}/read`, null, {
    headers: authHeaders(token),
    tags: {
      flow: "notifications",
      endpoint: "mark-read"
    }
  });

  const payload = parseJson(response);
  checkResponse(response, "mark notification as read", {
    expectedStatus: 200,
    extraChecks: {
      "mark notification as read returns id": () => String(payload && payload.id) === String(notificationId)
    }
  });

  return payload;
}

export function markAllNotificationsAsRead(token) {
  const response = http.patch(`${BASE_URL}/api/notifications/read-all`, null, {
    headers: authHeaders(token),
    tags: {
      flow: "notifications",
      endpoint: "mark-all-read"
    }
  });

  checkResponse(response, "mark all notifications as read", {
    expectedStatus: 204
  });
}

export function findNotificationByTriage(notifications, triageId) {
  return findNotificationByAggregate(notifications, triageId);
}

export function findNotificationByAggregate(notifications, aggregateId, expectedTypes = []) {
  return notifications.find((notification) => {
    const aggregateMatches = String(notification.sourceAggregateId) === String(aggregateId);
    if (!aggregateMatches) {
      return false;
    }

    if (!expectedTypes.length) {
      return true;
    }

    return expectedTypes.includes(notification.type);
  });
}

export function waitForNotification(token, aggregateId, options = {}) {
  const attempts = Number(options.attempts || 5);
  const pauseSeconds = Number(options.pauseSeconds || 2);
  const expectedTypes = Array.isArray(options.expectedTypes) ? options.expectedTypes : [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const unread = listNotifications(token, true);
    const relatedNotification = findNotificationByAggregate(unread, aggregateId, expectedTypes);
    if (relatedNotification) {
      return relatedNotification;
    }

    sleep(pauseSeconds);
  }

  return null;
}
