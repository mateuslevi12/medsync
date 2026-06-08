import type { MedicalConductsState, TimelineEventType } from "@/lib/types";

export type RiskLevel =
  | "EMERGÊNCIA"
  | "MUITO URGENTE"
  | "URGENTE"
  | "POUCO URGENTE"
  | "NÃO URGENTE";

export type VaccineStatus = "Em dia" | "Pendente" | "Desconhecido";

export type DemoPatient = {
  id: string;
  fullName: string;
  cpf: string;
  cns: string;
  age: number;
  birthDate: string;
  phone: string;
  address: string;
  gender: "Masculino" | "Feminino" | "Outro";
};

export type QueueItem = {
  patientId: string;
  queue: string;
  classification: RiskLevel | null;
  status: string;
  priority: string;
  waitTime: string;
  route: string;
};

export type TimelineEvent = {
  date: string;
  title: string;
  description?: string;
  type?: TimelineEventType;
};

export type DemoTriage = {
  patientId: string;
  observations: string;
  destination: string;
  risk: RiskLevel | null;
  triageStartedAt?: string;
  triageCompletedAt?: string | null;
  weightKg: string;
  heightCm: string;
  bmi: string;
  abdominalCircumference: string;
  bloodPressure: string;
  respiratoryRate: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  glucose: string;
  painLevel: string;
  hasAllergy: boolean;
  allergyType: string;
  allergyDescription: string;
  allergySeverity: string;
  vaccines: Array<{
    name: string;
    status: VaccineStatus;
  }>;
};

export type MedicalEncounter = {
  patientId: string;
  evaluation: string;
  plan: string;
  procedureCode: string;
  cidSuggestions: string[];
  selectedCid: string[];
  notificationsLabel: string;
  accidentReasons: string[];
  conducts: MedicalConductsState;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  category: string;
  read: boolean;
  createdAt: string;
};

export const demoPatients: DemoPatient[] = [
  {
    id: "1",
    fullName: "ABDA BARBOZA DOS SANTOS",
    cpf: "10209405309",
    cns: "706203549544067",
    age: 7,
    birthDate: "2018-08-14",
    phone: "85997400655",
    address: "Fortaleza, CE",
    gender: "Feminino",
  },
];

export const demoQueue: QueueItem[] = [
  {
    patientId: "1",
    queue: "ATENDIMENTO MÉDICO",
    classification: "URGENTE",
    status: "AGUARDANDO MÉDICO",
    priority: "Normal",
    waitTime: "12m",
    route: "/atendimento-medico/1",
  },
];

export const demoTimeline: Record<string, TimelineEvent[]> = {
  "1": [
    {
      date: "07/06/2026 09:54:49",
      title: "Entrada na fila — Acolhimento",
      description: "Paciente direcionado para acolhimento inicial.",
      type: "PACIENTE_INCLUIDO_FILA",
    },
    {
      date: "07/06/2026 18:45:49",
      title: "Acolhimento — Risco URGENTE",
      description: "Paciente estável, encaminhado para avaliação médica.",
      type: "TRIAGEM_FINALIZADA",
    },
    {
      date: "07/06/2026 19:45:49",
      title: "Atendimento médico iniciado",
      description: "Paciente direcionado para atendimento clínico.",
      type: "ATENDIMENTO_MEDICO_INICIADO",
    },
    {
      date: "07/06/2026 20:15:49",
      title: "Atendimento finalizado",
      description: "Conduta registrada em prontuário.",
      type: "ATENDIMENTO_MEDICO_FINALIZADO",
    },
    {
      date: "08/05/2026 18:45:49",
      title: "Acolhimento — Risco POUCO URGENTE",
      description: "Triagem anterior registrada em histórico.",
      type: "TRIAGEM_FINALIZADA",
    },
    {
      date: "08/05/2026 19:45:49",
      title: "Atendimento médico iniciado",
      description: "Consulta de rotina registrada em histórico.",
      type: "ATENDIMENTO_MEDICO_INICIADO",
    },
    {
      date: "08/05/2026 20:00:49",
      title: "Atendimento finalizado",
      description: "Consulta encerrada sem intercorrências.",
      type: "ATENDIMENTO_MEDICO_FINALIZADO",
    },
  ],
};

