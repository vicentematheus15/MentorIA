import Groq from "groq-sdk";

const goq = new Groq({ apiKey: process.env.GEMINI_KEY });

export const gerar = async (req, res) => {
  
  try {
    const { tipo, dificuldade } = req.body;

    const trilha = {
      titulo: "Formação JavaScript Avançado e Assíncrono",
      descricao:
        "Trilha completa para dominar JavaScript do zero ao avançado, focando em conceitos modernos da linguagem, manipulação do DOM, requisições a APIs e arquitetura de código para o mercado de trabalho.",
      competencias: [
        "Resolução de problemas lógicos utilizando algoritmos estruturados em JavaScript.",
        "Desenvolvimento de interfaces web dinâmicas e interativas com manipulação eficiente do DOM.",
        "Integração de aplicações web com serviços e APIs externas de forma assíncrona.",
        "Aplicação de boas práticas de programação e padrões de projeto modernos (ES6+).",
      ],
      habilidades: [
        "Criar e manipular estruturas de dados complexas como arrays e objetos.",
        "Tratar eventos gerados pelo usuário em páginas web.",
        "Consumir APIs REST utilizando Fetch API e Axios.",
        "Gerenciar o fluxo assíncrono de dados com Promises e Async/Await.",
        "Modularizar código JavaScript para reutilização e manutenção.",
      ],
      topicos: [
        {
          nome: "Fundamentos da Linguagem",
          aulas: [
            "Variáveis (let, const) e Escopo",
            "Tipos de Dados e Operadores",
            "Estruturas Condicionais (if, switch)",
            "Laços de Repetição (for, while)",
          ],
        },
        {
          nome: "JavaScript Moderno (ES6+)",
          aulas: [
            "Arrow Functions",
            "Desestruturação (Destructuring)",
            "Operadores Rest e Spread",
            "Métodos de Array (map, filter, reduce)",
          ],
        },
        {
          nome: "Manipulação de DOM",
          aulas: [
            "Seleção de Elementos",
            "Eventos e Event Listeners",
            "Modificação de Estilos e Classes CSS",
            "Criação Dinâmica de Elementos HTML",
          ],
        },
        {
          nome: "Programação Assíncrona",
          aulas: [
            "Event Loop e Callbacks",
            "Trabalhando com Promises",
            "Async e Await",
            "Tratamento de Erros (try/catch)",
          ],
        },
        {
          nome: "Comunicação com APIs",
          aulas: [
            "Protocolo HTTP e Métodos (GET, POST)",
            "Requisições com Fetch API",
            "Formato JSON e Parsing de Dados",
          ],
        },
      ],
    };

    const system =
      'Você é um avaliador pedagógico. Gere avaliações em JSON estrito, sem texto fora do JSON. ' +
      'Cada questão deve ter: id (número sequencial), enunciado (text), opcoes (array com 4 alternativas), ' +
      'correta (0-3), topico (string), habilidade (string), dificuldade ("iniciante"|"intermediario"|"avancado"). ' +
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


    const resposta = await groq.chat.completions.create({
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


    res.status(200).json({
      mensagem: "Avaliação criada com sucesso",
      avaliacao: novaAvaliacao.text,
    });
  } catch (err) {
    res.status(400).json({
      erro: "Erro ao criar avaliação",
      detalhes: err.message,
    });
  }
};