import Groq from "groq-sdk";
import {Avaliacao_diagnostica} from "../models/avaliacao.model.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const gerar = async (req, res) => {
  
  try {
    const { tipo, dificuldade } = req.body;

    const system =
      'Você é um avaliador pedagógico. Gere avaliações em JSON estrito, sem texto fora do JSON. ' +
      'Cada questão deve ter: id (número sequencial), enunciado (text), opcoes (array com 4 alternativas), ' +
      'gabarito (0-3), topico (string), habilidade (string), dificuldade ("iniciante"|"intermediario"|"avancado"). ' +
      'O JSON raiz deve ter o formato: { "questoes": [...] }.';

    const user =
      `Gere uma avaliação ${tipo === "diagnostica" ? "DIAGNÓSTICA" : "DE PROGRESSO"} ` +
      `com 10 questões objetivas, dificuldade predominante "${dificuldade}", ` +
      `para a trilha "${trilha.titulo}".\n` +
      `Descrição da trilha: ${trilha.descricao || "sem descrição"}\n` +
      `Competências: ${JSON.stringify(trilha.competencias || [])}\n` +
      `Tópicos: ${JSON.stringify(trilha.topicos || [])}\n` +
      `Habilidades: ${JSON.stringify(trilha.habilidades || [])}\n` +
      `Distribua as questões entre os tópicos/habilidades. Apenas JSON na resposta.`;

    //chamada da IA do groq
    const resposta = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" },
    });

    //pega o texto que aia devolveu de dentro do array resposta.choices
    const conteudo = resposta.choices[0].message.content;

    //cria a variavel que vai receber o objeto
    let avaliacaoGerada;
    
    // transforma o texto em objeto (parse), em um trycatch separado para se der errado nao voltar um 500 genérico
    try {
      avaliacaoGerada = JSON.parse(conteudo);
    } catch (parseError) {
      return res.status(502).json({
        erro: "IA retornou um formato inválido",
        detalhes: conteudo
      });
    }

    //depois de validar que é um json, é preciso garantir que seja exatamente o json que nossa api está esperando 
    if(!Array.isArray(avaliacaoGerada.questoes) || avaliacaoGerada.questoes.length === 0){
      return res.status(502).json({
        erro: "IA não retornou questões no formato esperado",
        detalhes: avaliacaoGerada
      })
    }

    //map gera um novo objeto com os dados que serao armazenados no banco, garante que tenha os nomes exatos que model espera
    const registros = avaliacaoGerada.questoes.map((questao) => ({
      enunciado: questao.enunciado,
      opcoes: questao.opcoes,
      gabarito: questao.gabarito,
      topico: questao.topico,
      habilidade: questao.habilidade,
      dificuldade: questao.dificuldade,
      usuarioId: req.usuario.id,  // aqui é o id do usuario que mandou a requisição, assim que da pra saber d equem é aquela diagnostica por exemplo
    }));

    //armazena de fato todos os objetos no banco | bulkcreate insere todo o array no banco (mais eficiente para loops, por nao ter que ir 10x no banco inserir um de cada vez)
    const questoesSalvas = await Avaliacao_diagnostica.bulkCreate(registros, {
      returning: true, //faz o INSERT devolver as linhas criadas, incluido o id com autoincrement que ele gerou para cada questão (isso é necessário para montar a resposta)
    });

    //monta a resposta final para o usuário, sem o gabarito e sem o ID do usuario (por questão de segurança) mas com o id da questão
    const questoesParaUsuario = questoesSalvas.map((questao) => ({
      id: questao.id,
      enunciado: questao.enunciado,
      opcoes: questao.opcoes,
      topico: questao.topico,
      habilidade: questao.habilidade,
      dificuldade: questao.dificuldade,
    }));

    //resposta final para o usuario
    res.status(200).json({
      mensagem: "Avaliação criada com sucesso",
      avaliacao: questoesParaUsuario,
    });
  } catch (err) {
    res.status(400).json({
      erro: "Erro ao criar avaliação",
      detalhes: err.message,
    });
  }
};