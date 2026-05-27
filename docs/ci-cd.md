# CI/CD - MedSync

## Objetivo do CI/CD

Esta etapa prepara o MedSync para a entrega final das Semanas 7-8 com automacao de validacao, build de imagens e deploy manual para os ambientes Kubernetes de staging e production.

Os pipelines foram desenhados para:

- validar frontend, backend, Docker Compose e Kustomize
- buildar e publicar imagens no GitHub Container Registry
- aplicar os overlays Kubernetes de `medsync-staging` e `medsync-production`
- manter secrets fora do repositorio

No estado atual da entrega academica, o CI trata backend como validacao de build/compilacao. Os testes funcionais e de integracao ficam cobertos pela execucao do ambiente via Docker Compose e pelos fluxos de carga com k6.

## Workflows criados

- `.github/workflows/ci.yml`
- `.github/workflows/docker-build.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `.github/workflows/load-tests.yml`

## Quando cada workflow executa

`ci.yml`:

- `push` para `main`
- `pull_request` para `main`

`docker-build.yml`:

- `push` para `main`
- `workflow_dispatch`

Comportamento:

- `push` em `main`: publica tags `latest`, `<sha-curto>` e `staging`
- `workflow_dispatch` com `release_channel=production`: publica `latest`, `<sha-curto>` e `production`

`deploy-staging.yml`:

- `workflow_dispatch`

`deploy-production.yml`:

- `workflow_dispatch`

Observacao:

- O deploy de production permanece manual, sem automacao por push

`load-tests.yml`:

- `workflow_dispatch`
- executa smoke tests manuais com k6

## Validacoes cobertas pelo CI

Frontend:

- `npm ci`
- `npm run build`

Backend:

- `mvn -B -DskipTests package` para:
  - `backend/api-gateway`
  - `backend/auth-service`
  - `backend/users-service`
  - `backend/patients-service`
  - `backend/triage-service`
  - `backend/notifications-service`

Racional:

- os servicos `triage-service` e `notifications-service` possuem `contextLoads` com dependencias reais de Kafka, PostgreSQL, Redis e variaveis externas
- no runner padrao do GitHub Actions essa infraestrutura nao existe nem esta mockada
- por isso o criterio principal no CI ficou sendo compilacao empacotada com Maven, enquanto a validacao funcional ocorre no ambiente integrado

Infra:

- `docker compose config`
- `kubectl kustomize k8s/base`
- `kubectl kustomize k8s/overlays/staging`
- `kubectl kustomize k8s/overlays/production`
- `kubectl kustomize k8s/overlays/vps-production`

## Testes fora do job de backend

Os testes que hoje validam comportamento real do sistema sao:

- smoke e fluxos completos com k6 em `tests/load`
- validacao do ambiente integrado com Docker Compose
- observabilidade via Prometheus e Grafana durante a execucao

Os `contextLoads` dos servicos que dependem de infraestrutura externa nao sao usados como criterio principal do CI nesta entrega, porque o pipeline nao sobe Kafka, PostgreSQL e Redis nem usa mocks equivalentes.

Evolucao futura recomendada:

- Testcontainers para PostgreSQL, Redis e Kafka
- profile `test` com mocks/stubs controlados
- separacao clara entre testes unitarios, integracao e smoke

## Como configurar GHCR

O workflow `docker-build.yml` usa:

- `docker/setup-buildx-action`
- `docker/login-action`
- `docker/build-push-action`
- `GITHUB_TOKEN`

Permissoes necessarias no workflow:

- `contents: read`
- `packages: write`

Por padrao, as imagens sao publicadas em:

```text
ghcr.io/<owner>/
```

Exemplo:

- `ghcr.io/<owner>/medsync-api-gateway`
- `ghcr.io/<owner>/medsync-auth-service`
- `ghcr.io/<owner>/medsync-users-service`
- `ghcr.io/<owner>/medsync-patients-service`
- `ghcr.io/<owner>/medsync-triage-service`
- `ghcr.io/<owner>/medsync-notifications-service`
- `ghcr.io/<owner>/medsync-frontend`

Se quiser sobrescrever o prefixo, configure a variable:

- `REGISTRY_IMAGE_PREFIX`

Exemplo:

```text
ghcr.io/minha-org
```

## Secrets do GitHub

Configure estes secrets no repositorio:

- `KUBE_CONFIG_STAGING`
- `KUBE_CONFIG_PRODUCTION`

Eles podem ser armazenados como:

- kubeconfig em texto puro
- kubeconfig em Base64

Os workflows tentam decodificar Base64 primeiro e fazem fallback para texto puro.

## Variables do GitHub

Configure estas variables:

- `STAGING_API_GATEWAY_URL`
- `PRODUCTION_API_GATEWAY_URL`
- `REGISTRY_IMAGE_PREFIX`

Variables opcionais:

- `STAGING_FRONTEND_URL`
- `PRODUCTION_FRONTEND_URL`

Uso esperado:

- `STAGING_API_GATEWAY_URL`: URL externa do API Gateway usada no build do frontend de staging
- `PRODUCTION_API_GATEWAY_URL`: URL externa do API Gateway usada no build do frontend de production
- `REGISTRY_IMAGE_PREFIX`: prefixo do registry usado no build/push e no deploy
- `STAGING_FRONTEND_URL` e `PRODUCTION_FRONTEND_URL`: se definidas, ajustam `FRONTEND_URL` no gateway durante o deploy para CORS mais fiel ao ambiente

Se `STAGING_API_GATEWAY_URL` ou `PRODUCTION_API_GATEWAY_URL` nao forem definidas, os workflows usam placeholders:

- `http://api.staging.medsync.local`
- `http://api.production.medsync.local`

