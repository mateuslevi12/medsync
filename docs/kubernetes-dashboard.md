# Dashboard do Kubernetes - MedSync

## Objetivo

O Kubernetes Dashboard permite visualizar recursos operacionais do cluster Kubernetes usados pelo MedSync, incluindo:

- namespaces
- pods
- deployments
- services
- logs
- events
- PVCs
- status geral do cluster

No contexto do projeto, ele complementa a observabilidade já feita por Prometheus e Grafana ao oferecer uma visão operacional dos objetos do Kubernetes.

## Diferença entre Grafana e Kubernetes Dashboard

- Grafana: usado para métricas, observabilidade e painéis de aplicação/infraestrutura.
- Kubernetes Dashboard: usado para visualização operacional e gerenciamento básico dos recursos Kubernetes.

Em resumo:

- Grafana mostra comportamento e métricas.
- Kubernetes Dashboard mostra objetos e estado do cluster.

## Aviso de segurança

O Kubernetes Dashboard oficial deve ser tratado com cautela. Para este projeto ele será usado apenas para fins acadêmicos e de demonstração.

Regras adotadas no MedSync:

- o Dashboard não deve ficar público na internet
- o acesso padrão é via `kubectl port-forward`
- tokens não devem ser versionados
- o RBAC padrão do projeto é readonly
- não há Ingress nem LoadBalancer para o Dashboard

Observação importante:

- o projeto inclui acesso readonly por padrão
- `secrets` foram incluídos no RBAC de leitura para reduzir o risco de quebra da UI em alguns fluxos do Dashboard
- isso aumenta a superfície de exposição de dados sensíveis e não deve ser usado sem avaliação em ambientes reais

O Kubernetes Dashboard também é comumente considerado uma solução em descontinuidade prática para ambientes modernos. Como alternativa futura, o projeto pode avaliar o Headlamp, mas a implementação atual permanece no Dashboard oficial para a demonstração acadêmica.

## Instalação

```bash
chmod +x scripts/k8s/install-kubernetes-dashboard.sh
./scripts/k8s/install-kubernetes-dashboard.sh
```

O script faz:

- validação de `kubectl`
- validação de `helm`
- adição do repositório oficial
- `helm upgrade --install`
- aplicação do RBAC readonly
- exibição dos pods e services do namespace `kubernetes-dashboard`

## Gerar token

```bash
chmod +x scripts/k8s/dashboard-token.sh
./scripts/k8s/dashboard-token.sh
```

O token:

- é impresso apenas no terminal
- não é salvo em arquivo
- não deve ser commitado

## Abrir dashboard

```bash
chmod +x scripts/k8s/open-kubernetes-dashboard.sh
./scripts/k8s/open-kubernetes-dashboard.sh
```

Acesso:

```text
https://localhost:8443
```

Observação:

- o acesso é feito via `port-forward` para o service `kubernetes-dashboard-kong-proxy`
- se o service não existir, o script lista os services do namespace para facilitar debug

## Acesso na VPS com SSH Tunnel

Cenário recomendado para a VPS Hostinger com k3s:

No servidor VPS:

```bash
./scripts/k8s/open-kubernetes-dashboard.sh
```

Na máquina local:

```bash
ssh -L 8443:127.0.0.1:8443 root@IP_DA_VPS
```

Depois acessar localmente:

```text
https://localhost:8443
```

Importante:

- não usar `--address 0.0.0.0` como padrão
- manter o Dashboard restrito ao host local da VPS e ao túnel SSH

## Validação

```bash
kubectl get pods -n kubernetes-dashboard
kubectl get svc -n kubernetes-dashboard
kubectl auth can-i list pods --as=system:serviceaccount:kubernetes-dashboard:medsync-dashboard-viewer -A
helm list -n kubernetes-dashboard
```

Valide também:

- o login por token funciona
- o namespace `medsync-production` aparece na UI
- os recursos readonly são exibidos sem necessidade de permissões administrativas

## O que mostrar na apresentação

Durante a demo, mostrar preferencialmente:

- namespace `medsync-production`
- deployments dos microservices
- pods rodando
- services
- PVCs dos bancos
- events do cluster
- logs de um pod
- relação com Prometheus/Grafana

Narrativa sugerida:

- Kubernetes Dashboard para visão operacional
- Prometheus e Grafana para métricas e observabilidade

## Troubleshooting

Problemas comuns:

### Helm não instalado

Sintoma:

- o script de instalação falha ao iniciar

Correção:

- instalar Helm na máquina que possui acesso ao cluster

### kubectl sem acesso ao cluster

Sintoma:

- comandos retornam erro de autenticação ou contexto inexistente

Correção:

- revisar `KUBECONFIG`
- revisar contexto atual com `kubectl config current-context`

### token inválido

Sintoma:

- login falha no Dashboard

Correção:

- gerar um novo token com `./scripts/k8s/dashboard-token.sh`
- confirmar que a ServiceAccount `medsync-dashboard-viewer` existe

### service `kubernetes-dashboard-kong-proxy` não encontrado

Sintoma:

- o script de abertura encerra com erro

Correção:

- rodar `kubectl get svc -n kubernetes-dashboard`
- confirmar se a release Helm foi instalada corretamente
- validar o nome dos services gerados pela versão atual do chart

### browser alerta certificado local

Sintoma:

- o navegador alerta sobre certificado ao abrir `https://localhost:8443`

Correção:

- para fins de demo local, aceitar o certificado autoassinado no navegador

### pods pendentes por falta de recurso na VPS

Sintoma:

- pods do Dashboard ficam em `Pending`

Correção:

- verificar CPU/memória disponível
- revisar limites/requests do cluster
- validar se a VPS possui recursos mínimos para os componentes adicionais

## Arquivos do projeto

Os artefatos criados para este módulo ficam em:

- `infra/kubernetes-dashboard/values.yaml`
- `infra/kubernetes-dashboard/rbac-readonly.yaml`
- `infra/kubernetes-dashboard/rbac-demo-admin.yaml.example`
- `scripts/k8s/install-kubernetes-dashboard.sh`
- `scripts/k8s/dashboard-token.sh`
- `scripts/k8s/open-kubernetes-dashboard.sh`
