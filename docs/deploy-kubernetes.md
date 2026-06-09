# Deploy Kubernetes - MedSync

## Objetivo

Preparar o MedSync para deploy em Kubernetes mantendo paridade com a stack local:

- frontend Next.js
- API Gateway
- auth-service
- users-service
- patients-service
- triage-service
- medical-record-service
- notifications-service
- PostgreSQL por dominio
- Redis
- MongoDB
- Zookeeper
- Kafka
- Prometheus
- Grafana

## Ambientes

Foram preparados:

- `k8s/overlays/staging`
- `k8s/overlays/production`
- `k8s/overlays/vps-production`

Namespaces:

- `medsync-staging`
- `medsync-production`

## Estrutura dos manifests

```text
k8s/
├── base/
│   ├── configmaps/
│   ├── secrets/
│   ├── postgres/
│   ├── mongodb/
│   ├── redis/
│   ├── kafka/
│   ├── zookeeper/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── users-service/
│   ├── patients-service/
│   ├── triage-service/
│   ├── medical-record-service/
│   ├── notifications-service/
│   ├── frontend/
│   ├── monitoring/
│   └── kustomization.yaml
└── overlays/
    ├── staging/
    ├── production/
    └── vps-production/
```

## ConfigMaps e Secrets

Configuracoes relevantes:

- `MEDICAL_RECORDS_SERVICE_URL`
- `MONGODB_URI`
- `MONGODB_DATABASE`
- `KAFKA_TOPIC_AMBULATORY_FLOW`
- `INTERNAL_SERVICE_TOKEN`
- `JWT_SECRET`

## Construindo imagens Docker

Exemplo com GHCR:

```bash
export REGISTRY=ghcr.io/YOUR_USER

docker build -t $REGISTRY/medsync-api-gateway:staging backend/api-gateway
docker build -t $REGISTRY/medsync-auth-service:staging backend/auth-service
docker build -t $REGISTRY/medsync-users-service:staging backend/users-service
docker build -t $REGISTRY/medsync-patients-service:staging backend/patients-service
docker build -t $REGISTRY/medsync-triage-service:staging backend/triage-service
docker build -t $REGISTRY/medsync-medical-record-service:staging backend/medical-record-service
docker build -t $REGISTRY/medsync-notifications-service:staging backend/notifications-service
docker build -t $REGISTRY/medsync-frontend:staging frontend/medsync-web
```

Observacao:

- os Dockerfiles Java foram endurecidos com cache Maven e `dependency:go-offline`
- isso melhora previsibilidade de build em Compose e CI

## Publicando imagens

```bash
docker push $REGISTRY/medsync-api-gateway:staging
docker push $REGISTRY/medsync-auth-service:staging
docker push $REGISTRY/medsync-users-service:staging
docker push $REGISTRY/medsync-patients-service:staging
docker push $REGISTRY/medsync-triage-service:staging
docker push $REGISTRY/medsync-medical-record-service:staging
docker push $REGISTRY/medsync-notifications-service:staging
docker push $REGISTRY/medsync-frontend:staging
```

Repita para `production` e `vps-production`.

## Aplicando manifests

Renderizacao:

```bash
kubectl kustomize k8s/base
kubectl kustomize k8s/overlays/staging
kubectl kustomize k8s/overlays/production
kubectl kustomize k8s/overlays/vps-production
```

Deploy:

```bash
kubectl apply -k k8s/overlays/staging
kubectl apply -k k8s/overlays/production
```

## Validacoes minimas

```bash
kubectl get pods -n medsync-staging
kubectl get pods -n medsync-production
kubectl get svc -n medsync-staging
kubectl get svc -n medsync-production
kubectl logs deploy/medical-record-service -n medsync-staging
kubectl logs deploy/medical-record-service -n medsync-production
```

Checks importantes:

- `api-gateway` resolve `medical-record-service`
- `medical-record-service` conecta em MongoDB
- Prometheus encontra `medical-record-service:8086`
- frontend aponta para o gateway externo correto

## Estado validado nesta rodada

- `kubectl kustomize` dos quatro conjuntos de manifests: `OK`
- overlays incluem `medical-record-service` e `mongodb`
- workflows de deploy foram ajustados para incluir rollout do novo servico

## Instalacao opcional do Kubernetes Dashboard

O projeto inclui uma instalacao opcional do Kubernetes Dashboard via Helm para fins de demonstracao academica.

Instalacao:

```bash
chmod +x scripts/k8s/install-kubernetes-dashboard.sh
./scripts/k8s/install-kubernetes-dashboard.sh
```

Abrir localmente:

```bash
chmod +x scripts/k8s/open-kubernetes-dashboard.sh
./scripts/k8s/open-kubernetes-dashboard.sh
```

O acesso recomendado e:

- via `kubectl port-forward`
- sem Ingress publico
- sem LoadBalancer

Aviso:

- nao expor o Dashboard publicamente
- nao versionar tokens
- usar o RBAC readonly como padrao

Detalhes completos em [docs/kubernetes-dashboard.md](docs/kubernetes-dashboard.md).
