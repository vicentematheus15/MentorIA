import { Usuario } from "../models/usuario.model.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function cadastrar(req, res){
    try {
        const {nome, email, senha} = req.body;
        
        //verifica se já existe algum usuário com esse email
        const emailExiste = await Usuario.findOne({where: { email } });
        if(emailExiste){
            return res.status(409).json({erro: 'E-mail já cadastrado'})
        }
        //criptografa senha
        const senhaHash = await bcrypt.hash(senha, 10);
        //cria novo usuario e insere no banco
        const novoUsuario = await Usuario.create({
            nome: nome,
            email: email,
            senha: senhaHash
        });
        //responde a requisição mostrando id, nome, email e data de criação do usuario
        return res.status(201).json({
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            createdAt: novoUsuario.createdAt    
        })
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
}

export async function login(req, res) {
    try {
        const {email, senha} = req.body;
        
        //valida se existe um usuario com o email informado no banco
        const usuario = await Usuario.findOne({where: { email }})
        if(!usuario){
            return res.status(401).json({erro: 'Dados inválidos'})
        }
        //valida se a conta esta desativada
        if(usuario.ativo === false){
            return res.status(403).json({erro: 'Conta desativada'})
        }
        //valida a senha do usuario, comparando o que foi digitado com a senha criptografada no banco
        const validandoSenha = await bcrypt.compare(senha, usuario.senha);
        if(!validandoSenha){
            return res.status(401).json({erro: 'Dados inválidos!'})
        }

        //assina o jwt do usuario para permitir rotas privadas
        const token = jwt.sign(
            {id: usuario.id, nome: usuario.nome},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        );

        res.status(200).json({
            token, 
            usuario: {
                id: usuario.id, 
                nome: usuario.nome, 
                email: usuario.email 
            }});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
}