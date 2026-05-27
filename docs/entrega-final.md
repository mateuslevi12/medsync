# Entrega Final - Semanas 7-8

## Resumo executivo

O MedSync foi concluido como uma plataforma distribuida de gestao hospitalar preparada para demonstracao academica. O sistema integra frontend, API Gateway, microservices Spring Boot, mensageria Kafka, cache Redis, monitoramento com Prometheus e Grafana, deploy local com Docker Compose, deploy preparavel em Kubernetes, pipelines de CI/CD e testes de carga com k6.

## 1. Objetivo da etapa

A etapa final das Semanas 7-8 foi focada em:

- deploy
- monitoramento
- CI/CD
- Kubernetes
- testes de carga
- documentacao
- apresentacao

## 2. Estado final do sistema

O estado final do MedSync inclui:

- autenticacao JWT
- arquitetura distribuida baseada em microservices
- API Gateway como ponto unico de entrada
- Kafka para comunicacao assincrona
- Redis para cache distribuido
- Prometheus e Grafana para observabilidade
- manifests Kubernetes com staging e production
- CI/CD com GitHub Actions
- testes de carga com k6

## 3. Entregaveis concluidos

- Sistema preparado para implantacao em Kubernetes
- Dois ambientes previstos:
  - `medsync-staging`
  - `medsync-production`
- Monitoramento com Prometheus e Grafana
- CI/CD com GitHub Actions
- Testes de carga com k6
- Documentacao final
- Roteiro de demonstracao e video

## 4. Relacao com o cronograma do projeto

Atividades da Semana 7-8:

- Configuracao de CI/CD: concluida
- Deploy em Kubernetes: manifests e overlays criados para dois ambientes
- Monitoramento com Prometheus e Grafana: concluido
- Testes de carga: concluido
- Ajustes finais: concluido
- Producao de documentacao e video: documentacao e roteiros criados

Entregaveis mapeados:

- Sistema implantavel na nuvem com dois clusters: preparado com `staging` e `production`
- Dashboard de monitoramento: `MedSync Overview`
- Documentacao final: `docs/*`
- Apresentacao do projeto: roteiro de demo e roteiro de video criados

## 5. Validacoes realizadas

Validacoes tecnicas executadas ao longo da etapa:

- `npm run build` em `frontend/medsync-web`
- `docker compose config`
- `kubectl kustomize k8s/base`
- `kubectl kustomize k8s/overlays/staging`
- `kubectl kustomize k8s/overlays/production`
- `actionlint`
- smoke tests com k6
- Prometheus com `6/6` targets `UP`
- Grafana com datasource e dashboard provisionados

## 6. Resultados dos testes de carga

`login.js` em smoke:

- 422 requisicoes
- 0 falhas
- `p95 = 73.35ms`
- `checks = 100%`

`full-flow.js` em smoke:

- 98 requisicoes
- 14 iteracoes completas
- 0 falhas
- `p95 = 75.01ms`
- `checks = 100%`
- media por iteracao de aproximadamente `2.15s`

O `full-flow` valida o fluxo distribuido:

`login -> paciente -> triagem -> Kafka/notificacoes`

## 7. Problema real encontrado nos testes

Os testes de carga encontraram uma falha real no `patients-service`.

Sintoma:

- `GET /api/patients/{id}` retornava `500 Internal Server Error`

Causa:

- serializacao de `LocalDate` no cache Redis do `patients-service`

Correcao aplicada:

- ajuste em `CacheConfig.java`
- reutilizacao da mesma estrategia de serializacao com `JavaTimeModule` ja empregada no `triage-service`

Esse ponto serve como evidencia de maturidade da etapa de avaliacao, porque os testes nao apenas executaram o sistema, mas revelaram e ajudaram a corrigir um problema real de runtime.

## 8. Limitacoes conhecidas

- o deploy real em cluster depende de credenciais e kubeconfigs
- os manifests usam placeholders de registry, dominios e secrets
- o failover entre `staging` e `production` e manual, nao automatico
- os componentes stateful foram simplificados com `Deployment + PVC`
- o teste de carga completo com stages maiores foi implementado, mas apenas smoke foi executado localmente
- Kafka e validado indiretamente no k6 pelo encadeamento `triagem -> notificacao`

## 9. Proximos passos possiveis

- aplicar em cloud real
- configurar DNS e TLS
- usar banco gerenciado
- configurar HPA
- usar `StatefulSet` ou operadores para stateful
- centralizar logs
- configurar failover automatico
- rodar o teste de carga completo em cluster
