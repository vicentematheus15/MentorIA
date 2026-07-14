<div align="center">

# 🔐 Sistema de Autenticação REST API

### API RESTful completa de autenticação e gerenciamento de usuários com segurança em produção

[![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?style=flat-square&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](https://opensource.org/licenses/ISC)

</div>

---

## 📌 Sobre o Projeto

API REST de autenticação e gerenciamento de perfil de usuários, construída com Node.js, Express 5 e PostgreSQL via Sequelize ORM. O sistema implementa um fluxo completo de identidade digital: **cadastro → login → acesso autenticado → edição de perfil → desativação de conta**, com múltiplas camadas de segurança aplicadas em cada etapa.

O projeto foi desenvolvido com foco em boas práticas de segurança para ambientes de produção, incluindo hash de senhas com bcrypt, autenticação stateless com JWT, proteção de headers HTTP com Helmet, rate limiting por rota e configuração de CORS.

---

## 🛠️ Tecnologias e Dependências

| Pacote | Versão | Função no projeto |
|---|---|---|
| **express** | ^5.2.1 | Framework HTTP; roteamento e middleware pipeline |
| **sequelize** | ^6.37.8 | ORM para mapeamento objeto-relacional com PostgreSQL |
| **pg** + **pg-hstore** | ^8.20.0 | Driver nativo PostgreSQL + serialização de tipos hstore |
| **bcryptjs** | ^3.0.3 | Hash de senhas com salt rounds configurável |
| **jsonwebtoken** | ^9.0.3 | Geração e verificação de tokens JWT (HS256) |
| **helmet** | ^8.1.0 | Conjunto de middlewares de segurança para headers HTTP |
| **cors** | ^2.8.6 | Controle de Cross-Origin Resource Sharing |
| **express-rate-limit** | ^8.5.0 | Limitação de requisições por IP e por rota |
| **dotenv** | ^17.4.2 | Carregamento de variáveis de ambiente do arquivo `.env` |

> O projeto usa **ES Modules** nativos (`"type": "module"` no `package.json`), utilizando `import/export` em todos os arquivos.

---

## 📁 Estrutura do Projeto

```
projeto-integrador/
├── src/
│   ├── app.js                    # Ponto de entrada: configura middlewares e inicia o servidor
│   ├── config/
│   │   ├── cors.js               # Configuração de origens, métodos e headers permitidos
│   │   ├── helmet.js             # Configuração de 5 diretivas de segurança HTTP
│   │   └── rateLimit.js          # 6 limitadores de requisição (1 global + 5 por rota)
│   ├── controllers/
│   │   ├── auth.controller.js    # Lógica de cadastro e login
│   │   └── usuario.controller.js # Lógica de perfil, atualização e desativação
│   ├── database/
│   │   └── database.js           # Instância Sequelize com configuração via variáveis de ambiente
│   ├── middlewares/
│   │   └── auth.middleware.js    # Validação e decodificação do token JWT
│   ├── models/
│   │   └── usuario.model.js      # Definição da tabela `usuarios` com validações nativas
│   └── routes/
│       ├── auth.routes.js        # Rotas públicas: POST /cadastro e POST /login
│       └── usuario.routes.js     # Rotas privadas: GET/PUT /perfil e DELETE /conta
├── .env.example                  # Template das variáveis de ambiente necessárias
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Arquitetura e Decisões Técnicas

### Padrão MVC

O projeto separa responsabilidades em três camadas:

- **Model** (`usuario.model.js`) — define o schema da tabela, tipos de dados, restrições e validações. Não contém lógica de negócio.
- **Controller** (`auth.controller.js`, `usuario.controller.js`) — recebe a requisição, executa a regra de negócio, chama o model e devolve a resposta com o status HTTP correto.
- **Routes** (`auth.routes.js`, `usuario.routes.js`) — conecta as URLs aos controllers e define quais middlewares de segurança são aplicados em cada rota antes de chegar ao controller.

### Fluxo de middlewares no `app.js`

```
Requisição recebida
       ↓
   CORS check         ← rejeita origens não permitidas
       ↓
  Helmet headers      ← injeta headers de segurança HTTP
       ↓
 Rate Limit Global    ← bloqueia IP com > 100 req / 15min
       ↓
  JSON body parser    ← converte o body da requisição
       ↓
   Router /auth ou /usuario
       ↓
 Rate Limit da rota   ← limite específico por endpoint
       ↓
 Auth Middleware      ← (somente rotas privadas) valida JWT
       ↓
    Controller        ← executa a lógica de negócio
       ↓
   Resposta HTTP
```

### Banco de dados com `sync({ alter: true })`

O Sequelize é iniciado com `sequelize.sync({ alter: true })`, que compara o modelo definido no código com a tabela existente no banco e aplica apenas as diferenças necessárias. O servidor HTTP só é iniciado após a sincronização ser concluída, garantindo que a API nunca responda antes do banco estar pronto.

---

## 🔑 Funcionalidades

### Rotas Públicas — `/auth`

#### `POST /auth/cadastro`
Registra um novo usuário no sistema.

**Validações aplicadas:**
1. Verifica se `nome`, `email` e `senha` estão presentes no body (retorna `400` se não).
2. Consulta o banco com `Usuario.findOne({ where: { email } })` — retorna `409` se o e-mail já existir.
3. Gera o hash da senha com `bcrypt.hash(senha, 10)` (10 salt rounds).
4. Persiste o registro com `Usuario.create(...)`.
5. Retorna `201` com `id`, `nome`, `email` e `createdAt` — **a senha nunca é exposta na resposta**.

**Body esperado:**
```json
{
  "nome": "Ana Silva",
  "email": "ana@email.com",
  "senha": "minhasenha123"
}
```

**Resposta de sucesso (`201`):**
```json
{
  "id": 1,
  "nome": "Ana Silva",
  "email": "ana@email.com",
  "createdAt": "2025-01-15T14:30:00.000Z"
}
```

**Respostas de erro:**

| Status | Condição |
|---|---|
| `400` | `nome`, `email` ou `senha` ausentes no body |
| `409` | E-mail já cadastrado no banco |
| `500` | Erro interno do servidor |

---

#### `POST /auth/login`
Autentica um usuário e retorna o token JWT.

**Validações aplicadas:**
1. Verifica presença de `email` e `senha` no body (`400` se ausentes).
2. Busca o usuário por e-mail com `Usuario.findOne({ where: { email } })` — retorna `401` genérico se não encontrado (evita enumeração de usuários).
3. Verifica se `usuario.ativo === false` — retorna `403` para contas desativadas.
4. Compara a senha digitada com o hash salvo usando `bcrypt.compare(senha, usuario.senha)` — retorna `401` genérico se inválida.
5. Assina o JWT com `jwt.sign({ id, nome }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })`.
6. Retorna `200` com o token e dados básicos do usuário.

> **Decisão de segurança:** tanto "usuário não encontrado" quanto "senha incorreta" retornam o mesmo status `401` com mensagem genérica `"Dados inválidos"`. Isso evita que um atacante consiga confirmar se um e-mail está cadastrado no sistema.

**Body esperado:**
```json
{
  "email": "ana@email.com",
  "senha": "minhasenha123"
}
```

**Resposta de sucesso (`200`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "Ana Silva",
    "email": "ana@email.com"
  }
}
```

**Respostas de erro:**

| Status | Condição |
|---|---|
| `400` | `email` ou `senha` ausentes |
| `401` | E-mail não encontrado ou senha incorreta |
| `403` | Conta desativada (soft delete) |
| `500` | Erro interno do servidor |

---

### Rotas Privadas — `/usuario`

Todas as rotas abaixo exigem o header `Authorization: Bearer <token>`. O middleware `autenticar` é executado antes de qualquer controller e bloqueia a requisição com `401` se o token for inválido, ausente ou expirado.

#### `GET /usuario/perfil`
Retorna os dados do usuário autenticado.

O middleware injeta `req.usuario` com o payload do token (`{ id, nome }`). O controller busca o usuário no banco com `Usuario.findByPk(req.usuario.id, { attributes: { exclude: ['senha'] } })`, garantindo que o hash da senha nunca seja retornado.

**Resposta de sucesso (`200`):**
```json
{
  "id": 1,
  "nome": "Ana Silva",
  "email": "ana@email.com",
  "ativo": true,
  "createdAt": "2025-01-15T14:30:00.000Z",
  "updatedAt": "2025-01-15T14:30:00.000Z"
}
```

---

#### `PUT /usuario/perfil`
Atualiza parcialmente os dados do usuário autenticado.

Implementa atualização parcial (PATCH-like): apenas os campos enviados no body são alterados. A lógica constrói um objeto `dadosAtualizar = {}` e adiciona cada campo somente se ele estiver presente na requisição.

**Fluxo de validação:**
1. Busca o usuário pelo `id` do token.
2. Verifica se a conta está ativa (`ativo === false` retorna `403`).
3. Se `nome` veio no body → adiciona ao objeto de atualização.
4. Se `email` veio no body → verifica duplicidade no banco, **excluindo o próprio usuário da busca** (`emailExiste.id !== usuario.id`) para não bloquear o usuário de manter seu próprio e-mail.
5. Se `senha` veio no body → aplica novo `bcrypt.hash(novaSenha, 10)` antes de salvar.
6. Executa `usuario.update(dadosAtualizar)`.
7. Busca novamente com `exclude: ['senha']` e retorna `200`.

**Body (todos os campos são opcionais):**
```json
{
  "nome": "Ana Costa",
  "email": "ana.costa@email.com",
  "senha": "novasenha456"
}
```

**Respostas de erro:**

| Status | Condição |
|---|---|
| `403` | Conta desativada |
| `404` | Usuário não encontrado |
| `409` | Novo e-mail já pertence a outro usuário |
| `500` | Erro interno do servidor |

---

#### `DELETE /usuario/conta`
Desativa a conta do usuário autenticado.

Implementa **soft delete**: em vez de remover o registro do banco, apenas atualiza o campo `ativo` para `false` com `usuario.update({ ativo: false })`. O registro é preservado para fins de auditoria e o usuário não consegue mais fazer login (bloqueado no fluxo do `POST /auth/login`). Retorna `204 No Content` sem body.

> **Por que soft delete?** Manter o registro permite auditoria, recuperação de conta futura e preservação de integridade referencial caso haja dados relacionados ao usuário.

---

## 🛡️ Segurança em Detalhe

### 1. Hash de senhas com bcrypt

```js
// Cadastro — gera hash com fator de custo 10
const senhaHash = await bcrypt.hash(senha, 10);

// Login — compara texto com hash sem expor o hash
const valido = await bcrypt.compare(senha, usuario.senha);
```

O fator de custo `10` significa que o bcrypt realiza 2¹⁰ = 1024 iterações internamente. Isso torna ataques de força bruta computacionalmente inviáveis, mesmo que o banco de dados seja comprometido.

### 2. Autenticação JWT stateless

```js
// Geração no login
jwt.sign(
  { id: usuario.id, nome: usuario.nome },  // payload mínimo
  process.env.JWT_SECRET,                   // segredo via variável de ambiente
  { expiresIn: process.env.JWT_EXPIRES_IN } // expiração configurável (ex: "2h")
);

// Verificação no middleware
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.usuario = decoded; // injeta { id, nome, iat, exp } na requisição
```

O middleware valida o token em três etapas: presença do header `Authorization`, formato `Bearer <token>` (via `startsWith` + `split(' ')[1]`) e assinatura + expiração via `jwt.verify()`. Qualquer falha retorna `401`.

### 3. Helmet — Headers de segurança HTTP

| Diretiva | Configuração | Proteção |
|---|---|---|
| `frameguard` | `action: 'deny'` | Bloqueia incorporação em iframes (anti-clickjacking) |
| `hidePoweredBy` | `true` | Remove o header `X-Powered-By: Express` |
| `noSniff` | `true` | Impede MIME type sniffing pelo navegador |
| `hsts` | `maxAge: 31536000` + `includeSubDomains` | Força HTTPS por 1 ano em todos os subdomínios |
| `referrerPolicy` | `'no-referrer'` | Não envia o header `Referer` em requisições externas |
| `contentSecurityPolicy` | `false` | Desativado (API REST pura, sem HTML) |

### 4. Rate Limiting por rota

Cada rota tem um limitador independente, configurado em `rateLimit.js`:

| Limitador | Rota | Limite | Janela |
|---|---|---|---|
| `limitadorGlobal` | Todas as rotas | 100 req/IP | 15 min |
| `limitadorCadastro` | `POST /auth/cadastro` | 100 req/IP | 15 min |
| `limitadorLogin` | `POST /auth/login` | 100 req/IP | 15 min |
| `limitadorGetPerfil` | `GET /usuario/perfil` | 50 req/IP | 15 min |
| `limitadorPutPerfil` | `PUT /usuario/perfil` | 50 req/IP | 15 min |
| `limitadorDeleteConta` | `DELETE /usuario/conta` | 50 req/IP | 15 min |

Quando o limite é atingido, a API responde `429 Too Many Requests` com `{ "erro": "Muitas requisições por minuto" }`. Os headers `RateLimit-*` são enviados na resposta (`standardHeaders: true`) e os headers legados `X-RateLimit-*` são desativados (`legacyHeaders: false`).

### 5. CORS

```js
export const corsConfig = {
    origin: '*',                               // Em produção: URL do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['contentType', 'Authorization']
};
```

O header `Authorization` é explicitamente listado em `allowedHeaders` para que os tokens JWT possam trafegar nas requisições. Em produção, o `origin: '*'` deve ser substituído pelo domínio exato do frontend.

---

## 🗄️ Model e Banco de Dados

### Definição da tabela `usuarios`

```js
sequelize.define('Usuario', {
    id:    { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome:  { type: DataTypes.STRING,  allowNull: false },
    email: { type: DataTypes.STRING,  allowNull: false, unique: true, validate: { isEmail: true } },
    senha: { type: DataTypes.STRING,  allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'usuarios', timestamps: true });
```

| Campo | Tipo SQL | Restrições |
|---|---|---|
| `id` | INTEGER | PK, auto-incremento |
| `nome` | VARCHAR | NOT NULL |
| `email` | VARCHAR | NOT NULL, UNIQUE, validação de formato via Sequelize |
| `senha` | VARCHAR | NOT NULL — armazena apenas o hash bcrypt |
| `ativo` | BOOLEAN | DEFAULT `true` — controla o soft delete |
| `createdAt` | TIMESTAMP | Gerado automaticamente pelo Sequelize |
| `updatedAt` | TIMESTAMP | Atualizado automaticamente em cada `update()` |

A validação `validate: { isEmail: true }` é executada pelo Sequelize **antes** de qualquer operação no banco, adicionando uma camada de validação no nível da aplicação.

### Conexão com o banco

```js
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: false,   // desativa logs SQL no console
    benchmark: true   // loga o tempo de execução de cada query
});
```

Todas as credenciais são lidas de variáveis de ambiente via `dotenv`. Nenhum valor sensível está hardcoded no código-fonte.

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [PostgreSQL](https://www.postgresql.org/) instalado e em execução

### Passo a passo

**1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/nome-do-repositorio.git
cd nome-do-repositorio
```

**2. Instale as dependências**
```bash
npm install
```

**3. Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
API_PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=login_sistema
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

JWT_SECRET=uma_string_longa_e_aleatoria_de_no_minimo_32_chars
JWT_EXPIRES_IN=2h
```

> ⚠️ **Nunca versione o arquivo `.env`**. Ele já está no `.gitignore`.
>
> Para gerar um `JWT_SECRET` seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

**4. Crie o banco de dados no PostgreSQL**
```sql
CREATE DATABASE login_sistema;
```

A tabela `usuarios` é criada automaticamente pelo `sequelize.sync({ alter: true })` na primeira execução.

**5. Inicie o servidor**
```bash
npm start
```

```
Servidor rodando em http://localhost:3000
```

---

## 📬 Testando a API

Você pode testar com [Insomnia](https://insomnia.rest/), [Postman](https://www.postman.com/) ou `curl`.

### Fluxo completo de exemplo

```bash
# 1. Cadastrar usuário
curl -X POST http://localhost:3000/auth/cadastro \
  -H "Content-Type: application/json" \
  -d '{"nome":"Ana Silva","email":"ana@email.com","senha":"senha123"}'

# 2. Fazer login e copiar o token retornado
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@email.com","senha":"senha123"}'

# 3. Acessar o perfil (substituir TOKEN pelo valor retornado no login)
curl -X GET http://localhost:3000/usuario/perfil \
  -H "Authorization: Bearer TOKEN"

# 4. Atualizar apenas o nome (outros campos são opcionais)
curl -X PUT http://localhost:3000/usuario/perfil \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Ana Costa"}'

# 5. Desativar a conta (soft delete)
curl -X DELETE http://localhost:3000/usuario/conta \
  -H "Authorization: Bearer TOKEN"
```

### Mapa completo de rotas

| Método | Rota | Auth | Rate Limit | Descrição |
|---|---|---|---|---|
| `POST` | `/auth/cadastro` | ❌ Pública | 100 req/15min | Registra novo usuário |
| `POST` | `/auth/login` | ❌ Pública | 100 req/15min | Autentica e retorna JWT |
| `GET` | `/usuario/perfil` | ✅ JWT | 50 req/15min | Retorna dados do usuário logado |
| `PUT` | `/usuario/perfil` | ✅ JWT | 50 req/15min | Atualiza parcialmente o perfil |
| `DELETE` | `/usuario/conta` | ✅ JWT | 50 req/15min | Desativa a conta (soft delete) |

---

## 📄 Licença

Distribuído sob a licença ISC. Veja o arquivo [LICENSE](./LICENSE) para mais informações.
