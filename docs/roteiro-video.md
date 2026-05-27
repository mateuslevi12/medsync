# Roteiro do Video de Demonstracao

## Duracao sugerida

- 5 a 8 minutos

## Cena 1 - Introducao

O que mostrar:

- tela inicial do projeto ou README

Fala sugerida:

"Este e o MedSync, uma plataforma distribuida de gestao hospitalar desenvolvida para a disciplina de Computacao Distribuida. O objetivo do projeto foi implementar uma solucao com microservices, API Gateway, cache distribuido, mensageria, observabilidade, Kubernetes, CI/CD e testes de carga."

## Cena 2 - Arquitetura

O que mostrar:

- [docs/arquitetura-final.md](/Users/mateuslevi/faculdade/medsync/docs/arquitetura-final.md)
- trecho com o diagrama textual

Fala sugerida:

"A arquitetura utiliza frontend em Next.js, API Gateway com Spring Cloud Gateway, autenticacao JWT, microservices de usuarios, pacientes, triagem e notificacoes, PostgreSQL por dominio, Redis para cache, Kafka para eventos assincronos, Prometheus, Grafana e manifests Kubernetes para staging e production."

## Cena 3 - Sistema funcionando

O que mostrar:

- login
- listagem de pacientes
- criacao de paciente
- tela de triagem

Fala sugerida:

"Aqui o sistema esta funcionando via API Gateway. Primeiro fazemos o login, depois navegamos pelos pacientes, criamos um novo cadastro e em seguida abrimos o fluxo de triagem."

## Cena 4 - Comunicacao distribuida

O que mostrar:

- criacao de triagem
- tela de notificacoes

Fala sugerida:

"Esse fluxo evidencia a comunicacao distribuida. O frontend chama o gateway, o gateway encaminha para o `triage-service`, o `triage-service` publica eventos no Kafka e o `notifications-service` consome esses eventos para gerar notificacoes visiveis no sistema."

## Cena 5 - Monitoramento

O que mostrar:

- Prometheus em `Targets`
- Grafana com `MedSync Overview`

Fala sugerida:

"Na parte de observabilidade, todos os servicos Spring Boot expõem Actuator, o Prometheus coleta essas metricas e o Grafana exibe o dashboard MedSync Overview com disponibilidade, latencia, erros HTTP, uso de memoria JVM, CPU e uptime."

## Cena 6 - Kubernetes

O que mostrar:

- `k8s/base`
- `k8s/overlays/staging`
- `k8s/overlays/production`

Fala sugerida:

"Para deploy em Kubernetes, o projeto foi estruturado com uma base reutilizavel e overlays separados para `medsync-staging` e `medsync-production`. Isso prepara o sistema para dois ambientes distintos, com escalonamento e configuracoes apropriadas."

## Cena 7 - CI/CD

O que mostrar:

- `.github/workflows`

Fala sugerida:

"A automacao foi implementada com GitHub Actions. O CI valida frontend, backend, Docker Compose e Kustomize. Ha tambem workflow de build e push de imagens, deploy manual em staging e production, e um workflow manual de smoke test com k6."

## Cena 8 - Testes de carga

O que mostrar:

- `tests/load/full-flow.js`
- [docs/testes-carga.md](/Users/mateuslevi/faculdade/medsync/docs/testes-carga.md)
- resultados ja validados

Fala sugerida:

"Os testes de carga foram feitos com k6. No smoke test de login foram executadas 422 requisicoes sem falhas, com p95 de 73.35 milissegundos. No smoke test do fluxo completo foram 98 requisicoes, 14 iteracoes completas, zero falhas e p95 de 75.01 milissegundos."

## Cena 9 - Evidencia de avaliacao real

O que mostrar:

- [docs/entrega-final.md](/Users/mateuslevi/faculdade/medsync/docs/entrega-final.md)
- arquivo de `CacheConfig` do `patients-service`

Fala sugerida:

"Os testes tambem encontraram um problema real no `patients-service`: um erro de serializacao de `LocalDate` no cache Redis ao consultar paciente por ID. Esse problema foi corrigido, o que mostra que a etapa de avaliacao teve efeito concreto sobre a qualidade do sistema."

## Cena 10 - Conclusao

O que mostrar:

- `README`
- lista dos documentos finais

Fala sugerida:

"Com isso, o MedSync atende aos objetivos da entrega final das Semanas 7-8, reunindo sistema distribuido funcional, observabilidade, Kubernetes, CI/CD, testes de carga e documentacao completa para demonstracao e avaliacao academica."
