# Painel MedSync (Next.js + TypeScript + Tailwind)

Interface em Next.js com TypeScript e Tailwind para demonstrar os endpoints do backend via API Gateway.

## Funcionalidades

- Tela de login (`/login`)
- Rotas protegidas com validação de sessão
- Sidebar de navegação
- Fila de espera (`/fila-espera`) com listagem e CRUD de pacientes
  - Inclusão via dialog/modal
  - Edição e exclusão na tela
- Usuários do sistema (`/usuarios`) com listagem e CRUD de usuários
  - Inclusão via dialog/modal
  - Edição e exclusão na tela

## Rodar com Docker Compose

Na raiz do projeto:

```bash
docker-compose up -d --build
```

Abrir: [http://localhost:3000](http://localhost:3000)

Credenciais seed:

- `admin@medsync.com`
- `admin123`
