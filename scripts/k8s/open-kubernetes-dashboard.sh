#!/usr/bin/env bash

set -euo pipefail

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Erro: kubectl não encontrado no PATH." >&2
  exit 1
fi

SERVICE_NAME="kubernetes-dashboard-kong-proxy"

if ! kubectl get svc "${SERVICE_NAME}" -n kubernetes-dashboard >/dev/null 2>&1; then
  echo "Service ${SERVICE_NAME} não encontrado no namespace kubernetes-dashboard." >&2
  echo
  kubectl get svc -n kubernetes-dashboard
  exit 1
fi

echo "Acesse: https://localhost:8443"
kubectl -n kubernetes-dashboard port-forward svc/${SERVICE_NAME} 8443:443
