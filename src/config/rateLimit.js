import rateLimit from 'express-rate-limit';

//========CONFIGURANDO LIMITES GLOBAIS ==============//
export const limitadorGlobal = rateLimit({
    windowMs: 15*60*1000, //janela de tempo para fazer algo
    max: 100, //numero maximo de requisições por IP
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true, //envia o RateLimit-* nos headers
    legacyHeaders: false //desativa o X-RateLimit-* antigo
});

//Confgurando limite na rota POST '/auth/cadastro'
export const limitadorCadastro = rateLimit({
    windowMs: 15*60*1000, //janela de tempo para fazer algo
    max: 100, //numero maximo de requisições por IP
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true, //envia o RateLimit-* nos headers
    legacyHeaders: false //desativa o X-RateLimit-* antigo
});

//Confgurando limite na rota POST '/auth/login'
export const limitadorLogin = rateLimit({
    windowMs: 15*60*1000, //janela de tempo para fazer algo
    max: 100, //numero maximo de requisições por IP
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true, //envia o RateLimit-* nos headers
    legacyHeaders: false //desativa o X-RateLimit-* antigo
});

//Confgurando limite na rota privada GET '/usuario/perfil'
export const limitadorGetPerfil = rateLimit({
    windowMs: 15*60*1000, //janela de tempo para fazer algo
    max: 50, //numero maximo de requisições por IP
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true, //envia o RateLimit-* nos headers
    legacyHeaders: false //desativa o X-RateLimit-* antigo
});

//Confgurando limite na rota privada PUT '/usuario/perfil'
export const limitadorPutPerfil = rateLimit({
    windowMs: 15*60*1000, //janela de tempo para fazer algo
    max: 50, //numero maximo de requisições por IP
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true, //envia o RateLimit-* nos headers
    legacyHeaders: false //desativa o X-RateLimit-* antigo
});

//Confgurando limite na rota privada DELETE '/usuario/conta'
export const limitadorDeleteConta = rateLimit({
    windowMs: 15*60*1000, //janela de tempo para fazer algo
    max: 50, //numero maximo de requisições por IP
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true, //envia o RateLimit-* nos headers
    legacyHeaders: false //desativa o X-RateLimit-* antigo
});

//Confgurando limite na rota privada GET '/planos'
export const limitadorListarPlanos = rateLimit({
    windowMs: 15*60*1000,
    max: 50,
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true,
    legacyHeaders: false
});
 
//Confgurando limite na rota privada POST '/planos/diagnostica'
//limite mais baixo: gera conteúdo via IA (Groq), diferente das rotas que só tocam o banco
export const limitadorGerarDiagnostica = rateLimit({
    windowMs: 15*60*1000,
    max: 10,
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true,
    legacyHeaders: false
});
 
//Confgurando limite na rota privada POST '/planos/:id/progresso'
//mesmo motivo do limitador acima: chamada de IA
export const limitadorGerarProgresso = rateLimit({
    windowMs: 15*60*1000,
    max: 10,
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true,
    legacyHeaders: false
});
 
//Confgurando limite na rota privada POST '/planos/:id/diagnostica/enviar'
export const limitadorEnviarDiagnostica = rateLimit({
    windowMs: 15*60*1000,
    max: 50,
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true,
    legacyHeaders: false
});
 
//Confgurando limite na rota privada POST '/planos/:id/progresso/enviar'
export const limitadorEnviarProgresso = rateLimit({
    windowMs: 15*60*1000,
    max: 50,
    statusCode: 429,
    message: {
        erro: 'Muitas requisições por minuto'
    },
    standardHeaders: true,
    legacyHeaders: false
});