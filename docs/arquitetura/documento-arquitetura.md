# Documento de Arquitetura - MedSync (2a Entrega)

## 1. Introducao
Este documento descreve a arquitetura implementada na segunda entrega do MedSync, priorizando autenticacao, usuarios, pacientes, gateway e frontend inicial.

## 2. Objetivo
Disponibilizar um fluxo funcional ponta-a-ponta para demonstracao academica:
- login com JWT
- cadastro/listagem de pacientes
- roteamento centralizado via API Gateway

## 3. Visao Geral da Solucao
Arquitetura em microservicos com API Gateway como ponto unico de entrada do frontend.

Componentes:
- **frontend (Next.js)**
- **api-gateway (Spring Cloud Gateway)**
- **auth-service (Spring Boot + JWT)**
- **users-service (Spring Boot + PostgreSQL users_db)**
- **patients-service (Spring Boot + PostgreSQL patients_db)**

## 4. Componentes
### 4.1 API Gateway
- Roteia chamadas para os servicos de dominio.
- Configura CORS para frontend.
- Rotas:
  - `/api/auth/**`
  - `/api/users/**`
  - `/api/patients/**`

### 4.2 users-service
- Responsavel por cadastro e consulta de usuarios.
- Regras principais:
  - email unico
  - senha com hash BCrypt
  - role obrigatoria (`ADMIN`, `HEALTH_PROFESSIONAL`, `RECEPTIONIST`)
- Seed inicial de usuario ADMIN.

### 4.3 auth-service
- Responsavel por login e emissao de JWT.
- Consulta dados do usuario no users-service (endpoint interno protegido por token de servico).
- Endpoints:
  - `POST /api/auth/login`
  - `GET /api/auth/me`

### 4.4 patients-service
- Responsavel pelo CRUD completo de pacientes.
- Endpoints:
  - `POST /api/patients`
  - `GET /api/patients` (filtros opcionais `name` e `cpf`)
  - `GET /api/patients/{id}`
  - `GET /api/patients/cpf/{cpf}`
  - `PUT /api/patients/{id}`
  - `DELETE /api/patients/{id}`
- Validacoes de campos obrigatorios e `documentNumber` unico.
- Seed inicial de pacientes para demo.

## 5. Seguranca
- JWT usado para proteger rotas de usuarios e pacientes.
- Validacao do token feita em `users-service` e `patients-service`.
- `POST/GET` de usuarios restritos a `ADMIN`.
- Rotas de pacientes liberadas para perfis autenticados apropriados.

## 6. Dados e Persistencia
- `users_db` (PostgreSQL): usuarios
- `patients_db` (PostgreSQL): pacientes
- MongoDB/Redis/Kafka preparados para evolucao futura, sem uso funcional obrigatorio nesta entrega.

## 7. Comunicacao
- **Sincrona:** REST via API Gateway.
- **Assincrona:** Kafka apenas preparado (opcional no compose via profile `kafka`).

## 8. Infraestrutura
- Ambiente local com Docker e docker-compose.
- Servicos containerizados para demonstracao.
- Estrutura de projeto preparada para evolucao posterior para Kubernetes/observabilidade.

## 9. Evolucao Futura
- prontuario eletronico
- triagem
- notificacoes
- cache com Redis
- telemetria com Prometheus/Grafana/ELK
