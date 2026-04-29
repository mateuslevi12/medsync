# MedSync - Entrega Semanas 5-6 (Computacao Distribuida)

Plataforma distribuida de gestao hospitalar com API Gateway, triagem, notificacoes assincronas, Kafka e cache distribuido com Redis.

- Projeto: MedSync
- Aluno: Mateus Levi Alencar
- Matricula: 2310315
- Disciplina: Computacao Distribuida

## Visao Geral
Esta entrega implementa a integracao distribuida entre frontend e microservices com:

- API Gateway como ponto unico de entrada
- Comunicacao assincrona via Kafka
- Servico de triagem
- Servico de notificacoes assincronas
- Cache distribuido com Redis

## Arquitetura

```text
frontend (Next.js :3000)
        |
        v
api-gateway (:8080)
  |-- auth-service (:8081)
  |-- users-service (:8082)
  |-- patients-service (:8083)
  |-- triage-service (:8084)
  |-- notifications-service (:8085)

Infra:
- PostgreSQL users_db (:5433)
- PostgreSQL patients_db (:5434)
- PostgreSQL triage_db (:5435)
- PostgreSQL notifications_db (:5436)
- Redis (:6379)
- Kafka (:9092) + Zookeeper (:2181)
```

## Servicos

### API Gateway (`backend/api-gateway`)
Roteia:
- `/api/auth/**` -> `auth-service`
- `/api/users/**` -> `users-service`
- `/api/patients/**` -> `patients-service`
- `/api/triage/**` -> `triage-service`
- `/api/notifications/**` -> `notifications-service`

### Auth Service (`backend/auth-service`)
- Login JWT
- Endpoint `/api/auth/me`

### Users Service (`backend/users-service`)
- CRUD de usuarios
- Endpoint interno para autenticacao

### Patients Service (`backend/patients-service`)
- CRUD de pacientes
- Busca por `id` e `cpf`
- Cache distribuido Redis em:
  - `GET /api/patients/{id}`
  - `GET /api/patients/cpf/{cpf}`
- Invalida cache em update/delete

### Triage Service (`backend/triage-service`)
- Registro e gestao de triagem
- Priorizacao de risco (RED/ORANGE/YELLOW/GREEN/BLUE)
- Cache Redis para fila de espera (`GET /api/triage/waiting`)
- Publicacao de eventos Kafka:
  - `triage.created`
  - `triage.updated`
  - `triage.priority.changed`

Endpoints:
- `POST /api/triage`
- `GET /api/triage`
- `GET /api/triage/waiting`
- `GET /api/triage/{id}`
- `PUT /api/triage/{id}`
- `PATCH /api/triage/{id}/status`
- `DELETE /api/triage/{id}`

### Notifications Service (`backend/notifications-service`)
- Consome eventos de triagem via Kafka
- Persiste notificacoes assincronas
- Exposicao para frontend

Endpoints:
- `GET /api/notifications`
- `GET /api/notifications/unread`
- `PATCH /api/notifications/{id}/read`
- `PATCH /api/notifications/read-all`

## Frontend (`frontend/medsync-web`)
Telas protegidas:
- `fila-espera`
- `usuarios`
- `triagem`
- `triagem/[id]`
- `notificacoes`

Funcionalidades desta entrega:
- Criacao e listagem de triagens
- Atualizacao de sinais vitais/sintomas/prioridade/status
- Listagem de notificacoes assincronas
- Marcacao de notificacoes como lidas
- Polling simples de notificacoes

## Cache Distribuido (Redis)

- `patients-service`: cache por paciente (`id` e `cpf`), invalida em update/delete
- `triage-service`: cache da fila de espera (`waiting`), invalida em create/update/status/delete

## Mensageria (Kafka)

Fluxo:
1. Triagem e alterada/criada no `triage-service`
2. Evento e publicado em topicos Kafka
3. `notifications-service` consome evento
4. Notificacao e persistida e exibida no frontend

## Como Rodar

### 1. Subir ambiente completo
```bash
docker-compose up -d --build
```

### 2. Verificar containers
```bash
docker-compose ps
```

### 3. Acessar frontend
- [http://localhost:3000](http://localhost:3000)

### 4. Credenciais iniciais
- Email: `admin@medsync.com`
- Senha: `admin123`

## Fluxo de Demo (Semanas 5-6)

1. Login no frontend
2. Cadastrar/consultar paciente
3. Abrir tela de triagem e criar nova triagem
4. Alterar prioridade/status da triagem
5. Confirmar notificacoes geradas na tela de notificacoes
6. Repetir consultas para validar cache distribuido

## Comandos Uteis

Parar ambiente:
```bash
docker-compose down
```

Parar e remover volumes:
```bash
docker-compose down -v
```

Executar testes backend por servico:
```bash
cd backend/<service> && mvn test
```

Build frontend:
```bash
cd frontend/medsync-web && npm run build
```

## Entregaveis Atendidos

- Sistema distribuido funcional integrado com frontend
- Comunicacao entre microservices via API Gateway + Kafka
- Sistema de triagem funcionando
- Notificacoes assincronas funcionando
- Cache distribuido com Redis
