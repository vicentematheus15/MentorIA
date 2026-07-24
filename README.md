# 🎓 MentorIA API

API REST desenvolvida em **Node.js** para geração de trilhas de aprendizagem personalizadas utilizando Inteligência Artificial.

O sistema permite que um usuário realize uma avaliação diagnóstica, tenha seu nível de conhecimento identificado automaticamente e receba avaliações de progresso adaptadas ao seu desempenho, proporcionando uma experiência de aprendizagem personalizada.

---

## 🚀 Funcionalidades

### 👤 Autenticação
- Cadastro de usuários
- Login utilizando JWT
- Rotas protegidas
- Atualização de perfil
- Desativação de conta

### 📚 Planos de Aprendizagem
- Criação automática de planos de estudo
- Associação de planos aos usuários
- Controle de progresso
- Histórico de planos gerados

### 📝 Avaliação Diagnóstica
- Geração automática de questões com IA
- Questões separadas por níveis:
  - Iniciante
  - Intermediário
  - Avançado
- Correção automática
- Classificação do nível do aluno

### 📈 Avaliação de Progresso
- Geração dinâmica conforme o desempenho
- Correção automática
- Atualização do nível do usuário
- Evolução contínua da aprendizagem

### 🤖 Inteligência Artificial
- Integração com a API da Groq
- Geração automática de avaliações
- Respostas estruturadas em JSON
- Personalização do conteúdo conforme o nível do aluno

---

# 🛠 Tecnologias Utilizadas

## Backend

- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL

## Segurança

- JWT (JSON Web Token)
- BcryptJS
- Helmet
- CORS
- Express Rate Limit

## Validação

- Zod

## Inteligência Artificial

- Groq SDK
- GPT-OSS

---

# 📂 Estrutura do Projeto

```text
src
├── config
├── controllers
├── database
├── middlewares
├── models
├── routes
├── schemas
├── utils
├── data
├── app.js
└── server.js
```

---

# 🗄 Banco de Dados

## Usuário

| Campo | Tipo |
|-------|------|
| id | Integer |
| nome | String |
| email | String |
| senha | String |
| ativo | Boolean |

---

## Plano

| Campo | Tipo |
|-------|------|
| id | Integer |
| usuarioId | Integer |
| trilhaTitulo | String |
| nivel | String |
| status | String |

Status possíveis:

- diagnostico_gerado
- diagnostico_corrigido
- progresso_gerado
- progresso_corrigido

---

## Avaliação

| Campo | Tipo |
|-------|------|
| id | Integer |
| planoId | Integer |
| enunciado | Text |
| opcoes | JSON |
| gabarito | String |
| topico | String |
| habilidade | String |
| dificuldade | String |
| tipo | String |

Tipos:

- diagnostica
- progresso

---

# 🔗 Relacionamentos

```text
Usuário
   │ 1:N
   ▼
Plano
   │ 1:N
   ▼
Avaliação
```

- Um usuário pode possuir vários planos.
- Um plano possui diversas avaliações.
- Cada avaliação pertence a um único plano.

---

# ⚙️ Instalação

## Clone o projeto

```bash
git clone https://github.com/vicentematheus15/mentorIA-api.git

cd mentorIA-api
```

## Instale as dependências

```bash
npm install
```

## Configure o arquivo `.env`

```env
API_PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=mentoria
DB_USER=postgres
DB_PASSWORD=senha

JWT_SECRET=sua_chave_jwt

GROQ_API_KEY=sua_chave_groq
```

## Execute a aplicação

```bash
npm start
```

Servidor disponível em:

```
http://localhost:3000
```

---

# 📡 Endpoints

## Autenticação

### Cadastro

```http
POST /auth/cadastro
```

### Login

```http
POST /auth/login
```

---

## Usuário

### Perfil

```http
GET /usuario/perfil
```

### Atualizar perfil

```http
PUT /usuario/perfil
```

### Desativar conta

```http
DELETE /usuario/conta
```

---

## Planos

### Listar planos

```http
GET /planos
```

### Gerar avaliação diagnóstica

```http
POST /planos/diagnostica
```

### Enviar respostas da diagnóstica

```http
POST /planos/:id/diagnostica/enviar
```

### Gerar avaliação de progresso

```http
POST /planos/:id/progresso
```

### Enviar respostas da avaliação de progresso

```http
POST /planos/:id/progresso/enviar
```

---

# 🔒 Segurança

- Senhas criptografadas com Bcrypt
- Autenticação JWT
- Helmet para proteção de cabeçalhos HTTP
- Controle de CORS
- Rate Limiting
- Validação de dados utilizando Zod
- Middleware de autenticação para rotas privadas

---

# 🔄 Fluxo da Aplicação

```text
Cadastro/Login
      │
      ▼
Gerar Avaliação Diagnóstica
      │
      ▼
Responder Questões
      │
      ▼
Correção Automática
      │
      ▼
Definição do Nível
      │
      ▼
Plano de Aprendizagem
      │
      ▼
Avaliações de Progresso
      │
      ▼
Evolução Contínua
```

# 👨‍💻 Autor

**Matheus Vicente**

- LinkedIn: https://linkedin.com/in/matheus-vicente
- GitHub: https://github.com/vicentematheus15

---

## 📄 Licença

Este projeto está licenciado sob a licença ISC.
