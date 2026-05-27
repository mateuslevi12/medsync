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

## Deploy real em VPS Hostinger com k3s

O projeto tambem possui um overlay especifico para deploy real em VPS com k3s:

- overlay: `k8s/overlays/vps-production`
- namespace: `medsync-production`
- frontend: [http://187.127.12.230:3100](http://187.127.12.230:3100)
- API Gateway: [http://187.127.12.230:8180](http://187.127.12.230:8180)

Ajustes aplicados para a VPS:

- 1 replica por servico
- resources reduzidos para VPS de `2 vCPU / 8 GB RAM`
- frontend buildado com `NEXT_PUBLIC_API_GATEWAY_URL=http://187.127.12.230:8180`
- `HOSTNAME=0.0.0.0` e `PORT=3000` no container do frontend
- Kafka single-broker com configuracoes de replicacao reduzidas
- Postgres com `pg_hba.conf` provisionado pelo Kubernetes para aceitar conexoes da rede interna do k3s (`10.42.0.0/16`)

Comandos principais:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_GATEWAY_URL=http://187.127.12.230:8180 \
  -t ghcr.io/SEU_USUARIO/medsync-frontend:vps-production \
  frontend/medsync-web

kubectl apply -k k8s/overlays/vps-production
```

Build manual pelo GitHub Actions:

- workflow: `Docker Build and Push`
- `release_channel`: `vps-production`
- `frontend_gateway_url`: `http://187.127.12.230:8180`
- alternativa: configurar a variable `VPS_PRODUCTION_API_GATEWAY_URL`

Limitacao conhecida:

- este ambiente de demo usa `1 replica` por servico para caber na VPS

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
