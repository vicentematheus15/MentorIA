import {GoogleGenAI} from '@google/genai';

// o SDK busca a chave automaticamente em process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({apiKey: '' })

async function gerarTexto() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash', //o modelo ideal para tarefas rápidas
            contents:
            'Me de 3 ideias de projetos criativos para treinar JavaScript.'
        });
        
        console.log("Resposta do Gemini:");
        console.log(response.text);
        
    } catch (error) {
        console.error("Erro ao chamar a API:", error);
    }
}

gerarTexto();

