# Roteiro de Demonstracao

## Objetivo

Demonstrar o MedSync funcionando como sistema distribuido, monitoravel e implantavel.

## Pre-requisitos

- portas `3000`, `3001`, `5433`, `8080` e `9090` livres
- Docker rodando
- ambiente local com acesso ao repositorio
- usuario administrador disponivel

Credenciais padrao:

- `admin@medsync.com`
- `admin123`

## Demo local com Docker Compose

### 1. Subir o ambiente

```bash
docker compose up --build
```

### 2. Acessar o frontend

- [http://localhost:3000](http://localhost:3000)

### 3. Fazer login

- e-mail: `admin@medsync.com`
- senha: `admin123`

### 4. Abrir pacientes

- listar pacientes
- criar um novo paciente
- abrir o detalhe do paciente criado

### 5. Abrir triagem

- selecionar o paciente
- preencher sinais vitais e sintomas
- salvar a triagem

### 6. Mostrar Kafka e notificacoes

- abrir a tela de notificacoes
- mostrar a notificacao gerada pela triagem
- marcar a notificacao como lida

### 7. Mostrar Redis e cache

- consultar paciente por `id` e por `cpf`
- se fizer sentido, mostrar que o `patients-service` usa Redis para os caches principais

### 8. Mostrar Prometheus

- [http://localhost:9090](http://localhost:9090)
- abrir `Targets`
- confirmar `6/6` servicos Spring `UP`
- executar a query `up`

### 9. Mostrar Grafana

- [http://localhost:3001](http://localhost:3001)
- usuario `admin`
- senha `admin`
- abrir o dashboard `MedSync Overview`

### 10. Mostrar Kubernetes

- abrir [docs/deploy-kubernetes.md](/Users/mateuslevi/faculdade/medsync/docs/deploy-kubernetes.md)
- mostrar `k8s/base`
- mostrar `k8s/overlays/staging`
- mostrar `k8s/overlays/production`
- opcionalmente rodar:

```bash
kubectl kustomize k8s/overlays/staging
kubectl kustomize k8s/overlays/production
```

### 11. Mostrar CI/CD

- abrir `.github/workflows`
- explicar:
  - `ci.yml`
  - `docker-build.yml`
  - `deploy-staging.yml`
  - `deploy-production.yml`
  - `load-tests.yml`

### 12. Mostrar testes de carga

Rodar o smoke do fluxo completo com Docker:

```bash
BASE_URL=http://localhost:8080 docker run --rm \
  -e BASE_URL -e MEDSYNC_EMAIL -e MEDSYNC_PASSWORD -e LOAD_PROFILE=smoke \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/full-flow.js
```

Pontos para comentar:

- `login.js` smoke: 422 requisicoes, 0 falhas, `p95 73.35ms`, `checks 100%`
- `full-flow.js` smoke: 98 requisicoes, 14 iteracoes completas, 0 falhas, `p95 75.01ms`, `checks 100%`

## Plano B se algo falhar

- se o Compose falhar por porta, parar o container conflitante
- se a porta `3000` estiver ocupada, liberar o processo local correspondente
- se o Kafka demorar a estabilizar, aguardar alguns segundos ou reiniciar o broker
- se cluster real nao estiver disponivel, demonstrar apenas a renderizacao com `kubectl kustomize`
- se o Grafana nao carregar, mostrar o Prometheus `Targets` e o JSON do dashboard provisionado
- se alguma tela falhar, usar os documentos finais como apoio e mostrar os resultados do k6 ja validados

## Tempo estimado

- 8 a 12 minutos
