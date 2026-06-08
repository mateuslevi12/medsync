# Frontend MedSync

## Visao geral

O frontend em `frontend/medsync-web` preserva o redesign aprovado e opera em dois modos:

- `API mode`: consome os microservices reais via API Gateway
- `demo mode`: usa dados demo/localStorage para manter navegacao e apresentacao mesmo sem backend disponivel

O shell protegido continua centralizado em:

- `components/app-shell.tsx`
- `components/medsync-primitives.tsx`
- `app/globals.css`
- `lib/medsync-demo.ts`

## Rotas principais

Rotas com dados reais em primeiro plano:

- `/dashboard`
- `/monitoramento`
- `/relatorios`
- `/fila-atendimento`
- `/acolhimento/[id]`
- `/atendimento-medico/[id]`
- `/patients`
- `/patients/[id]`
- `/patients/[id]/record`
- `/patients/[id]/timeline`
- `/notificacoes`

Rotas mantidas no mesmo padrao visual:

- `/ambulatorial`
- `/usuarios`
- `/configuracoes`

## Services

Os acessos HTTP e o fallback foram organizados em:

- `services/ambulatory.ts`
- `services/patients.ts`
- `services/triage.ts`
- `services/medical-records.ts`
- `services/notifications.ts`
- `services/runtime.ts`

Regras:

- `NEXT_PUBLIC_DEMO_MODE=true`: usa dados demo
- `NEXT_PUBLIC_DEMO_MODE=false`: usa API real
- se a sessao estiver invalida, o layout protegido limpa a sessao e volta para `/login`
- se uma tela analitica falhar com demo desligado, a UI exibe banner de erro explicito

## Fluxo integrado

### Fila de atendimento

- lista `GET /api/ambulatory/queue`
- inclui paciente existente ou cria paciente e depois insere em `POST /api/ambulatory/queue`
- chama acolhimento com `PATCH /api/ambulatory/queue/{id}/call-triage`
- chama atendimento medico com `PATCH /api/ambulatory/queue/{id}/call-medical`

### Acolhimento

- carrega `GET /api/ambulatory/queue/{id}`
- sincroniza alergias e vacinas no `patients-service`
- conclui acolhimento com `PATCH /api/ambulatory/queue/{id}/complete-triage`

### Atendimento medico

- carrega `GET /api/ambulatory/queue/{id}`
- finaliza com `PATCH /api/ambulatory/queue/{id}/finish-medical`
- redireciona para o prontuario do paciente

### Prontuario e timeline

- prontuario: `GET /api/medical-records/patient/{patientId}`
- timeline: `GET /api/medical-records/patient/{patientId}/timeline`
- resumo analitico: `GET /api/medical-records/summary`

## Telas analiticas

### Dashboard

Combina:

- pacientes
- fila ambulatorial
- notificacoes
- resumo do prontuario em MongoDB

### Monitoramento

Combina:

- status hospitalar da fila
- distribuicao de risco
- resumo tecnico do `medical-record-service`, MongoDB e observabilidade

### Relatorios

Exibe cards de resumo com dados reais para:

- pacientes
- triagens
- atendimentos
- notificacoes
- vacinas pendentes
- alergias registradas

Observacao:

- os botoes `Gerar` ainda sao placeholders visuais

## Preservacao visual

O layout aprovado foi mantido:

- sidebar fixa
- topbar com breadcrumb, unidade, notificacoes e avatar
- fundo cinza claro
- cards brancos com borda suave
- botoes azuis
- tabela limpa
- modal de inclusao em etapas
- acolhimento em duas colunas
- atendimento medico com painel lateral de acoes

## Limitacoes atuais

- o fallback demo continua necessario para apresentacao offline
- exportacoes reais de relatorios ainda nao foram conectadas
- o fluxo legado `/api/triage` segue existente para compatibilidade com etapas anteriores
