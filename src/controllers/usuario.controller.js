import { Usuario } from "../models/usuario.model.js";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";


export async function perfil(req, res){
    try {
        //busca o usuário logado pela id que está na requisição e exclui o atributo senha da resposta
        const usuario = await Usuario.findByPk(req.usuario.id, { attributes: { exclude: ['senha'] } });
        //responde com os dados do usuario, menos a senha
        return res.status(200).json(usuario)
    
    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
}

export async function atualizarPerfil(req, res){
    try {
        const {nome, email, senha} = req.body;

        const usuario = await Usuario.findByPk(req.usuario.id);
        if(!usuario){
            return res.status(404).json({ erro: 'Usuário não encontrado' })
        }
        if(usuario.ativo === false){
            return res.status(403).json({erro: 'Conta desativada'})
        }
        //cria um objeto vazio para inserir todos os dados que tem que atualizar (vieram no req.body)
        const dadosAtualizar = {};
        //se nome, email ou senha existirem (significa que foram extraídos da requisição), entao devem ser alterados. isso funciona independente de qual ou quais deles foram passados no body, pois so vai entrar no if e adicionar na variavel de dados para atualizar o que for extraído do req.body
        if(nome){
            dadosAtualizar.nome = nome;
        }
        if(email){
            const emailExiste = await Usuario.findOne({where: { email } });
            //verifica se o novo email que o usuario esta tentando usar já existe (com excessão dele mesmo, 'usuario.id')
            if(emailExiste && emailExiste.id !== usuario.id){
                return res.status(409).json({erro: 'E-mail já cadastrado'})
            }
            dadosAtualizar.email = email;
        }
        if(senha){
            const senhaHash = await bcrypt.hash(senha, 10);
            dadosAtualizar.senha = senhaHash;
        }

        //atualiza os dados que foram extraídos na requisição e foram iseridos no objeto 'dadosAtualizar' 
        await usuario.update(dadosAtualizar);

        //remove senha da resposta da requisição
        const usuarioAtualizado = await Usuario.findByPk(req.usuario.id, {attributes: {exclude: ['senha'] }
        });

        return res.status(200).json(usuarioAtualizado)
    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
}

export async function desativarConta(req, res) {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id);
        if(!usuario){
            return res.status(404).json({ erro: 'Usuário não encontrado' })
        }
        await usuario.update({ ativo: false }) 
        return res.status(204).send(); 
    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
}