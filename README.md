# SIGAP Backend

API REST do SIGAP - Sistema de Gestao de Achados e Perdidos.

## Tecnologias

- Node.js
- Express
- PostgreSQL via Supabase
- JWT
- bcrypt
- multer
- cors
- helmet

## Como rodar

```bash
npm install
npm run dev
```

Servidor local:

```text
http://localhost:3000
```

## Rotas principais

```text
POST   /api/auth/login
POST   /api/auth/register
GET    /api/itens
POST   /api/itens
PUT    /api/itens/:id
DELETE /api/itens/:id
```

As rotas de itens estao abertas para demonstracao. A autenticacao JWT esta implementada e pronta para ser aplicada quando necessario.

## Filtros

```text
GET /api/itens?nome=chave
GET /api/itens?categoria=documentos
GET /api/itens?status=achado
```

## Usuario padrao

```text
Email: jhonathans@ifma.edu.br
Senha: 123456
Role: super
```

O banco cria automaticamente as tabelas e o usuario padrao ao iniciar a API.
