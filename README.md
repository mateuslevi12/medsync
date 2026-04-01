# MedSync – Plataforma Distribuída de Gestão Hospitalar

## Visão Geral
O MedSync é um sistema de gestão hospitalar distribuída para hospitais e unidades de saúde. A plataforma é focada em cadastro de pacientes, prontuário eletrônico, teletriagem e envio de notificações operacionais e clínicas.

## Arquitetura
A solução é baseada em arquitetura de microserviços com os seguintes componentes principais:

- Frontend em Next.js.
- Backend em Spring Boot (Java 17+).
- API Gateway com Spring Cloud Gateway.
- Autenticação e autorização com JWT.
- Comunicação síncrona via REST/gRPC.
- Comunicação assíncrona via Apache Kafka.
- Persistência com PostgreSQL e MongoDB.
- Cache e sessões com Redis.

## Microserviços
- `users-service`: gerenciamento de usuários, autenticação e controle de acesso.
- `patients-service`: cadastro, consulta e atualização de dados demográficos dos pacientes.
- `medical-record-service`: gestão do prontuário eletrônico e histórico clínico.
- `triage-service`: teletriagem com classificação baseada no Protocolo de Manchester.
- `notification-service`: envio de notificações para eventos clínicos e operacionais.

## Tecnologias
| Categoria | Tecnologia |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| Backend | Java 17+, Spring Boot, Spring Cloud |
| API Gateway | Spring Cloud Gateway |
| Segurança | JWT, Spring Security |
| Comunicação síncrona | REST, gRPC |
| Mensageria | Apache Kafka |
| Banco relacional | PostgreSQL |
| Banco NoSQL | MongoDB |
| Cache | Redis |
| Observabilidade | Prometheus, Grafana, ELK |
| Infraestrutura | Docker, Kubernetes |

## Como Executar
1. Clone o repositório:

```bash
git clone https://github.com/mateuslevi12/medsync.git
cd medsync
```

2. Suba os serviços de infraestrutura:

```bash
docker-compose up -d
```

3. Backend (Spring Boot):

```bash
cd backend/<nome-do-servico>
mvn spring-boot:run
```

4. Frontend (Next.js):

```bash
cd frontend/medsync-web
npm install
npm run dev
```

## Pré-requisitos
- Docker
- Java 17+
- Node.js 18+
- Maven

## Autor
Mateus Levi Alencar – Matrícula 2310315 – Computação Distribuída – UNIFOR