export const demoTriageByPatientId: Record<string, DemoTriage> = {
  "1": {
    patientId: "1",
    observations: "Paciente refere cefaleia há 3 dias, com piora hoje. Náuseas associadas.",
    destination: "Atendimento Médico",
    risk: "URGENTE",
    triageStartedAt: "2026-06-07T17:05:00.000Z",
    triageCompletedAt: "2026-06-07T18:45:49.000Z",
    weightKg: "68",
    heightCm: "172",
    bmi: "23,0",
    abdominalCircumference: "76",
    bloodPressure: "130/85",
    respiratoryRate: "18",
    heartRate: "82",
    temperature: "37,8",
    oxygenSaturation: "96",
    glucose: "110",
    painLevel: "6",
    hasAllergy: true,
    allergyType: "Medicamento",
    allergyDescription: "Dipirona",
    allergySeverity: "Moderada",
    vaccines: [
      { name: "COVID-19", status: "Em dia" },
      { name: "Influenza", status: "Pendente" },
      { name: "Hepatite B", status: "Em dia" },
      { name: "Tétano", status: "Desconhecido" },
    ],
  },
};

export const demoMedicalByPatientId: Record<string, MedicalEncounter> = {
  "1": {
    patientId: "1",
    evaluation:
      "Paciente apresenta cefaleia tensional acompanhada de pico hipertensivo. Sem sinais de alarme neurológicos. Ausculta cardiopulmonar sem alterações.",
    plan:
      "Analgesia, hidratação e repouso. Monitoramento da PA por 7 dias. Retorno se piora dos sintomas ou sinais neurológicos.",
    procedureCode: "0301060096",
    cidSuggestions: ["R51 — Cefaleia", "I10 — Hipertensão essencial", "Z00.0 — Exame médico geral"],
    selectedCid: ["R51", "I10"],
    notificationsLabel: "Sem notificações adicionais.",
    accidentReasons: [],
    conducts: {
      medications: [
        {
          id: "med-1",
          medicationName: "Paracetamol 750mg",
          protocol: "",
          scheduledAt: "2026-06-07T19:50:00.000Z",
          dosage: "1 cp VO 8/8h por 3 dias",
          status: "SALVO",
          createdAt: "2026-06-07T19:45:49.000Z",
        },
      ],
      procedures: [
        {
          id: "proc-1",
          procedureName: "Monitorização de pressão arterial",
          protocol: "",
          scheduledAt: "2026-06-07T19:55:00.000Z",
          observations: "Aferir PA a cada 30 minutos.",
          status: "REALIZADO",
          createdAt: "2026-06-07T19:46:10.000Z",
        },
      ],
      observationPrescriptions: [
        {
          id: "obs-1",
          title: "Observação clínica",
          description: "Manter em observação por 2 horas com reavaliação se persistir cefaleia.",
          observationTime: "2 horas",
          status: "SALVO",
          createdAt: "2026-06-07T19:46:40.000Z",
        },
      ],
      exams: [
        {
          id: "exam-1",
          examName: "Hemograma completo",
          protocol: "",
          observations: "Coletar ainda hoje.",
          status: "SOLICITADO",
          createdAt: "2026-06-07T19:47:00.000Z",
        },
        {
          id: "exam-2",
          examName: "Glicemia de jejum",
          protocol: "",
          observations: "",
          status: "SOLICITADO",
          createdAt: "2026-06-07T19:47:20.000Z",
        },
      ],
      orientations: [
        {
          id: "ori-1",
          title: "Orientações gerais",
          text: "Manter hidratação, repouso e retorno imediato em caso de piora da dor.",
          status: "SALVO",
          createdAt: "2026-06-07T19:48:00.000Z",
        },
      ],
      certificates: [
        {
          id: "cert-1",
          issueDate: "2026-06-07",
          startDate: "2026-06-07",
          days: 1,
          text: "Atesto, para os devidos fins, que ABDA BARBOZA DOS SANTOS recebeu atendimento e deverá permanecer afastada por 1 dia.",
          includeCidCode: false,
          includeCidDescription: false,
          status: "SALVO",
          createdAt: "2026-06-07T19:49:00.000Z",
        },
      ],
      declarations: [
        {
          id: "dec-1",
          startDateTime: "2026-06-07T18:45:00.000Z",
          endDateTime: "2026-06-07T20:15:00.000Z",
          text: "Declaro que a paciente permaneceu no hospital no período informado.",
          status: "SALVO",
          createdAt: "2026-06-07T19:49:30.000Z",
        },
      ],
      recipes: [
        {
          id: "rec-1",
          fillMode: "PADRAO",
          recipeType: "COMUM",
          favoriteName: "Analgésico",
          text: "Paracetamol 750mg, tomar 1 comprimido VO a cada 8 horas por 3 dias.",
          saveAsFavorite: true,
          status: "SALVO",
          createdAt: "2026-06-07T19:50:00.000Z",
        },
      ],
    },
  },
};

