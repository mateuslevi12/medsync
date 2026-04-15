# MedSync - 2a Entrega (Computacao Distribuida)

Plataforma Distribuida de Gestao Hospitalar - versao funcional inicial para demonstracao academica.

- Projeto: MedSync
- Aluno: Mateus Levi Alencar
- Matricula: 2310315
- Disciplina: Computacao Distribuida

## Visao Geral
Esta entrega implementa o primeiro fluxo funcional do MedSync com foco em:

- API Gateway como ponto unico de entrada
- Cadastro de usuarios
- Autenticacao com JWT
- Cadastro e consulta de pacientes
- Frontend em Next.js consumindo apenas o gateway

Escopo proposital desta fase:

- Inclui: `api-gateway`, `users-service`, `auth-service`, `patients-service`, frontend inicial
- Preparado para evolucao futura: Kafka, prontuario, triagem, notificacoes, observabilidade

## Arquitetura Desta Entrega
### Componentes
- **Frontend (`frontend/medsync-web`)**: Next.js (App Router, TypeScript)
- **API Gateway (`backend/api-gateway`)**: Spring Cloud Gateway
- **Users Service (`backend/users-service`)**: cadastro/listagem de usuarios (com seed ADMIN)
- **Auth Service (`backend/auth-service`)**: login, emissao de JWT e endpoint `/api/auth/me`
- **Patients Service (`backend/patients-service`)**: CRUD completo de pacientes (create/list/get/update/delete) com busca por nome e CPF
- **Bancos**:
  - PostgreSQL `users_db` (usuarios)
  - PostgreSQL `patients_db` (pacientes)

### Decisao tecnica adotada
O **gateway foi antecipado** nesta entrega para centralizar rotas e integração com frontend.

Fluxo principal:
1. Frontend envia login para `/api/auth/login` via gateway
2. Auth valida credenciais consultando users-service (endpoint interno protegido por token interno)
3. Auth gera JWT
4. Frontend usa JWT para acessar `/api/patients/**` e `/api/users/**` via gateway
5. Users-service e patients-service validam JWT localmente com mesma chave secreta

## Servicos Implementados
### API Gateway
Rotas:
- `/api/auth/**` -> `auth-service`
- `/api/users/**` -> `users-service`
- `/api/patients/**` -> `patients-service`

Tambem possui CORS para `http://localhost:3000`.

### Users Service
Endpoints:
- `POST /api/users` (ADMIN)
- `GET /api/users` (ADMIN)
- `GET /api/users/{id}` (ADMIN)

Recursos:
- Entidade `User` com `id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`
- `email` unico
- senha com hash BCrypt
- seed de usuario ADMIN

### Auth Service
Endpoints:
- `POST /api/auth/login`
- `GET /api/auth/me`

Recursos:
- valida email/senha
- gera JWT
- retorna token e dados basicos do usuario

### Patients Service
Endpoints:
- `POST /api/patients`
- `GET /api/patients` (com filtros opcionais `?name=` e `?cpf=`)
- `GET /api/patients/{id}`
- `GET /api/patients/cpf/{cpf}`
- `PUT /api/patients/{id}`
- `DELETE /api/patients/{id}`

Recursos:
- Entidade `Patient` com campos iniciais da modelagem
- validacoes de campos obrigatorios
- `documentNumber` unico
- seed de pacientes para demo

### Frontend (Next.js)
Paginas:
- `/login`
- `/patients`
- `/patients/new`
- `/patients/[id]`

Recursos:
- login com email/senha
- armazenamento simples do token (localStorage) para demo academica
- listagem de pacientes
- busca de pacientes por nome e CPF
- cadastro de paciente
- edicao de paciente
- exclusao de paciente
- visualizacao basica de paciente
- consumo exclusivo do gateway via `NEXT_PUBLIC_GATEWAY_URL`

## Portas
- Frontend: `3000`
- API Gateway: `8080`
- Auth Service: `8081`
- Users Service: `8082`
- Patients Service: `8083`
- PostgreSQL users: `5433`
- PostgreSQL patients: `5434`
- Kafka (opcional): `9092` (com profile `kafka`)

## Credenciais Iniciais de Teste
Usuario ADMIN (seed):
- Email: `admin@medsync.com`
- Senha: `admin123`
- Role: `ADMIN`

## Como Rodar
### 1. Subir ambiente completo com Docker Compose
```bash
docker-compose up -d --build
```

Opcional para subir tambem Kafka/Zookeeper:
```bash
docker-compose --profile kafka up -d --build
```

### 2. Verificar containers
```bash
docker-compose ps
```

### 3. Acessar frontend
- URL: [http://localhost:3000](http://localhost:3000)

### 4. Fluxo de demo sugerido
1. Abrir `/login`
2. Entrar com `admin@medsync.com / admin123`
3. Ir para lista de pacientes
4. Cadastrar novo paciente
5. Visualizar detalhes de paciente

## Variaveis de Ambiente
Arquivo de exemplo na raiz:
- `.env.example`

Principais variaveis:
- `JWT_SECRET`
- `INTERNAL_SERVICE_TOKEN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

No frontend:
- `NEXT_PUBLIC_GATEWAY_URL`

## Estrutura do Repositorio
```text
medsync/
├── backend/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── users-service/
│   └── patients-service/
├── frontend/
│   └── medsync-web/
├── infra/
│   ├── postgres/
│   └── kafka/
├── docs/
├── scripts/
├── docker-compose.yml
└── README.md
```

## Decisoes Tecnicas Alternativas (Registradas)
- **Validacao de JWT nos servicos de dominio** (users e patients), em vez de validar no gateway.
  - Motivo: simplicidade e clareza para demonstracao academica nesta fase.
- **Integracao auth -> users via endpoint interno protegido por token de servico**.
  - Motivo: manter users como fonte de verdade de identidade sem duplicar tabela de usuarios no auth.

## Limitacoes Propositais (Proxima Entrega)
- Prontuario, triagem e notificacoes ainda nao implementados
- Kafka apenas preparado/opcional no compose
- Sem refresh token
- Sem controle avancado de permissoes por recurso
- Sem observabilidade (Prometheus/Grafana/ELK) operacional

## Comandos Uteis
Parar ambiente:
```bash
docker-compose down
```

Parar e remover volumes (reset banco local):
```bash
docker-compose down -v
```

Subir via script:
```bash
./scripts/setup.sh
```
