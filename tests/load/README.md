# Testes de carga com k6

Scripts disponiveis:

- `tests/load/login.js`
- `tests/load/patients.js`
- `tests/load/triage.js`
- `tests/load/notifications.js`
- `tests/load/full-flow.js`

Variaveis de ambiente:

- `BASE_URL`
- `MEDSYNC_EMAIL`
- `MEDSYNC_PASSWORD`
- `LOAD_PROFILE`

Fallbacks:

- `BASE_URL=http://localhost:8080`
- `MEDSYNC_EMAIL=admin@medsync.com`
- `MEDSYNC_PASSWORD=admin123`

Execucao local:

```bash
BASE_URL=http://localhost:8080 docker run --rm -i \
  -e BASE_URL \
  -e MEDSYNC_EMAIL \
  -e MEDSYNC_PASSWORD \
  -e LOAD_PROFILE=smoke \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/login.js
```

Fluxo completo:

```bash
BASE_URL=http://localhost:8080 docker run --rm -i \
  -e BASE_URL \
  -e MEDSYNC_EMAIL \
  -e MEDSYNC_PASSWORD \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/full-flow.js
```

Exportando sumario JSON:

```bash
BASE_URL=http://localhost:8080 docker run --rm -i \
  -e BASE_URL \
  -e MEDSYNC_EMAIL \
  -e MEDSYNC_PASSWORD \
  -v "$PWD:/work" -w /work \
  grafana/k6 run --summary-export tests/load/results/full-flow-summary.json tests/load/full-flow.js
```

Smoke profile:

- `LOAD_PROFILE=smoke` troca o `full-flow` para `vus: 1` e `duration: 30s`
- sem `LOAD_PROFILE=smoke`, o `full-flow` usa o perfil completo com stages
