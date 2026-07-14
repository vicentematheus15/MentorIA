import 'dotenv/config';
import {GoogleGenAI} from '@google/genai';

import {Avaliacao_diagnostica} from '../models/avaliacao.model';


dotenv.config();

export const gerar = async (req, res) => {
    try {
        const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY})
        const {tipo, dificuldade} = req.body;

        const trilha = {

        }

        res.status(200).json({
            mensagem: "Avaliação criada com sucesso",
            avaliação: novaAvaliação.text, 
        })
    } catch (error) {
        console.error("Erro ao criar avaliação");
        
    }
}