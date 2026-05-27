# MedSync / HealthSys Distribuido

Plataforma distribuida de gestao hospitalar desenvolvida para a disciplina de Computacao Distribuida, com frontend web, API Gateway, microservices Spring Boot, Kafka, Redis, monitoramento, Kubernetes, CI/CD e testes de carga.

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
    -> notifications-service

patients-service -> PostgreSQL + Redis
triage-service -> PostgreSQL + Redis + Kafka
notifications-service -> PostgreSQL + Kafka Consumer

Prometheus -> Actuator dos servicos
Grafana -> Prometheus
```

## Servicos

- `frontend/medsync-web`: interface web em Next.js
- `backend/api-gateway`: roteamento HTTP externo
- `backend/auth-service`: autenticacao JWT
- `backend/users-service`: usuarios, BCrypt, seed admin
- `backend/patients-service`: pacientes, busca por nome/CPF, cache Redis
- `backend/triage-service`: triagem, fila de espera, publicacao Kafka
- `backend/notifications-service`: consumo Kafka e notificacoes

Infra:

- PostgreSQL por dominio
- Redis
- Kafka
- Zookeeper
- Prometheus
- Grafana

## Tecnologias

- Next.js
- Spring Boot
- Spring Cloud Gateway
- PostgreSQL
- Redis
- Kafka
- Prometheus
- Grafana
- Docker Compose
- Kubernetes
- GitHub Actions
- k6

## Como rodar localmente

Subir o ambiente completo:

```bash
docker compose up --build
```

Validar o frontend isoladamente:

```bash
cd frontend/medsync-web
npm ci
npm run build
```

Observacao de ambiente:

- a porta `5433` precisa estar livre para o `postgres-users`
- se `3000` estiver ocupada, libere o processo antes de subir o frontend

## Acessos principais

- Frontend: [http://localhost:3000](http://localhost:3000)
- API Gateway: [http://localhost:8080](http://localhost:8080)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Grafana: [http://localhost:3001](http://localhost:3001)

## Usuario padrao

- e-mail: `admin@medsync.com`
- senha: `admin123`

## Entrega Semanas 7-8

Estado final da entrega:

- base estabilizada e frontend buildando
- monitoramento com Prometheus e Grafana
- Kubernetes com `staging` e `production`
- CI/CD com GitHub Actions
- testes de carga com k6
- documentacao final e roteiros de demonstracao

Resultados de carga validados:

- `login.js` smoke: 422 requisicoes, 0 falhas, `p95 73.35ms`, `checks 100%`
- `full-flow.js` smoke: 98 requisicoes, 14 iteracoes, 0 falhas, `p95 75.01ms`, `checks 100%`

## Documentacao

Documentos principais:

- [docs/monitoramento.md](docs/monitoramento.md)
- [docs/deploy-kubernetes.md](docs/deploy-kubernetes.md)
- [docs/ci-cd.md](docs/ci-cd.md)
- [docs/testes-carga.md](docs/testes-carga.md)
- [docs/entrega-final.md](docs/entrega-final.md)
- [docs/arquitetura-final.md](docs/arquitetura-final.md)
- [docs/roteiro-demo.md](docs/roteiro-demo.md)
- [docs/roteiro-video.md](docs/roteiro-video.md)
- [docs/checklist-apresentacao.md](docs/checklist-apresentacao.md)

Documentos complementares:

- [k8s/README.md](k8s/README.md)
- [docs/arquitetura/documento-arquitetura.md](docs/arquitetura/documento-arquitetura.md)
- [tests/load/README.md](tests/load/README.md)
