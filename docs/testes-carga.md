# Testes de carga com k6 - MedSync

## Objetivo dos testes de carga

Esta etapa adiciona uma suite reproduzivel de testes com k6 para demonstrar que o MedSync foi avaliado nos fluxos distribuidos mais relevantes da entrega:

- autenticacao
- pacientes
- triagem
- notificacoes
- fluxo completo com efeito indireto em Kafka

O foco e academico: evidenciar comportamento, latencia, erros e integracao distribuida, e nao produzir um benchmark definitivo de producao.

## Por que k6 foi usado

O k6 foi escolhido porque:

- permite scripts versionados em JavaScript
- facilita parametrizacao por ambiente
- funciona localmente e em pipeline
- exporta sumarios JSON para evidencias
- e simples de executar via Docker, sem depender de instalacao local

## Estrutura criada

```text
tests/
  load/
    README.md
    config.js
    login.js
    patients.js
    triage.js
    notifications.js
    full-flow.js
    results/
      .gitkeep
```

## Fluxos testados

`login.js`:

- `POST /api/auth/login`
- valida `status 200`
- valida token na resposta

`patients.js`:

- login
- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/{id}`
- `PUT /api/patients/{id}`

`triage.js`:

- login
- garante um paciente
- `POST /api/triage`
- `GET /api/triage`
- `GET /api/triage/waiting`

Observacao:

- a publicacao Kafka nao e lida diretamente pelo k6
- a criacao da triagem aciona o `triage-service`, que publica o evento esperado

`notifications.js`:

- login
- `GET /api/notifications`
- `GET /api/notifications/unread`
- marca uma notificacao como lida
- se necessario, cria uma triagem para forcar um evento e gerar notificacao

`full-flow.js`:

- login
- cria paciente
- cria triagem para o paciente
- espera o processamento assincrono
- lista notificacoes
- encontra a notificacao relacionada ao `triageId`
- marca a notificacao como lida

Esse e o script principal para apresentacao.

## Como configurar BASE_URL

Variavel:

- `BASE_URL`

Fallback:

- `http://localhost:8080`

Exemplos:

Local:

```bash
BASE_URL=http://localhost:8080
```

Staging:

```bash
BASE_URL=https://api.staging.medsync.local
```

Production ou demo:

```bash
BASE_URL=https://api.medsync.local
```

## Como configurar credenciais

Variaveis:

- `MEDSYNC_EMAIL`
- `MEDSYNC_PASSWORD`

Fallbacks academicos:

- `MEDSYNC_EMAIL=admin@medsync.com`
- `MEDSYNC_PASSWORD=admin123`

Nao use credenciais reais no repositorio.

## Cenarios de carga

Scripts menores:

- `vus: 1`
- `duration: 30s`

`full-flow.js`:

- `30s` subindo para `5` usuarios
- `1m` mantendo `5` usuarios
- `30s` subindo para `10` usuarios
- `1m` mantendo `10` usuarios
- `30s` descendo para `0`

Thresholds configurados:

- `http_req_failed < 5%`
- `http_req_duration p(95) < 2000ms`
- `checks > 95%`

Observacao:

- se o ambiente local estiver mais limitado, esses thresholds podem ser ajustados para a apresentacao
- `LOAD_PROFILE=smoke` força o `full-flow` a usar o mesmo perfil curto de `30s`

## Como rodar localmente

Login:

```bash
BASE_URL=http://localhost:8080 docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_EMAIL \
  -e MEDSYNC_PASSWORD \
  -e LOAD_PROFILE=smoke \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/login.js
```

Fluxo completo:

```bash
BASE_URL=http://localhost:8080 docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_EMAIL \
  -e MEDSYNC_PASSWORD \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/full-flow.js
```

## Como rodar contra staging

```bash
BASE_URL=https://api.staging.medsync.local docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_EMAIL \
  -e MEDSYNC_PASSWORD \
  -e LOAD_PROFILE=smoke \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/full-flow.js
```

## Como rodar contra production ou demo

```bash
BASE_URL=https://api.medsync.local docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_EMAIL \
  -e MEDSYNC_PASSWORD \
  -e LOAD_PROFILE=smoke \
  -v "$PWD:/work" -w /work \
  grafana/k6 run tests/load/full-flow.js
```

Em ambiente de demonstracao, prefira o perfil `smoke`.

## Como exportar resultado JSON

```bash
BASE_URL=http://localhost:8080 docker run --rm \
  -e BASE_URL \
  -e MEDSYNC_EMAIL \
  -e MEDSYNC_PASSWORD \
  -v "$PWD:/work" -w /work \
  grafana/k6 run \
  --summary-export tests/load/results/full-flow-summary.json \
  tests/load/full-flow.js
```

## Como interpretar as metricas

`http_req_duration`:

- tempo de resposta das requisicoes HTTP
- o `p95` indica o tempo abaixo do qual 95% das requisicoes terminaram

`http_req_failed`:

- taxa de falhas HTTP ou de rede

`checks`:

- taxa de validacoes funcionais aprovadas dentro do script

`p95`:

- bom indicador para apresentar latencia sem ficar preso a outliers isolados

## Criterios de aceitacao academicos

Esta etapa atende ao objetivo se:

- os scripts executarem com `BASE_URL` configuravel
- o login responder com token
- o fluxo de pacientes responder sem erro sistemico
- a criacao de triagem responder e refletir o fluxo distribuido
- as notificacoes puderem ser lidas pelo gateway
- o `full-flow` demonstrar a sequencia login -> paciente -> triagem -> notificacao

## Resultados validados

`login.js` em smoke:

- 422 requisicoes
- 0 falhas
- `p95 = 73.35ms`
- `checks = 100%`

`full-flow.js` em smoke:

- 98 requisicoes
- 14 iteracoes completas
- 0 falhas
- `p95 = 75.01ms`
- `checks = 100%`
- media por iteracao de aproximadamente `2.15s`

Problema real encontrado:

- os testes revelaram um `500` em `GET /api/patients/{id}`
- a causa foi serializacao de `LocalDate` no cache Redis do `patients-service`
- a correcao foi aplicada no `CacheConfig` com a mesma estrategia de serializacao do `triage-service`

## Monitoramento durante os testes

Durante a carga, use o Grafana e o Prometheus para observar:

- aumento de requisicoes HTTP por servico
- latencia e `p95`
- erros `4xx` e `5xx`
- uso de memoria JVM
- uso de CPU do processo
- disponibilidade dos seis servicos Spring

## Workflow opcional no GitHub Actions

Foi criado um workflow manual:

- `.github/workflows/load-tests.yml`

Ele:

- e executado apenas via `workflow_dispatch`
- recebe `base_url` e `script`
- roda k6 em perfil `smoke`
- exporta sumario JSON como artifact

Secrets opcionais para esse workflow:

- `MEDSYNC_LOADTEST_EMAIL`
- `MEDSYNC_LOADTEST_PASSWORD`

Se nao forem configurados, os fallbacks academicos do script continuam valendo.

## Rollup e limitacoes

- os testes nao substituem observabilidade real
- Kafka e validado indiretamente via criacao de triagem e aparicao da notificacao
- resultados dependem da maquina local, do cluster e do estado do ambiente
- o workflow do GitHub foi mantido manual para evitar carga involuntaria em ambientes compartilhados
