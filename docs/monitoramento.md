# Monitoramento do MedSync

## Objetivo

Adicionar observabilidade local para a entrega das Semanas 7-8 com:

- healthcheck padronizado dos microservices Spring Boot
- exposicao de metricas Prometheus via Actuator
- coleta centralizada com Prometheus
- visualizacao em dashboard com Grafana

## Arquitetura de observabilidade

```text
Spring Boot services
  |- api-gateway
  |- auth-service
  |- users-service
  |- patients-service
  |- triage-service
  |- notifications-service
          |
          v
 /actuator/health
 /actuator/info
 /actuator/prometheus
          |
          v
   Prometheus (:9090)
          |
          v
    Grafana (:3001)
```

## Servicos monitorados

- `api-gateway`
- `auth-service`
- `users-service`
- `patients-service`
- `triage-service`
- `notifications-service`

Cada servico expõe:

- `/actuator/health`
- `/actuator/info`
- `/actuator/metrics`
- `/actuator/prometheus`

## Coleta configurada

O Prometheus utiliza `infra/monitoring/prometheus/prometheus.yml` e coleta diretamente os containers:

- `api-gateway:8080`
- `auth-service:8081`
- `users-service:8082`
- `patients-service:8083`
- `triage-service:8084`
- `notifications-service:8085`

## Como acessar

Subida do ambiente:

```bash
docker compose up --build
```

URLs:

- Prometheus: [http://localhost:9090](http://localhost:9090)
- Grafana: [http://localhost:3001](http://localhost:3001)
- Usuario Grafana: `admin`
- Senha Grafana: `admin`

Actuator no host:

- Gateway: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- Auth: [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health)
- Users: [http://localhost:8082/actuator/health](http://localhost:8082/actuator/health)
- Patients: [http://localhost:8083/actuator/health](http://localhost:8083/actuator/health)
- Triage: [http://localhost:8084/actuator/health](http://localhost:8084/actuator/health)
- Notifications: [http://localhost:8085/actuator/health](http://localhost:8085/actuator/health)

Metricas Prometheus no host:

- Gateway: [http://localhost:8080/actuator/prometheus](http://localhost:8080/actuator/prometheus)
- Auth: [http://localhost:8081/actuator/prometheus](http://localhost:8081/actuator/prometheus)
- Users: [http://localhost:8082/actuator/prometheus](http://localhost:8082/actuator/prometheus)
- Patients: [http://localhost:8083/actuator/prometheus](http://localhost:8083/actuator/prometheus)
- Triage: [http://localhost:8084/actuator/prometheus](http://localhost:8084/actuator/prometheus)
- Notifications: [http://localhost:8085/actuator/prometheus](http://localhost:8085/actuator/prometheus)

## Dashboard provisionado

O Grafana sobe com:

- datasource Prometheus provisionado automaticamente
- dashboard `MedSync Overview` carregado automaticamente

Painéis iniciais:

- status geral dos servicos monitorados
- requisicoes HTTP por servico
- latencia HTTP p95
- erros HTTP 4xx e 5xx
- uso de memoria JVM
- uso de CPU do processo
- uptime dos servicos

## Observando testes de carga

Durante os testes com k6, o Grafana pode ser usado para acompanhar em tempo real:

- aumento de requisicoes HTTP por servico
- variacao da latencia e do p95
- crescimento do uso de memoria JVM
- uso de CPU do processo
- erros HTTP 4xx e 5xx

Isso ajuda a correlacionar o comportamento observado pelo k6 com a telemetria exposta pelos Actuator endpoints.

## Evidencias para a entrega

Capturas recomendadas:

1. Tela de `Targets` do Prometheus com os seis servicos `UP`
2. Dashboard `MedSync Overview` no Grafana
3. Exemplo de `/actuator/health` retornando `UP`
4. Exemplo de `/actuator/prometheus` com metricas expostas

## Observacoes de ambiente

- A porta `5433` precisa estar livre para o `postgres-users`; se houver conflito com outro container local, pare o container conflitante antes de subir o stack
- O broker Kafka pode precisar de restart se houver sessao residual no Zookeeper; isso nao exige refatoracao do projeto

## Relacao com a entrega das Semanas 7-8

Esta etapa atende a parte de monitoramento local da entrega ao disponibilizar:

- telemetria padronizada nos microservices Spring Boot
- coleta centralizada via Prometheus
- visualizacao consolidada via Grafana
- artefatos versionados que podem ser reaproveitados em uma futura migracao para Kubernetes