export const demoUsers = [
  { id: "1", name: "Dra. Ana Ribeiro", email: "ana@medsync.dev", profile: "Médico", status: "ativo" },
  { id: "2", name: "Enf. Carlos Souza", email: "carlos@medsync.dev", profile: "Enfermeiro", status: "ativo" },
  { id: "3", name: "Marta Lima", email: "marta@medsync.dev", profile: "Recepcionista", status: "ativo" },
  { id: "4", name: "Admin Sistema", email: "admin@medsync.dev", profile: "Administrador", status: "ativo" },
];

const DEMO_PATIENTS_STORAGE_KEY = "medsync.demo.patients.v2";
const DEMO_QUEUE_STORAGE_KEY = "medsync.demo.queue.v2";
const DEMO_TRIAGE_STORAGE_KEY = "medsync.demo.triage.v2";
const DEMO_MEDICAL_STORAGE_KEY = "medsync.demo.medical.v2";

export const demoNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Sistema iniciado",
    message: "Modo demo ativo. Dados mockados carregados.",
    category: "Operação",
    read: false,
    createdAt: "02/06/2026, 02:34",
  },
  {
    id: "2",
    title: "Paciente encaminhado",
    message: "PACIENTE TESTE foi direcionado ao atendimento médico.",
    category: "Fila",
    read: true,
    createdAt: "02/06/2026, 08:31",
  },
  {
    id: "3",
    title: "Acolhimento pendente",
    message: "ABDA BARBOZA DOS SANTOS aguarda triagem inicial.",
    category: "Acolhimento",
    read: true,
    createdAt: "02/06/2026, 02:35",
  },
];

export const ambulatoryModules = [
  {
    title: "Fila de Atendimento",
    description: "Visualização operacional da fila com chamada por etapa.",
    href: "/fila-atendimento",
  },
  {
    title: "Pacientes",
    description: "Cadastro, prontuário, timeline e consulta rápida.",
    href: "/patients",
  },
  {
    title: "Monitoramento",
    description: "Indicadores hospitalares e observabilidade técnica.",
    href: "/monitoramento",
  },
  {
    title: "Relatórios",
    description: "Acesso rápido aos relatórios operacionais do ambulatório.",
    href: "/relatorios",
  },
];

export const reportCards = [
  { title: "Relatório de pacientes", description: "Preparado para integração com backend." },
  { title: "Relatório de triagens", description: "Preparado para integração com backend." },
  { title: "Relatório de atendimentos", description: "Preparado para integração com backend." },
  { title: "Relatório de notificações", description: "Preparado para integração com backend." },
  { title: "Relatório de produção ambulatorial", description: "Preparado para integração com backend." },
  { title: "Relatório de testes de carga", description: "Preparado para integração com backend." },
];

