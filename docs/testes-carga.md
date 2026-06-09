# Testes de carga com k6 - MedSync

## Objetivo dos testes de carga

Esta suite cobre os fluxos distribuidos mais relevantes do sistema atual:

- autenticacao por CPF ou e-mail
- consultas de sessao autenticada
- administracao de usuarios
- pacientes e busca por CPF
- triagem e fila ambulatorial
- notificacoes
- prontuario, timeline e summary
- fluxo completo com reflexo em Kafka

O foco continua academico: demonstrar comportamento, latencia, falhas e integracao entre servicos.

## Estrutura atual

```text
tests/
  load/
    README.md
    config.js
    login.js
    patients.js
    triage.js
    notifications.js
    users.js
    dashboard.js
    full-flow.js
    results/
      full-flow-summary.json
```

## Fluxos cobertos

`login.js`:

- `POST /api/auth/login`
- `GET /api/auth/me`

`patients.js`:

- login
- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/{id}`
- `GET /api/patients/cpf/{cpf}`
- `GET /api/patients?cpf=...`
- `PUT /api/patients/{id}`

`triage.js`:

- login
- garante um paciente
- `POST /api/triage`
- `GET /api/triage`
- `GET /api/triage/waiting`

`notifications.js`:

- login
- `GET /api/notifications`
- `GET /api/notifications/unread`
- cria evento se necessario
- marca notificacao como lida

`users.js`:

- login administrativo
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/{id}`
- login do usuario criado via CPF
- `GET /api/auth/me`
- `PUT /api/users/{id}`
- novo login com CPF atualizado
- `PATCH /api/users/{id}/status`
- `DELETE /api/users/{id}`

`dashboard.js`:

- login
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/patients`
- `GET /api/patients?cpf=...`
- `GET /api/patients/cpf/{cpf}`
- `GET /api/ambulatory/queue`
- `GET /api/medical-records/summary`
- `GET /api/notifications`
- `GET /api/notifications/unread`

`full-flow.js`:

- login
- `GET /api/auth/me`
- cria paciente
- busca paciente por id e CPF
- cria alergias e vacinas
- executa fila ambulatorial completa
- consulta prontuario, timeline e summary
- valida notificacao final do fluxo

## Credenciais e parametrizacao

Variaveis:

- `BASE_URL`
- `MEDSYNC_LOGIN`
- `MEDSYNC_CPF`
- `MEDSYNC_EMAIL`
- `MEDSYNC_PASSWORD`
- `LOAD_PROFILE`

Fallbacks academicos:

- `MEDSYNC_LOGIN=00000000000`
- `MEDSYNC_CPF=00000000000`
- `MEDSYNC_EMAIL=admin@medsync.com`
- `MEDSYNC_PASSWORD=admin123`

`MEDSYNC_LOGIN` e a opcao recomendada porque cobre o contrato novo do `auth-service`.

## Como rodar localmente

Quando o `k6` roda em Docker e a API esta no host local, use `host.docker.internal`:

```bash
BASE_URL=http://host.docker.internal:8080
```

Login:

```bash
BASE_URL=http://host.docker.internal:8080 docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_LOGIN \
  -e MEDSYNC_PASSWORD \
  -e LOAD_PROFILE=smoke \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/login.js
```

Usuarios:

```bash
BASE_URL=http://host.docker.internal:8080 docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_LOGIN \
  -e MEDSYNC_PASSWORD \
  -e LOAD_PROFILE=smoke \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/users.js
```

Dashboard:

```bash
BASE_URL=http://host.docker.internal:8080 docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_LOGIN \
  -e MEDSYNC_PASSWORD \
  -e LOAD_PROFILE=smoke \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/dashboard.js
```

Fluxo completo:

```bash
BASE_URL=http://host.docker.internal:8080 docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_LOGIN \
  -e MEDSYNC_PASSWORD \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/full-flow.js
```

## Cenarios de carga

Scripts menores:

- `vus: 1`
- `duration: 30s`

`full-flow.js`:

- `30s` subindo para `5` usuarios
- `1m` mantendo `5` usuarios
- `30s` subindo para `10` usuarios
- `1m` mantendo `10` usuarios
- `30s` descendo para `0`

Thresholds configurados:

- `http_req_failed = 0`
- `http_req_duration p(95) < 2000ms`
- `checks = 100%`

`LOAD_PROFILE=smoke` força qualquer script a usar o perfil curto de `30s`.

## Resultado validado recente

`full-flow.js` em smoke, apos os ajustes de payload:

- `checks = 100%`
- `http_req_failed = 0%`
- `p95 = 20.74ms`
- `14 iteracoes completas`

## Monitoramento durante os testes

Durante a carga, observe no Prometheus e Grafana:

- latencia e `p95`
- erros `4xx` e `5xx`
- throughput HTTP
- uso de CPU e memoria JVM
- disponibilidade dos servicos

## Limitacoes

- os testes nao substituem observabilidade real
- Kafka continua validado indiretamente via efeitos observaveis no fluxo
- resultados dependem do estado do ambiente local ou do cluster
