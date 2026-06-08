# Arquitetura Final - MedSync

## 1. Visao geral

O MedSync adota arquitetura distribuida baseada em microservices, com gateway unico de entrada, persistencia por dominio, mensageria assincrona e fallback visual controlado no frontend.

Nesta etapa final o prontuario deixou de viver apenas no `triage-service` e passou a ter uma fonte principal separada em MongoDB por meio do `medical-record-service`.

## 2. Diagrama textual

```text
Frontend Next.js
  -> API Gateway
    -> auth-service
    -> users-service
    -> patients-service
    -> triage-service
    -> medical-record-service
    -> notifications-service

patients-service
  -> pacientes
  -> alergias
  -> vacinas
  -> Redis

triage-service
  -> fila ambulatorial
  -> acolhimento
  -> atendimento medico
  -> snapshot relacional legado
  -> Kafka producer
  -> sync interno com medical-record-service

medical-record-service
  -> prontuario longitudinal
  -> timeline clinica
  -> resumo para dashboard
  -> MongoDB
  -> Kafka consumer de ambulatory.flow

notifications-service
  -> Kafka consumer
  -> notificacoes persistidas

Prometheus -> /actuator/prometheus
Grafana -> Prometheus
```

## 3. Responsabilidades por servico

`frontend`:

- interface em Next.js
- shell protegido unificado
- modo `API` e modo `demo`
- telas de fila, acolhimento, atendimento medico, prontuario, timeline, dashboard, monitoramento e relatorios

`api-gateway`:

- ponto unico de entrada HTTP
- roteia `/api/auth`, `/api/users`, `/api/patients`, `/api/triage`, `/api/ambulatory`, `/api/medical-records` e `/api/notifications`

`auth-service`:

- autentica usuarios
- emite JWT

`users-service`:

- CRUD de usuarios e perfis

`patients-service`:

- CRUD de pacientes
- busca por nome e CPF
- armazenamento de `cns`
- alergias e vacinas
- cache Redis com invalidacao em alteracoes clinicas

`triage-service`:

- fila ambulatorial (`AmbulatoryAttendance`)
- acolhimento com sinais vitais e classificacao de risco
- atendimento medico (`MedicalAttendance`)
- timeline clinico-operacional local
- compatibilidade com o fluxo legado `/api/triage`
- publicacao Kafka para notificacoes
- sincronizacao best-effort com o `medical-record-service`

`medical-record-service`:

- fonte principal de `/api/medical-records/**`
- prontuario por paciente em `MedicalRecordDocument`
- snapshots de alergias e vacinas
- triagens e atendimentos medicos longitudinalmente agregados
- timeline clinica enriquecida por eventos do fluxo ambulatorial
- endpoint de resumo para dashboard, monitoramento e relatorios

`notifications-service`:

- consumo dos topicos de triagem e fluxo ambulatorial
- persistencia e leitura de notificacoes

## 4. Comunicacao sincrona

Fluxo principal:

`frontend -> api-gateway -> microservices REST`

Chamadas relevantes do frontend novo:

- `/api/ambulatory/queue`
- `/api/medical-records/patient/{patientId}`
- `/api/medical-records/patient/{patientId}/timeline`
- `/api/medical-records/summary`
- `/api/patients/{patientId}/allergies`
- `/api/patients/{patientId}/vaccines`
- `/api/notifications`

Chamadas internas novas:

- `triage-service -> medical-record-service` com `X-Internal-Token`
- `PUT /api/medical-records/internal/patient/{patientId}/snapshot`
- `POST /api/medical-records/internal/patient/{patientId}/triage-records`
- `POST /api/medical-records/internal/patient/{patientId}/medical-attendances`

## 5. Comunicacao assincrona

Topicos mantidos:

- `triage.created`
- `triage.updated`
- `triage.priority.changed`

Topico central do fluxo hospitalar:

- `ambulatory.flow`

Eventos publicados pelo `triage-service`:

- `PATIENT_ADDED_TO_QUEUE`
- `TRIAGE_STARTED`
- `TRIAGE_COMPLETED`
- `PATIENT_REFERRED_TO_MEDICAL`
- `MEDICAL_STARTED`
- `MEDICAL_FINISHED`

Consumidores:

- `notifications-service`: transforma eventos em notificacoes persistidas
- `medical-record-service`: acrescenta eventos na timeline clinica longitudinal

## 6. Persistencia

`patients-service`:

- tabela de pacientes
- tabela de alergias
- tabela de vacinas
- cache Redis por `id` e `cpf`

`triage-service`:

- tabela de atendimentos ambulatoriais
- tabela de atendimentos medicos
- tabela de eventos de timeline
- persistencia legado/compatibilidade do fluxo clinico-operacional

`medical-record-service`:

- colecao MongoDB `medical_records`
- um documento por paciente
- arrays de `triages`, `medicalAttendances` e `timelineEvents`
- snapshots agregados para alergias e vacinas

`notifications-service`:

- tabela de notificacoes com deduplicacao por `sourceEventId`

## 7. Frontend: API mode e demo mode

O fallback demo foi preservado para manter apresentacao e navegacao mesmo sem backend:

- `NEXT_PUBLIC_DEMO_MODE=true`: usa demo/localStorage
- `NEXT_PUBLIC_DEMO_MODE=false`: usa backend real
- se o token estiver invalido, o layout protegido limpa a sessao e redireciona para `/login`
- se uma tela analitica falhar com demo desligado, a UI agora mostra um banner explicito de erro em vez de mascarar a falha como zero silencioso

## 8. Observabilidade, build e deploy

Infraestrutura atualizada:

- Docker Compose local com `mongodb` e `medical-record-service`
- `k8s/base` e overlays `staging`, `production` e `vps-production` incluem MongoDB e o novo servico
- Prometheus raspa `medical-record-service:8086`
- CI/CD builda e publica a nova imagem `medsync-medical-record-service`

Hardenings de build:

- Dockerfiles Java agora usam cache de Maven com `dependency:go-offline`
- isso reduz fragilidade de `docker compose up --build` e do pipeline ao baixar dependencias repetidas

## 9. Limitacoes restantes

- o prontuario agora e separado e longitudinal para o fluxo ambulatorial, mas ainda nao cobre prontuario hospitalar completo
- relatorios continuam no nivel de resumo operacional; os botoes de `Gerar` ainda nao executam exportacoes reais
- a consistencia entre servicos e eventual, baseada em sync REST interno e eventos Kafka
- o fluxo legado `/api/triage` continua vivo por compatibilidade com entregas anteriores
