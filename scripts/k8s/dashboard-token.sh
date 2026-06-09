#!/usr/bin/env bash

set -euo pipefail

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Erro: kubectl não encontrado no PATH." >&2
  exit 1
fi

echo "Aviso: o token é sensível, temporário e não deve ser salvo em arquivo nem commitado."
echo
kubectl -n kubernetes-dashboard create token medsync-dashboard-viewer
