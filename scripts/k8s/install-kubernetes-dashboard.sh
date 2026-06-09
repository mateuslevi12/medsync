#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
VALUES_FILE="${REPO_ROOT}/infra/kubernetes-dashboard/values.yaml"
RBAC_FILE="${REPO_ROOT}/infra/kubernetes-dashboard/rbac-readonly.yaml"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Erro: kubectl não encontrado no PATH." >&2
  exit 1
fi

if ! command -v helm >/dev/null 2>&1; then
  echo "Erro: helm não encontrado no PATH." >&2
  exit 1
fi

echo "Adicionando repositório Helm do Kubernetes Dashboard..."
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/

echo "Atualizando índices do Helm..."
helm repo update

echo "Instalando/atualizando Kubernetes Dashboard..."
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard \
  --create-namespace \
  --namespace kubernetes-dashboard \
  -f "${VALUES_FILE}"

echo "Aplicando RBAC readonly..."
kubectl apply -f "${RBAC_FILE}"

echo
echo "Pods do namespace kubernetes-dashboard:"
kubectl get pods -n kubernetes-dashboard

echo
echo "Services do namespace kubernetes-dashboard:"
kubectl get svc -n kubernetes-dashboard
