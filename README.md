# MedSync / HealthSys Distribuido

Plataforma distribuida de gestao hospitalar desenvolvida para a disciplina de Computacao Distribuida. O projeto combina frontend Next.js, API Gateway, microservices Spring Boot, Kafka, Redis, MongoDB, observabilidade, Docker Compose, Kubernetes, CI/CD e testes de carga.

- Projeto: MedSync
- Aluno: Mateus Levi Alencar
- Matricula: 2310315
- Disciplina: Computacao Distribuida

## Arquitetura resumida

```text
Frontend Next.js
  -> API Gateway
    -> auth-service
    -> users-service
    -> patients-service
    -> triage-service
    -> medical-record-service
    -> notifications-service

patients-service -> PostgreSQL + Redis
triage-service -> PostgreSQL + Kafka producer
medical-record-service -> MongoDB + Kafka consumer
notifications-service -> PostgreSQL + Kafka consumer

Prometheus -> Actuator dos servicos
Grafana -> Prometheus
```

## Servicos

- `frontend/medsync-web`: interface web e fallback demo
- `backend/api-gateway`: roteamento HTTP externo
- `backend/auth-service`: autenticacao JWT
- `backend/users-service`: usuarios e perfis
- `backend/patients-service`: pacientes, CNS, alergias, vacinas e cache Redis
- `backend/triage-service`: fila ambulatorial, acolhimento, atendimento medico, persistencia legado/compatibilidade e publicacao Kafka
- `backend/medical-record-service`: prontuario longitudinal em MongoDB, timeline clinica e resumo para dashboard
- `backend/notifications-service`: consumo Kafka e notificacoes persistidas

Infra:

- PostgreSQL por dominio
- Redis
- MongoDB
- Kafka + Zookeeper
- Prometheus
- Grafana

## Fluxo hospitalar real implementado

O frontend redesenhado agora opera com persistencia real no fluxo central:

`Paciente -> fila ambulatorial -> acolhimento -> atendimento medico -> prontuario/timeline -> notificacoes`

Principais endpoints publicos:

- `GET|POST /api/ambulatory/queue`
- `GET /api/ambulatory/queue/{id}`
- `PATCH /api/ambulatory/queue/{id}/call-triage`
- `PATCH /api/ambulatory/queue/{id}/complete-triage`
- `PATCH /api/ambulatory/queue/{id}/call-medical`
- `PATCH /api/ambulatory/queue/{id}/finish-medical`
- `GET /api/medical-records/patient/{patientId}`
- `GET /api/medical-records/patient/{patientId}/timeline`
- `POST /api/medical-records/patient/{patientId}/triage-records`
- `POST /api/medical-records/patient/{patientId}/medical-attendances`
- `POST /api/medical-records/patient/{patientId}/timeline-events`
- `GET /api/medical-records/summary`
- `GET|POST|DELETE /api/patients/{patientId}/allergies`
- `GET|POST|PUT /api/patients/{patientId}/vaccines`

## Frontend e modo demo

O frontend opera em dois modos:

- `NEXT_PUBLIC_DEMO_MODE=true`: usa dados demo/localStorage
- `NEXT_PUBLIC_DEMO_MODE=false`: usa API real via Gateway

Rotas que agora tentam carregar dados reais primeiro:

- `/dashboard`
- `/monitoramento`
- `/relatorios`
- `/fila-atendimento`
- `/acolhimento/[id]`
- `/atendimento-medico/[id]`
- `/patients`
- `/patients/[id]`
- `/patients/[id]/record`
- `/patients/[id]/timeline`
- `/notificacoes`

Se a API falhar e o demo estiver ativo, a UI cai para fallback demo. Se o token estiver invalido, o layout protegido redireciona para `/login` em vez de manter cards zerados com sessao quebrada.

## Como rodar localmente

Subir o ambiente completo:

```bash
docker compose up --build -d
```

Validar o frontend isoladamente:

```bash
cd frontend/medsync-web
npm ci
npm run build
```

Validar os servicos alterados via Maven em container:

```bash
docker run --rm -v "$PWD/backend/api-gateway:/app" -w /app maven:3.9.9-eclipse-temurin-17 mvn -B -DskipTests package
docker run --rm -v "$PWD/backend/triage-service:/app" -w /app maven:3.9.9-eclipse-temurin-17 mvn -B -DskipTests package
docker run --rm -v "$PWD/backend/medical-record-service:/app" -w /app maven:3.9.9-eclipse-temurin-17 mvn -B -DskipTests package
```

Executar o smoke de carga do fluxo completo:

```bash
docker run --rm -i \
  -v "$PWD/tests/load:/scripts" \
  grafana/k6 run \
  -e BASE_URL=http://host.docker.internal:8080 \
  -e MEDSYNC_EMAIL=admin@medsync.com \
  -e MEDSYNC_PASSWORD=admin123 \
  -e LOAD_PROFILE=smoke \
  /scripts/full-flow.js
```

## Acessos principais

- Frontend: [http://localhost:3000](http://localhost:3000)
- API Gateway: [http://localhost:8080](http://localhost:8080)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Grafana: [http://localhost:3001](http://localhost:3001)

## Kubernetes Dashboard

O projeto inclui artefatos opcionais para instalar o Kubernetes Dashboard como complemento operacional ao Prometheus/Grafana.

- acesso recomendado: `kubectl port-forward`
- não expor publicamente por Ingress ou LoadBalancer
- documentação: [docs/kubernetes-dashboard.md](docs/kubernetes-dashboard.md)

## Deploy real em VPS Hostinger com k3s

O projeto possui um overlay especifico para deploy real em VPS com k3s:

- overlay: `k8s/overlays/vps-production`
- namespace: `medsync-production`
- frontend: [http://187.127.12.230:3100](http://187.127.12.230:3100)
- API Gateway: [http://187.127.12.230:8180](http://187.127.12.230:8180)

## Usuario padrao

- e-mail: `admin@medsync.com`
- senha: `admin123`

## Limitacoes atuais

- o prontuario longitudinal entregue cobre o fluxo ambulatorial, mas ainda nao e um modulo clinico completo com exames estruturados, internacao, anexos e historico multiprofissional amplo
- o `triage-service` continua guardando snapshot relacional local por compatibilidade enquanto o `medical-record-service` e a fonte principal de `/api/medical-records/**`
- `dashboard`, `monitoramento` e `relatorios` agora usam dados reais, mas os botoes de exportacao ainda sao placeholders de UX
- a consistencia entre fila, notificacoes e prontuario e near-real-time via REST interno + Kafka, nao uma transacao distribuida unica
- o fluxo legado `/api/triage` continua ativo por compatibilidade

## Documentacao

Documentos principais:

- [docs/frontend.md](docs/frontend.md)
- [docs/fluxo-hospitalar.md](docs/fluxo-hospitalar.md)
- [docs/entrega-final.md](docs/entrega-final.md)
- [docs/validacao-final-fluxo-hospitalar.md](docs/validacao-final-fluxo-hospitalar.md)
- [docs/arquitetura-final.md](docs/arquitetura-final.md)
- [docs/monitoramento.md](docs/monitoramento.md)
- [docs/kubernetes-dashboard.md](docs/kubernetes-dashboard.md)
- [docs/deploy-kubernetes.md](docs/deploy-kubernetes.md)
- [docs/ci-cd.md](docs/ci-cd.md)
- [docs/testes-carga.md](docs/testes-carga.md)
- [docs/roteiro-demo.md](docs/roteiro-demo.md)
- [docs/roteiro-video.md](docs/roteiro-video.md)
- [docs/checklist-apresentacao.md](docs/checklist-apresentacao.md)
- [docs/auditoria-ficha-avaliacao.md](docs/auditoria-ficha-avaliacao.md)

Documentos complementares:

- [k8s/README.md](k8s/README.md)
- [docs/arquitetura/documento-arquitetura.md](docs/arquitetura/documento-arquitetura.md)
- [tests/load/README.md](tests/load/README.md)
