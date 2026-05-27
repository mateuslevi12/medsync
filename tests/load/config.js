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
  http_req_failed: ["rate<0.05"],
  http_req_duration: ["p(95)<2000"],
  checks: ["rate>0.95"]
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
  return notifications.find((notification) => String(notification.sourceAggregateId) === String(triageId));
}

export function waitForNotification(token, triageId, options = {}) {
  const attempts = Number(options.attempts || 5);
  const pauseSeconds = Number(options.pauseSeconds || 2);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const unread = listNotifications(token, true);
    const relatedNotification = findNotificationByTriage(unread, triageId);
    if (relatedNotification) {
      return relatedNotification;
    }

    sleep(pauseSeconds);
  }

  return null;
}