## Frontend por ambiente

O frontend usa `NEXT_PUBLIC_API_GATEWAY_URL` no build. Por isso:

- a imagem de staging deve ser buildada com a URL de staging
- a imagem de production deve ser buildada com a URL de production

O workflow `docker-build.yml` ja faz isso automaticamente usando:

- `vars.STAGING_API_GATEWAY_URL`
- `vars.PRODUCTION_API_GATEWAY_URL`

## Como executar o deploy de staging

1. Garanta que as imagens desejadas ja foram publicadas no GHCR.
2. Abra `Actions` no GitHub.
3. Execute `Deploy Staging`.
4. Informe opcionalmente:
   - `image_tag`: por padrao `staging`
   - `registry_image_prefix`: por padrao vem de `REGISTRY_IMAGE_PREFIX` ou `ghcr.io/<owner>`

O workflow executa:

- checkout
- setup do `kubectl`
- carga do `KUBE_CONFIG_STAGING`
- validacao do contexto
- renderizacao do overlay `k8s/overlays/staging`
- `kubectl apply -k`
- `kubectl rollout status`
- `kubectl get pods -n medsync-staging`

## Como executar o deploy de production

1. Garanta que as imagens desejadas ja foram publicadas no GHCR.
2. Abra `Actions` no GitHub.
3. Execute manualmente `Deploy Production`.
4. Informe opcionalmente:
   - `image_tag`: por padrao `production`
   - `registry_image_prefix`: por padrao vem de `REGISTRY_IMAGE_PREFIX` ou `ghcr.io/<owner>`

O workflow executa:

- checkout
- setup do `kubectl`
- carga do `KUBE_CONFIG_PRODUCTION`
- validacao do contexto
- renderizacao do overlay `k8s/overlays/production`
- `kubectl apply -k`
- `kubectl rollout status`
- `kubectl get pods -n medsync-production`

## Como validar o deploy

Staging:

```bash
kubectl get pods -n medsync-staging
kubectl get svc -n medsync-staging
kubectl get ingress -n medsync-staging
kubectl logs deploy/api-gateway -n medsync-staging
kubectl logs deploy/frontend -n medsync-staging
```

Production:

```bash
kubectl get pods -n medsync-production
kubectl get svc -n medsync-production
kubectl get ingress -n medsync-production
kubectl logs deploy/api-gateway -n medsync-production
kubectl logs deploy/frontend -n medsync-production
```

## Rollback basico

Rollback manual por deployment:

```bash
kubectl rollout undo deployment/api-gateway -n medsync-production
kubectl rollout undo deployment/frontend -n medsync-production
```

Alternativas academicas de contingencia:

- redirecionar a demonstracao para `medsync-staging`
- reaplicar uma tag anterior via `Deploy Production` usando `image_tag=<sha-curto>`
- reaplicar uma versao anterior do overlay se necessario

## Como o pipeline usa os overlays Kubernetes

Os manifests base usam nomes logicos de imagem, por exemplo:

- `medsync-api-gateway:latest`
- `medsync-frontend:latest`

Os overlays de staging e production usam `images:` do Kustomize para apontar para GHCR com as tags de ambiente.

Durante o deploy, o workflow:

- copia a arvore `k8s/`
- substitui `ghcr.io/your-user` pelo prefixo configurado
- opcionalmente troca a tag (`staging`, `production` ou um SHA`)
- renderiza com `kubectl kustomize`
- aplica no cluster

## Limitações academicas

- nao ha deploy real automatico sem credenciais do cluster
- `production` permanece manual por seguranca
- o rollback e manual
- nao ha promocao automatica entre staging e production
- nao ha assinatura de imagem, SBOM ou policy controller nesta etapa
- nao ha testes de carga nesta etapa
