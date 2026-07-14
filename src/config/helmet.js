import helmet from 'helmet';


export const helmetConfig = helmet({

// impede incorporação em iframes de outros domínios
    frameguard: { action: 'deny' },

// remove o cabeçalho X-Powered-By: Express
    hidePoweredBy: true,

// impede MIME sniffing
    noSniff: true,

// força HTTPS por 1 ano (só em produção com SSL)
    hsts: {
        maxAge: 31536000, // 1 ano em segundos
        includeSubDomains: true,
    },

// política de referrer
    referrerPolicy: { policy: 'no-referrer' },

// Content-Security-Policy — para APIs REST, pode ser false
// pois não servimos HTML. Para apps full-stack, configure.
    contentSecurityPolicy: false,
});
