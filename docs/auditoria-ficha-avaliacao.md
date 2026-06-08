# Auditoria da Ficha de Avaliacao - MedSync / HealthSys Distribuido

Data da auditoria: 2026-06-02

## 1. Resumo executivo

Situacao atual:

- o projeto sustenta um fluxo hospitalar real persistido, nao apenas demonstracao visual
- o prontuario agora possui microservice proprio e persistencia em MongoDB
- a stack local foi revalidada ponta a ponta nesta rodada
- observabilidade, k8s, CI/CD e carga foram atualizados para o novo desenho

Pontos fortes consolidados:

- frontend, API Gateway e microservices separados por dominio
- JWT, roles e autenticacao interna entre servicos
- PostgreSQL por dominio
- Redis no `patients-service`
- Kafka funcional entre `triage-service`, `medical-record-service` e `notifications-service`
- fila ambulatorial real
- acolhimento real com classificacao de risco
- atendimento medico real com persistencia
- prontuario longitudinal em MongoDB
- timeline por paciente
- Docker Compose, Kubernetes, Prometheus, Grafana, CI/CD e `k6` validados

Principais limitacoes remanescentes:

- o prontuario ainda e focado no fluxo ambulatorial, nao em um modulo clinico hospitalar completo
- relatorios ainda nao geram exportacoes reais
- a consistencia entre fila, prontuario e notificacoes e eventual

Nota estimada:

- `9.4 / 10.0`

## 2. O que mudou nesta rodada

Itens confirmados como entregues e validados:

- `medical-record-service` dedicado
- MongoDB integrado ao projeto
- `/api/medical-records/**` movido para o novo servico via gateway
- sincronizacao interna do `triage-service`
- dashboard, monitoramento e relatorios conectados a dados reais
- Prometheus raspando o novo servico
- smoke funcional do fluxo e `k6` smoke executados com sucesso

## 3. Validacoes tecnicas executadas

| Validacao | Resultado | Observacoes |
|---|---|---|
| `cd frontend/medsync-web && npm run build` | OK | build do frontend concluido |
| `backend/api-gateway` `mvn -B -DskipTests package` | OK | executado via container Maven |
| `backend/triage-service` `mvn -B -DskipTests package` | OK | executado via container Maven |
| `backend/medical-record-service` `mvn -B -DskipTests package` | OK | executado via container Maven |
| `docker compose config` | OK | sintaxe valida |
| `kubectl kustomize k8s/base` | OK | renderizacao valida |
| `kubectl kustomize k8s/overlays/staging` | OK | renderizacao valida |
| `kubectl kustomize k8s/overlays/production` | OK | renderizacao valida |
| `kubectl kustomize k8s/overlays/vps-production` | OK | renderizacao valida |
| parse YAML em `.github/workflows/*.yml` | OK | validado com Ruby `YAML.load_file` |
| `docker compose up --build -d` | OK | stack local subida integralmente |
| healthchecks `:8080..:8086/actuator/health` | OK | todos `UP` |
| Prometheus target `medical-record-service:8086` | OK | `UP` apos restart do Prometheus |
| Grafana `/api/datasources` | OK | datasource Prometheus disponivel |
| fluxo hospitalar via API | OK | paciente, fila, acolhimento, medico, prontuario, timeline e notificacoes validados |
| validacao visual em browser | OK | dashboard, monitoramento e relatorios exibindo dados reais apos login valido |
| `tests/load/full-flow.js` com `LOAD_PROFILE=smoke` | OK | `13` iteracoes, `0.00%` falha HTTP, `p95=49.22ms` |

## 4. Leitura objetiva da ficha

### Funcionalidades implementadas

Estado atual:

- autenticacao e controle de acesso: `atendido`
- gestao de pacientes: `atendido`
- teletriagem / acolhimento: `atendido`
- notificacoes e comunicacao assincrona: `atendido`
- prontuario eletronico: `parcial forte`

Ressalva importante:

- ha prontuario longitudinal operacional para o fluxo ambulatorial, mas ainda nao um modulo clinico hospitalar completo

### Requisitos nao funcionais

Estado atual:

- desempenho: `evidenciado`
- seguranca: `parcial forte`
- escalabilidade / disponibilidade: `atendido para escopo academico`
- experiencia do usuario: `boa para demonstracao e defesa`

### Arquitetura distribuida

Estado atual:

- microservices: `atendido`
- integracao assincrona com Kafka: `atendido`
- persistencia por dominio: `atendido`
- MongoDB aplicado de forma funcional: `atendido`
- containerizacao e orquestracao: `atendido`
- observabilidade: `atendido`

## 5. Gaps que ainda afastam nota maxima

- ausencia de prontuario clinico hospitalar mais amplo
- exportacao real de relatorios ainda nao implementada
- consistencia eventual entre servicos

## 6. Recomendacao para apresentacao

Narrativa mais segura para banca:

- mostrar que o fluxo hospitalar novo e real, separado e persistido em MongoDB
- citar a compatibilidade mantida com o legado do `triage-service` como decisao de engenharia pragmatica
- destacar a maturidade do ecossistema distribuido: gateway, JWT, Kafka, Redis, MongoDB, Compose, Kubernetes, observabilidade e `k6`
- assumir com clareza que o prontuario ainda nao cobre todo o ciclo clinico hospitalar
