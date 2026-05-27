# Kubernetes do MedSync

Comandos rapidos:

```bash
kubectl kustomize k8s/base
kubectl kustomize k8s/overlays/staging
kubectl kustomize k8s/overlays/production

kubectl apply -k k8s/overlays/staging
kubectl apply -k k8s/overlays/production

kubectl get pods -n medsync-staging
kubectl get pods -n medsync-production
kubectl get ingress -n medsync-staging
kubectl get ingress -n medsync-production
```

Port-forward de fallback:

```bash
kubectl port-forward svc/frontend 3000:3000 -n medsync-staging
kubectl port-forward svc/api-gateway 8080:8080 -n medsync-staging
kubectl port-forward svc/prometheus 9090:9090 -n medsync-staging
kubectl port-forward svc/grafana 3001:3000 -n medsync-staging
```

Observacoes:

- Os overlays criam namespaces separados: `medsync-staging` e `medsync-production`.
- A base usa nomes logicos de imagem e os overlays usam `images:` do Kustomize para apontar para `ghcr.io/your-user/...`.
- Os workflows de CI/CD substituem `ghcr.io/your-user` pelo prefixo definido em `REGISTRY_IMAGE_PREFIX` ou, por padrao, `ghcr.io/<owner>`.
- O frontend usa `NEXT_PUBLIC_API_GATEWAY_URL`; gere a imagem de cada ambiente com a URL externa correta do API Gateway.
- `docs/deploy-kubernetes.md` traz o fluxo completo de build, publicacao, deploy e validacao.
- `docs/ci-cd.md` descreve os workflows `ci`, `docker-build`, `deploy-staging` e `deploy-production`.

Uso pelos pipelines:

```bash
kubectl kustomize k8s/overlays/staging
kubectl kustomize k8s/overlays/production
```

- `Deploy Staging` usa `k8s/overlays/staging` e, por padrao, a tag `staging`.
- `Deploy Production` usa `k8s/overlays/production` e, por padrao, a tag `production`.
- Ambos aceitam sobrescrever `image_tag` para reaplicar um SHA especifico em caso de rollback manual.
