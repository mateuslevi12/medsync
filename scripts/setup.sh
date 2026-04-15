#!/usr/bin/env bash

set -euo pipefail

echo "==============================================="
echo "Bem-vindo ao setup do MedSync"
echo "==============================================="

if ! command -v docker >/dev/null 2>&1; then
  echo "Erro: Docker não está instalado. Instale o Docker e tente novamente."
  exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
  echo "Erro: docker-compose não está instalado. Instale o docker-compose e tente novamente."
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Iniciando serviços de infraestrutura com docker-compose..."
docker-compose up -d --build

echo "Serviços iniciados com sucesso."
