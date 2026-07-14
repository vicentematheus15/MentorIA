import jwt from 'jsonwebtoken';

export async function autenticar(req, res, next) {
    const auth = req.headers['authorization']; //extrai o toke completo do header da requisição
    //valida se ele existe e começa com 'Bearer'
    if(!auth || !auth.startsWith('Bearer')){
        return res.status(401).json({erro: 'Token inválido ou ausente'})
    }

    //usa o split para separar o token em um array com 2 itens, usando o espaço como separador e guarda o segundo item (posição 1) na variavel token
    const token = auth.split(' ')[1];

    try {
        //verifica se o token é válido (assinatura e expiração) e retorna o payload decodificado (ex: id e nome do usuário)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // adiciona os dados do usuário na requisição para uso nas próximas etapas
        req.usuario = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
}