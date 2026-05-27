# Deploy Kubernetes - MedSync

## Objetivo da etapa Semanas 7-8

Esta etapa prepara o MedSync para deploy em Kubernetes com dois ambientes separados, mantendo a base distribuida, o monitoramento local ja criado e a documentacao necessaria para demonstracao academica.

Os manifests desta entrega cobrem:

- frontend Next.js
- api-gateway
- auth-service
- users-service
- patients-service
- triage-service
- notifications-service
- PostgreSQL por dominio
- Redis
- Zookeeper
- Kafka
- Prometheus
- Grafana

## Por que dois ambientes

Foram preparados dois clusters ou namespaces logicos distintos:

- `medsync-staging`: homologacao, testes de deploy, validacao de monitoramento e base para testes de carga futuros
- `medsync-production`: ambiente principal de demonstracao, com replicas maiores nos servicos stateless mais sensiveis para a apresentacao final

Essa separacao reduz risco operacional e permite validar uma nova versao em staging antes de promovela manualmente para production.

Tambem foi preparado um overlay especifico para uma VPS Hostinger com k3s:

- `k8s/overlays/vps-production`
- namespace `medsync-production`
- foco em demonstracao real com recursos reduzidos
- 1 replica por servico para caber em `2 vCPU / 8 GB RAM`

## Diferenca entre staging e production

`staging`:

- 1 replica para frontend, gateway e microservices
- tags de imagem `staging`
- hosts externos `*.staging.medsync.local`
- foco em validacao funcional e operacional

`production`:

- 2 replicas para `frontend`, `api-gateway`, `auth-service`, `patients-service`, `triage-service` e `notifications-service`
- tags de imagem `production`
- resources maiores nesses workloads
- hosts externos `*.production.medsync.local`
- foco em contingencia manual e apresentacao final

`vps-production`:

- 1 replica para frontend, gateway, microservices e monitoramento
- services `frontend` e `api-gateway` expostos como `LoadBalancer` no k3s
- frontend em `http://187.127.12.230:3100`
- API Gateway em `http://187.127.12.230:8180`
- frontend buildado com `NEXT_PUBLIC_API_GATEWAY_URL=http://187.127.12.230:8180`
- Kafka ajustado para single broker
- Postgres com `pg_hba.conf` provisionado via `ConfigMap` para aceitar trafego da rede interna do cluster

## Estrutura dos manifests

```text
k8s/
├── base/
│   ├── configmaps/
│   ├── secrets/
│   ├── postgres/
│   ├── redis/
│   ├── kafka/
│   ├── zookeeper/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── users-service/
│   ├── patients-service/
│   ├── triage-service/
│   ├── notifications-service/
│   ├── frontend/
│   ├── monitoring/
│   └── kustomization.yaml
└── overlays/
    ├── staging/
    └── production/
```

Decisao tecnica:

- Os componentes stateless usam `Deployment` + `Service`
- PostgreSQL, Redis, Kafka e Zookeeper usam `Deployment` + `PersistentVolumeClaim`
- Para um projeto academico isso reduz complexidade sem quebrar a separacao de responsabilidades
- Em ambiente real, PostgreSQL e Kafka tenderiam a usar operadores ou `StatefulSet`

## ConfigMaps e Secrets

Os manifests usam:

- `ConfigMap` para URLs internas, DNS de servicos, topicos Kafka, configuracao do frontend e monitoramento
- `Secret` com placeholders para `JWT_SECRET`, `INTERNAL_SERVICE_TOKEN`, senhas de banco e senha do Grafana

Valores incluidos nesta entrega sao academicos e devem ser trocados em ambiente real:

- `JWT_SECRET=change-me`
- `INTERNAL_SERVICE_TOKEN=change-me`
- `POSTGRES_PASSWORD=change-me`
- `GF_SECURITY_ADMIN_PASSWORD=admin`

## Construindo imagens Docker

Substitua `YOUR_REGISTRY` e `YOUR_USER` pelo seu registry real. Exemplo com GHCR:

```bash
export REGISTRY=ghcr.io/YOUR_USER

docker build -t $REGISTRY/medsync-api-gateway:staging backend/api-gateway
docker build -t $REGISTRY/medsync-auth-service:staging backend/auth-service
docker build -t $REGISTRY/medsync-users-service:staging backend/users-service
docker build -t $REGISTRY/medsync-patients-service:staging backend/patients-service
docker build -t $REGISTRY/medsync-triage-service:staging backend/triage-service
docker build -t $REGISTRY/medsync-notifications-service:staging backend/notifications-service
docker build -t $REGISTRY/medsync-frontend:staging frontend/medsync-web
```

Para production, repita usando a tag `production`.

Observacao importante sobre o frontend:

- O cliente Next.js usa `NEXT_PUBLIC_API_GATEWAY_URL`
- Essa variavel impacta o bundle do frontend
- Gere a imagem de staging com a URL externa do gateway de staging
- Gere a imagem de production com a URL externa do gateway de production

