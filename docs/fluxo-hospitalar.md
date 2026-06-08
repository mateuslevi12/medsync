# Fluxo Hospitalar Real

## Escopo

O MedSync possui um fluxo ambulatorial persistido de ponta a ponta, sem remover o fallback demo do frontend:

`Paciente -> fila -> acolhimento -> atendimento medico -> prontuario/timeline -> notificacoes`

## Servicos envolvidos

`triage-service`:

- fila ambulatorial
- acolhimento
- atendimento medico
- publicacao Kafka
- compatibilidade legado

`medical-record-service`:

- fonte principal do prontuario
- timeline clinica longitudinal
- resumo para dashboard/monitoramento/relatorios

`patients-service`:

- pacientes
- alergias
- vacinas

`notifications-service`:

- notificacoes persistidas a partir de eventos Kafka

## Estados do atendimento

`AmbulatoryStatus`:

- `AGUARDANDO_TRIAGEM`
- `EM_TRIAGEM`
- `AGUARDANDO_MEDICO`
- `EM_ATENDIMENTO_MEDICO`
- `FINALIZADO`

`RiskClassification`:

- `EMERGENCIA`
- `MUITO_URGENTE`
- `URGENTE`
- `POUCO_URGENTE`
- `NAO_URGENTE`

`AmbulatoryPriority`:

- `NORMAL`
- `ALTA`
- `CRITICA`

## Endpoints

Fila ambulatorial:

- `GET /api/ambulatory/queue`
- `POST /api/ambulatory/queue`
- `GET /api/ambulatory/queue/{id}`
- `PATCH /api/ambulatory/queue/{id}/call-triage`
- `PATCH /api/ambulatory/queue/{id}/complete-triage`
- `PATCH /api/ambulatory/queue/{id}/call-medical`
- `PATCH /api/ambulatory/queue/{id}/finish-medical`

Prontuario e timeline:

- `GET /api/medical-records/patient/{patientId}`
- `GET /api/medical-records/patient/{patientId}/timeline`
- `POST /api/medical-records/patient/{patientId}/triage-records`
- `POST /api/medical-records/patient/{patientId}/medical-attendances`
- `POST /api/medical-records/patient/{patientId}/timeline-events`
- `GET /api/medical-records/summary`

Informacoes clinicas do paciente:

- `GET /api/patients/{patientId}/allergies`
- `POST /api/patients/{patientId}/allergies`
- `DELETE /api/patients/{patientId}/allergies/{allergyId}`
- `GET /api/patients/{patientId}/vaccines`
- `POST /api/patients/{patientId}/vaccines`
- `PUT /api/patients/{patientId}/vaccines/{vaccineId}`

## Sequencia operacional

### 1. Inclusao na fila

- recepcao inclui o paciente em `POST /api/ambulatory/queue`
- o atendimento nasce em `AGUARDANDO_TRIAGEM`
- o `triage-service` salva a fila e sincroniza snapshot inicial com o `medical-record-service`
- evento Kafka operacional e publicado

### 2. Chamada para acolhimento

- `PATCH /api/ambulatory/queue/{id}/call-triage`
- status vai para `EM_TRIAGEM`
- `triageStartedAt` e preenchido

### 3. Conclusao do acolhimento

- frontend sincroniza alergias e vacinas no `patients-service`
- `PATCH /api/ambulatory/queue/{id}/complete-triage`
- sinais vitais, observacoes, risco e snapshot vacinal sao persistidos no `triage-service`
- `triage-service` envia a triagem consolidada ao `medical-record-service`
- status vai para `AGUARDANDO_MEDICO`

### 4. Chamada para atendimento medico

- `PATCH /api/ambulatory/queue/{id}/call-medical`
- status vai para `EM_ATENDIMENTO_MEDICO`

### 5. Finalizacao medica

- `PATCH /api/ambulatory/queue/{id}/finish-medical`
- avaliacao, plano, CID, procedimento e observacoes sao persistidos localmente
- `triage-service` cria o registro longitudinal em MongoDB
- status vai para `FINALIZADO`

### 6. Consulta do prontuario

- `GET /api/medical-records/patient/{patientId}`
- leitura agora vem do `medical-record-service`
- o documento agrega:
  - dados do paciente
  - snapshots clinicos
  - triagens
  - atendimentos medicos
  - timeline

## Kafka e notificacoes

Topicos preservados:

- `triage.created`
- `triage.updated`
- `triage.priority.changed`

Topico central:

- `ambulatory.flow`

Eventos publicados:

- `PATIENT_ADDED_TO_QUEUE`
- `TRIAGE_STARTED`
- `TRIAGE_COMPLETED`
- `PATIENT_REFERRED_TO_MEDICAL`
- `MEDICAL_STARTED`
- `MEDICAL_FINISHED`

Consumidores:

- `notifications-service`: transforma em notificacoes persistidas
- `medical-record-service`: acrescenta eventos na timeline longitudinal

## Validacao final executada

Rodada validada em 2026-06-02:

- stack local subida com `docker compose up --build -d`
- healthchecks `8080..8086` validados
- Prometheus raspando `medical-record-service`
- smoke funcional via API com prontuario em MongoDB
- smoke `k6` com `LOAD_PROFILE=smoke` executado sem falhas

## Limitacoes restantes

- prontuario longitudinal entregue e focado no fluxo ambulatorial, nao em historico hospitalar completo
- exportacoes de relatorios ainda nao estao implementadas
- o fluxo legado `/api/triage` continua ativo por compatibilidade
