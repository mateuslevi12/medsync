# ERS - MedSync (2a Entrega)

## 1. Introducao

### 1.1 Finalidade
Definir os requisitos implementados na segunda entrega funcional do MedSync para demonstracao academica.

### 1.2 Escopo
Esta entrega cobre:
- usuarios
- autenticacao JWT
- pacientes
- API Gateway
- frontend inicial

Fora de escopo nesta fase:
- prontuario
- triagem
- notificacoes completas

## 2. Descricao Geral
Sistema distribuido com frontend Next.js e backend em microservicos Spring Boot, acessado via API Gateway.

## 3. Requisitos Funcionais Implementados
- **RF01:** cadastrar usuario (`POST /api/users`) - restrito a ADMIN.
- **RF02:** listar usuarios (`GET /api/users`) - restrito a ADMIN.
- **RF03:** buscar usuario por id (`GET /api/users/{id}`) - restrito a ADMIN.
- **RF04:** autenticar usuario (`POST /api/auth/login`).
- **RF05:** retornar JWT apos login valido.
- **RF06:** retornar dados do usuario autenticado (`GET /api/auth/me`).
- **RF07:** cadastrar paciente (`POST /api/patients`).
- **RF08:** listar pacientes (`GET /api/patients`) com filtros por nome e CPF.
- **RF09:** buscar paciente por id (`GET /api/patients/{id}`).
- **RF10:** buscar paciente por CPF (`GET /api/patients/cpf/{cpf}`).
- **RF11:** atualizar paciente (`PUT /api/patients/{id}`).
- **RF12:** excluir paciente (`DELETE /api/patients/{id}`).
- **RF13:** frontend com tela de login.
- **RF14:** frontend com listagem e busca de pacientes.
- **RF15:** frontend com cadastro, edicao, exclusao e visualizacao basica de paciente.

## 4. Requisitos Nao Funcionais
- **RNF01:** arquitetura de microservicos.
- **RNF02:** Java 17+ e Spring Boot.
- **RNF03:** frontend em Next.js + TypeScript.
- **RNF04:** autenticacao via JWT.
- **RNF05:** usuarios e pacientes em bancos PostgreSQL separados.
- **RNF06:** execucao local via Docker Compose.
- **RNF07:** frontend deve consumir backend somente via gateway.
- **RNF08:** validacoes de entrada em DTOs.
- **RNF09:** tratamento global de excecoes em cada servico.
- **RNF10:** seeds minimos para demo academica.
- **RNF11:** estrutura preparada para evolucao com Kafka.

## 5. Regras de Negocio
- **RN01:** paciente nao possui login nesta versao.
- **RN02:** somente usuarios autenticados acessam rotas protegidas.
- **RN03:** cadastro e consulta de usuarios restritos a ADMIN.
- **RN04:** role de usuario e obrigatoria.
- **RN05:** email de usuario deve ser unico.
- **RN06:** senha deve ser armazenada com hash.
- **RN07:** cadastro de paciente exige campos obrigatorios.
- **RN08:** `documentNumber` do paciente deve ser unico.

## 6. Atores
- **Administrador (ADMIN)**
- **Profissional de Saude (HEALTH_PROFESSIONAL)**
- **Recepcionista (RECEPTIONIST)**

## 7. Casos de Uso Principais
- **UC01:** Login no sistema.
- **UC02:** Cadastrar usuario.
- **UC03:** Listar usuarios.
- **UC04:** Consultar usuario por id.
- **UC05:** Listar pacientes.
- **UC06:** Cadastrar paciente.
- **UC07:** Consultar paciente por id.
- **UC08:** Consultar paciente por CPF.
- **UC09:** Atualizar paciente.
- **UC10:** Excluir paciente.

## 8. Modelo de Dados (Entidades desta Entrega)
### 8.1 User
- id
- name
- email
- password
- role
- createdAt
- updatedAt

### 8.2 Patient
- id
- fullName
- birthDate
- gender
- phone
- documentNumber
- address
- createdAt
- updatedAt

## 9. Glossario
- **API Gateway:** camada de entrada unica para roteamento.
- **JWT:** token assinado para autenticacao stateless.
- **DTO:** objeto de transferencia para requests/responses.
- **Seed:** dados iniciais inseridos automaticamente na inicializacao.
