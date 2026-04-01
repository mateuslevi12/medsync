# Documento de Arquitetura - MedSync

## 1. Introdução
Este documento descreve a arquitetura inicial do MedSync, uma plataforma distribuída de gestão hospitalar orientada a microserviços.

## 2. Objetivo
Definir uma base arquitetural para suportar operações clínicas e administrativas em hospitais e unidades de saúde, com foco em escalabilidade, integração e observabilidade.

## 3. Visão Geral da Solução
O MedSync será composto por frontend web, API Gateway e microserviços independentes. A solução combina comunicação síncrona (REST/gRPC) para operações transacionais e comunicação assíncrona (Kafka) para eventos e integração entre domínios.

## 4. Componentes
- Frontend Web (`Next.js`) para interfaces administrativas e operacionais.
- API Gateway (`Spring Cloud Gateway`) para roteamento, segurança e políticas transversais.
- Serviços de domínio (Spring Boot / Java 17+).
- Camada de dados com PostgreSQL, MongoDB e Redis.
- Plataforma de mensageria com Apache Kafka.

## 5. Descrição dos Microserviços
### 5.1 users-service
Responsável por cadastro e autenticação de usuários, perfis e permissões. Utiliza PostgreSQL para dados de usuários e JWT para autenticação segura.

### 5.2 patients-service
Responsável pelo cadastro, consulta e atualização de pacientes. Utiliza PostgreSQL para persistência relacional dos dados cadastrais.

### 5.3 medical-record-service
Responsável pelo armazenamento e consulta de prontuários eletrônicos, histórico clínico e evoluções médicas. Utiliza MongoDB para maior flexibilidade documental.

### 5.4 triage-service
Responsável por teletriagem e classificação de risco com base no Protocolo de Manchester:
- Vermelho
- Laranja
- Amarelo
- Verde
- Azul

O serviço publica e consome eventos via Kafka para integrar o fluxo de atendimento.

### 5.5 notification-service
Responsável por envio de notificações (internas e externas) relacionadas a eventos clínicos e operacionais. Consome eventos do Kafka e distribui mensagens para os canais configurados.

## 6. Comunicação
- **Síncrona:** REST e gRPC para chamadas entre frontend, gateway e microserviços.
- **Assíncrona:** Apache Kafka para integração orientada a eventos, desacoplamento e resiliência.

## 7. Infraestrutura
A infraestrutura base é provisionada em containers com Docker e preparada para evolução em Kubernetes. A observabilidade será suportada por:
- Prometheus (métricas)
- Grafana (dashboards)
- ELK (logs e análise)

## 8. Considerações Finais
Como extensões futuras, o MedSync poderá incluir:
- Módulos avançados de análise de dados clínicos e operacionais.
- Provisionamento com Terraform.
- Estratégias de computação em borda para unidades remotas.
