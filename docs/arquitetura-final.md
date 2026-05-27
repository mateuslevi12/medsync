# Arquitetura Final - MedSync

## 1. Visao geral

O MedSync adota uma arquitetura distribuida baseada em microservices, com separacao de responsabilidades por dominio funcional, gateway unico de entrada, cache distribuido, mensageria assincrona e observabilidade integrada.

## 2. Diagrama textual da arquitetura

```text
Frontend Next.js
  -> API Gateway
    -> auth-service
    -> users-service
    -> patients-service
    -> triage-service
    -> notifications-service

patients-service -> PostgreSQL + Redis
triage-service -> PostgreSQL + Redis + Kafka Producer
notifications-service -> PostgreSQL + Kafka Consumer

Prometheus -> /actuator/prometheus dos servicos Spring Boot
Grafana -> Prometheus
```

## 3. Servicos

`frontend`:

- interface web em Next.js
- autentica no `auth-service` via API Gateway
- consome pacientes, triagem e notificacoes

`api-gateway`:

- ponto unico de entrada HTTP
- roteia `/api/auth`, `/api/users`, `/api/patients`, `/api/triage` e `/api/notifications`
- concentra CORS e metricas de borda

`auth-service`:

- autentica usuarios
- emite JWT
- expõe `/api/auth/login` e `/api/auth/me`

`users-service`:

- CRUD de usuarios
- seed de administrador
- endpoint interno para validacao de credenciais

`patients-service`:

- CRUD de pacientes
- busca por nome e CPF
- cache Redis por `id` e por `cpf`

`triage-service`:

- cria e atualiza triagens
- mantem fila de espera
- publica eventos Kafka

`notifications-service`:

- consome eventos Kafka
- persiste notificacoes
- expõe leitura e marcacao de notificacoes

`Kafka/Zookeeper`:

- backbone de eventos assincronos do dominio de triagem

`Redis`:

- cache distribuido usado por pacientes e triagem

`PostgreSQL`:

- banco por dominio:
  - users
  - patients
  - triage
  - notifications

`Prometheus/Grafana`:

- coleta e visualizacao de metricas operacionais

## 4. Comunicacao sincrona

O fluxo sincrono principal e:

`frontend -> api-gateway -> microservices REST`

Caracteristicas:

- o frontend nao acessa diretamente os microservices
- o gateway centraliza as rotas externas
- a autenticacao e propagada por JWT

## 5. Comunicacao assincrona

O `triage-service` publica eventos Kafka:

- `triage.created`
- `triage.updated`
- `triage.priority.changed`

O `notifications-service` consome esses eventos e gera notificacoes persistidas para consulta no frontend.

Fluxo resumido:

`triage-service -> Kafka -> notifications-service`

## 6. Cache distribuido

O Redis e usado em dois pontos:

`patients-service`:

- cache por `id`
- cache por `cpf`
- invalidacao em `update` e `delete`

`triage-service`:

- cache da fila de espera
- invalidacao em criacao, alteracao de status, update e delete

Os testes de carga validaram essa camada e revelaram um problema real de serializacao de `LocalDate` no cache Redis do `patients-service`, posteriormente corrigido no `CacheConfig`.

## 7. Seguranca

Camadas principais:

- JWT emitido pelo `auth-service`
- senhas com BCrypt no `users-service`
- token interno `X-Internal-Token` entre `auth-service` e `users-service`
- rotas protegidas por papel (`ADMIN`, `HEALTH_PROFESSIONAL`, `RECEPTIONIST`)

## 8. Observabilidade

Todos os servicos Spring Boot expõem:

- `/actuator/health`
- `/actuator/info`
- `/actuator/metrics`
- `/actuator/prometheus`

O Prometheus coleta essas metricas, e o Grafana expõe o dashboard `MedSync Overview`, incluindo:

- disponibilidade dos servicos
- requisicoes HTTP
- latencia `p95`
- erros `4xx/5xx`
- uso de memoria JVM
- uso de CPU do processo

## 9. Deploy

O projeto oferece duas camadas de deploy:

`Docker Compose`:

- ambiente local completo para desenvolvimento, validacao e demonstracao

`Kubernetes`:

- base reutilizavel em `k8s/base`
- overlays:
  - `k8s/overlays/staging`
  - `k8s/overlays/production`
- fallback documentado com `port-forward`

## 10. CI/CD

Os workflows principais em GitHub Actions sao:

- `ci.yml`
- `docker-build.yml`
- `deploy-staging.yml`
- `deploy-production.yml`
- `load-tests.yml`

Eles cobrem validacao, build/push de imagens, deploy manual em Kubernetes e smoke tests manuais com k6.

## 11. Justificativas academicas

O projeto cobre de forma integrada os topicos centrais esperados em Sistemas Distribuidos:

- cliente-servidor
- microservices
- mensageria assincrona
- cache distribuido
- autenticacao e autorizacao
- observabilidade
- containerizacao
- Kubernetes
- CI/CD
- testes de carga