export const technicalServices = [
  "API Gateway",
  "Auth Service",
  "Users Service",
  "Patients Service",
  "Triage Service",
  "Notifications Service",
  "Kafka",
  "Redis",
  "PostgreSQL",
  "Prometheus",
  "Grafana",
];

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredValue<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeStoredValue<T>(key: string, value: T) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function calculateAgeFromBirthDate(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

export function getDemoPatients() {
  return readStoredValue<DemoPatient[]>(DEMO_PATIENTS_STORAGE_KEY, demoPatients);
}

export function createDemoPatient(
  patient: Omit<DemoPatient, "id" | "age"> & {
    age?: number;
  }
) {
  const patients = getDemoPatients();
  const nextId = patients.reduce((highestId, currentPatient) => {
    return Math.max(highestId, Number(currentPatient.id) || 0);
  }, 0) + 1;

  const createdPatient: DemoPatient = {
    id: String(nextId),
    fullName: patient.fullName,
    cpf: patient.cpf,
    cns: patient.cns,
    age: patient.age ?? calculateAgeFromBirthDate(patient.birthDate),
    birthDate: patient.birthDate,
    phone: patient.phone,
    address: patient.address,
    gender: patient.gender,
  };

  writeStoredValue(DEMO_PATIENTS_STORAGE_KEY, [...patients, createdPatient]);
  return createdPatient;
}

export function updateDemoPatient(id: string, patient: Omit<DemoPatient, "id" | "age"> & { age?: number }) {
  const patients = getDemoPatients();
  const updatedPatient: DemoPatient = {
    id,
    fullName: patient.fullName,
    cpf: patient.cpf,
    cns: patient.cns,
    age: patient.age ?? calculateAgeFromBirthDate(patient.birthDate),
    birthDate: patient.birthDate,
    phone: patient.phone,
    address: patient.address,
    gender: patient.gender,
  };

  writeStoredValue(
    DEMO_PATIENTS_STORAGE_KEY,
    patients.map((currentPatient) => (currentPatient.id === id ? updatedPatient : currentPatient))
  );

  return updatedPatient;
}

export function getDemoQueue() {
  return readStoredValue<QueueItem[]>(DEMO_QUEUE_STORAGE_KEY, demoQueue);
}

export function upsertDemoQueueItem(
  item: Pick<QueueItem, "patientId" | "queue" | "classification" | "status" | "priority">
) {
  const queue = getDemoQueue();
  const nextItem: QueueItem = {
    patientId: item.patientId,
    queue: item.queue,
    classification: item.classification,
    status: item.status,
    priority: item.priority,
    waitTime: "0m",
    route: item.queue === "ATENDIMENTO MÉDICO" ? `/atendimento-medico/${item.patientId}` : `/acolhimento/${item.patientId}`,
  };

  const queueWithoutPatient = queue.filter((queueItem) => queueItem.patientId !== item.patientId);
  writeStoredValue(DEMO_QUEUE_STORAGE_KEY, [...queueWithoutPatient, nextItem]);

  return nextItem;
}

export function getPatientById(id: string) {
  return getDemoPatients().find((patient) => patient.id === id) || null;
}

export function getQueueWithPatients() {
  return getDemoQueue().map((queueItem) => ({
    ...queueItem,
    patient: getPatientById(queueItem.patientId),
  }));
}

export function upsertDemoTriage(patientId: string, triage: DemoTriage) {
  const current = readStoredValue<Record<string, DemoTriage>>(DEMO_TRIAGE_STORAGE_KEY, demoTriageByPatientId);
  const next = {
    ...current,
    [patientId]: triage,
  };

  writeStoredValue(DEMO_TRIAGE_STORAGE_KEY, next);
  return next[patientId];
}

export function getTimelineByPatientId(id: string) {
  return demoTimeline[id] || [];
}

export function getTriageByPatientId(id: string) {
  const triageByPatientId = readStoredValue<Record<string, DemoTriage>>(DEMO_TRIAGE_STORAGE_KEY, demoTriageByPatientId);
  return triageByPatientId[id] || null;
}

export function getMedicalByPatientId(id: string) {
  const medicalByPatientId = readStoredValue<Record<string, MedicalEncounter>>(DEMO_MEDICAL_STORAGE_KEY, demoMedicalByPatientId);
  return medicalByPatientId[id] || null;
}

export function upsertDemoMedical(patientId: string, medical: MedicalEncounter) {
  const current = readStoredValue<Record<string, MedicalEncounter>>(DEMO_MEDICAL_STORAGE_KEY, demoMedicalByPatientId);
  const next = {
    ...current,
    [patientId]: medical,
  };

  writeStoredValue(DEMO_MEDICAL_STORAGE_KEY, next);
  return next[patientId];
}

export function getDashboardMetrics() {
  return [
    { label: "Pacientes cadastrados", value: "3" },
    { label: "Na fila", value: "2" },
    { label: "Aguardando triagem", value: "1" },
    { label: "Aguardando médico", value: "1" },
    { label: "Finalizados hoje", value: "0" },
    { label: "Notificações", value: "1" },
  ];
}

export function getRiskSummary() {
  return [
    { label: "EMERGÊNCIA", value: 0 },
    { label: "MUITO URGENTE", value: 0 },
    { label: "URGENTE", value: 1 },
    { label: "POUCO URGENTE", value: 0 },
    { label: "NÃO URGENTE", value: 0 },
  ];
}

export function getHospitalStatusSummary() {
  return [
    { label: "Aguardando triagem", value: 1 },
    { label: "Em triagem", value: 0 },
    { label: "Aguardando médico", value: 1 },
    { label: "Em atendimento", value: 0 },
    { label: "Finalizado", value: 0 },
  ];
}