Exemplo:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_GATEWAY_URL=http://api.staging.medsync.local \
  -t $REGISTRY/medsync-frontend:staging \
  frontend/medsync-web
```

O Dockerfile do frontend ja aceita esse `build-arg`, entao a mesma abordagem pode ser repetida para `production`.

Exemplo para a VPS Hostinger:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_GATEWAY_URL=http://187.127.12.230:8180 \
  -t $REGISTRY/medsync-frontend:vps-production \
  frontend/medsync-web
```

No GitHub Actions, o workflow `Docker Build and Push` aceita:

- `release_channel=vps-production`
- `frontend_gateway_url=http://187.127.12.230:8180`

Se o input nao for informado, o workflow tenta usar a variable `VPS_PRODUCTION_API_GATEWAY_URL` e, na falta dela, cai no fallback `http://187.127.12.230:8180`.

## Publicando imagens no registry

```bash
docker push $REGISTRY/medsync-api-gateway:staging
docker push $REGISTRY/medsync-auth-service:staging
docker push $REGISTRY/medsync-users-service:staging
docker push $REGISTRY/medsync-patients-service:staging
docker push $REGISTRY/medsync-triage-service:staging
docker push $REGISTRY/medsync-notifications-service:staging
docker push $REGISTRY/medsync-frontend:staging
```

Repita para `production`.

Para a VPS Hostinger, publique pelo menos:

```bash
docker push $REGISTRY/medsync-frontend:vps-production
docker push $REGISTRY/medsync-api-gateway:vps-production
docker push $REGISTRY/medsync-auth-service:vps-production
docker push $REGISTRY/medsync-users-service:vps-production
docker push $REGISTRY/medsync-patients-service:vps-production
docker push $REGISTRY/medsync-triage-service:vps-production
docker push $REGISTRY/medsync-notifications-service:vps-production
```

Depois disso, atualize os overlays para o registry real de uma destas formas:

1. Editando `newName: ghcr.io/your-user/...` nos overlays.
2. Substituindo `ghcr.io/your-user` dinamicamente no pipeline de deploy.
3. Mantendo os nomes logicos da base (`medsync-api-gateway`, `medsync-frontend`, etc.) e sobrescrevendo com `images:` nos overlays.

## Como criar os clusters

Esta entrega nao tenta criar clusters reais porque isso depende das credenciais do usuario. Os manifests foram preparados para:

- clusters locais com `kind` ou `minikube`
- clusters academicos em laboratorio
- clusters gerenciados em nuvem com `kubectl`

Exemplo com `kind`:

```bash
kind create cluster --name medsync-staging
kind create cluster --name medsync-production
```

Em cluster compartilhado, os namespaces ja separam os ambientes:

- `medsync-staging`
- `medsync-production`

## Aplicando manifests no staging

Primeiro renderize para validacao:

```bash
kubectl kustomize k8s/overlays/staging
```

Depois aplique:

```bash
kubectl apply -k k8s/overlays/staging
```

Validacoes iniciais:

```bash
kubectl get pods -n medsync-staging
kubectl get svc -n medsync-staging
kubectl get ingress -n medsync-staging
kubectl logs deploy/api-gateway -n medsync-staging
kubectl logs deploy/triage-service -n medsync-staging
kubectl logs deploy/notifications-service -n medsync-staging
```

## Aplicando manifests no production

Primeiro renderize:

```bash
kubectl kustomize k8s/overlays/production
```

Depois aplique:

```bash
kubectl apply -k k8s/overlays/production
```

Validacoes iniciais:

```bash
kubectl get pods -n medsync-production
kubectl get svc -n medsync-production
kubectl get ingress -n medsync-production
kubectl logs deploy/api-gateway -n medsync-production
kubectl logs deploy/triage-service -n medsync-production
kubectl logs deploy/notifications-service -n medsync-production
```

## Aplicando manifests na VPS Hostinger com k3s

Primeiro renderize:

```bash
kubectl kustomize k8s/overlays/vps-production
```

Depois aplique:

```bash
kubectl apply -k k8s/overlays/vps-production
```

Validacoes iniciais:

```bash
kubectl get pods -n medsync-production
kubectl get svc -n medsync-production
kubectl logs deploy/frontend -n medsync-production
kubectl logs deploy/api-gateway -n medsync-production
kubectl logs deploy/users-service -n medsync-production
kubectl logs deploy/postgres-users -n medsync-production
```

URLs esperadas na VPS:

- frontend: [http://187.127.12.230:3100](http://187.127.12.230:3100)
- API Gateway: [http://187.127.12.230:8180](http://187.127.12.230:8180)

Observacoes do overlay:

- o frontend precisa ser rebuildado com a URL publica do gateway antes do deploy
- o `users-service` deixa de depender de ajuste manual em `pg_hba.conf`, porque o overlay monta um arquivo provisionado pelo Kubernetes
- esse overlay assume a faixa de pods padrao do k3s (`10.42.0.0/16`) e tambem libera a faixa de services (`10.43.0.0/16`)

## Como acessar frontend, gateway, Prometheus e Grafana

### Via Ingress

Os manifests criam Ingress para:

- frontend
- api-gateway
- prometheus
- grafana

Hosts previstos:

- `frontend.staging.medsync.local`
- `api.staging.medsync.local`
- `prometheus.staging.medsync.local`
- `grafana.staging.medsync.local`
- `frontend.production.medsync.local`
- `api.production.medsync.local`
- `prometheus.production.medsync.local`
- `grafana.production.medsync.local`

Esses hosts sao placeholders academicos. Ajuste para o dominio real do cluster.

### Fallback via port-forward

Se o cluster nao tiver Ingress Controller:

```bash
kubectl port-forward svc/frontend 3000:3000 -n medsync-staging
kubectl port-forward svc/api-gateway 8080:8080 -n medsync-staging
kubectl port-forward svc/prometheus 9090:9090 -n medsync-staging
kubectl port-forward svc/grafana 3001:3000 -n medsync-staging
```

Repita trocando o namespace para `medsync-production` quando necessario.

Na VPS Hostinger, o overlay `vps-production` usa `Service type=LoadBalancer` para expor o frontend e o gateway nas portas `3100` e `8180`, evitando depender de hosts como `frontend.production.medsync.local`.

## Monitoramento no Kubernetes

O stack de observabilidade foi replicado no Kubernetes com:

- `Deployment` e `Service` do Prometheus
- `Deployment` e `Service` do Grafana
- `ConfigMap` do `prometheus.yml`
- provisioning automatico do datasource Prometheus no Grafana
- dashboard `MedSync Overview` provisionado via ConfigMap

Coleta de metricas:

- `api-gateway:8080/actuator/prometheus`
- `auth-service:8081/actuator/prometheus`
- `users-service:8082/actuator/prometheus`
- `patients-service:8083/actuator/prometheus`
- `triage-service:8084/actuator/prometheus`
- `notifications-service:8085/actuator/prometheus`

Endpoints Actuator usados nos probes:

- `/actuator/health`

Grafana:

- usuario padrao: `admin`
- senha padrao: `admin`

Troque essa senha em ambiente real.

## Como validar pods, services e logs

```bash
kubectl get all -n medsync-staging
kubectl describe pod <pod-name> -n medsync-staging
kubectl logs deploy/users-service -n medsync-staging
kubectl logs deploy/patients-service -n medsync-staging
kubectl logs deploy/prometheus -n medsync-staging
kubectl logs deploy/grafana -n medsync-staging
```

Healthchecks uteis:

```bash
kubectl port-forward svc/api-gateway 8080:8080 -n medsync-staging
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/prometheus
```

## Como testar o fluxo principal

1. Validar login no frontend via API Gateway.
2. Criar ou consultar pacientes.
3. Criar triagem e alterar prioridade/status.
4. Conferir no `triage-service` se os eventos Kafka foram publicados sem erro.
5. Conferir no `notifications-service` se o consumo dos topicos gerou notificacoes.
6. Abrir Grafana e Prometheus para verificar servicos `up`, latencia HTTP e metricas JVM.

Checklist rapido:

- `frontend` responde
- `api-gateway` roteia `/api/auth`, `/api/users`, `/api/patients`, `/api/triage` e `/api/notifications`
- `patients-service` e `triage-service` acessam Redis
- `triage-service` publica em Kafka
- `notifications-service` consome Kafka
- Prometheus marca os seis servicos Spring como `up`

## Contingencia manual

Fluxo sugerido para demonstracao final:

1. Validar `medsync-production` antes da apresentacao.
2. Se algum deploy falhar, inspecionar pods e logs em production.
3. Se a correcao nao for imediata, redirecionar a demonstracao para `medsync-staging`.
4. Se necessario, reaplicar o overlay anterior ou uma imagem anterior usando `kubectl rollout undo`.

Exemplos:

```bash
kubectl rollout status deploy/api-gateway -n medsync-production
kubectl rollout undo deploy/api-gateway -n medsync-production
kubectl rollout undo deploy/frontend -n medsync-production
```

## Evidencias para a entrega

Capturas recomendadas:

- `kubectl get pods -n medsync-staging`
- `kubectl get pods -n medsync-production`
- tela do Prometheus com targets `UP`
- tela do Grafana com dashboard `MedSync Overview`
- frontend autenticado em staging ou production
- logs do `triage-service` e `notifications-service` mostrando fluxo com Kafka

## Limitacoes academicas

- Bancos, Redis, Kafka e Zookeeper permanecem dentro do cluster
- Secrets usam placeholders simplificados
- Nao ha failover automatico entre staging e production
- Nao ha TLS ou gerenciamento de DNS nesta etapa
- O frontend depende de `NEXT_PUBLIC_API_GATEWAY_URL`, portanto a URL externa do gateway precisa entrar no processo de build da imagem

## Proximos passos reais

- banco gerenciado
- DNS com failover
- TLS e certificados
- autoscaling horizontal
- external secrets
- service mesh ou observabilidade mais avancada
- pipeline de CI/CD para build e promocao entre ambientes
