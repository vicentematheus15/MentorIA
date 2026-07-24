import Groq from "groq-sdk";
import trilha from "../data/trilha.json" with { type: "json" };
import { Plano, Avaliacao_diagnostica } from "../models/index.model.js";
import sequelize from "../database/database.js";
import { calcularNivel, NIVEL_PARA_DIFICULDADE } from "../utils/nivel.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Controller provisório — cada função abaixo será implementada na próxima etapa.
// Por enquanto, só garante que as rotas existem e respondem de forma previsível.

export const listar = async (req, res) => {
  try {
    const planos = await Plano.findAll({
      where: { usuarioId: req.usuario.id },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "trilhaTitulo", "status", "createdAt"],
    });

    res.status(200).json({ planos });
  } catch (err) {
    res.status(400).json({
      erro: "erro ao listar planos",
      detalhes: err.message,
    });
  }
};

export const gerarDiagnostica = async (req, res) => {
  const t = await sequelize.transaction(); // abre a transação: nada é gravado de verdade até o commit

  try {
    // cria o plano primeiro — é ele que vai "dar identidade" a essas questões
    const plano = await Plano.create({
      usuarioId: req.usuario.id,
      trilhaTitulo: trilha.titulo,
      status: "diagnostico_gerado",
    }, { transaction: t }); // marca essa escrita como parte da transação t

    const system =
      "Você é um avaliador pedagógico. Gere avaliações em JSON estrito, sem texto fora do JSON. " +
      "Cada questão deve ter: id (número sequencial), enunciado (text), opcoes (array com 4 alternativas), " +
      'gabarito (0-3), topico (string), habilidade (string), dificuldade ("iniciante"|"intermediario"|"avancado"). ' +
      'O JSON raiz deve ter o formato: { "questoes": [...] }.';

    const user =
      `Gere uma avaliação DIAGNÓSTICA com 10 questões objetivas para a trilha "${trilha.titulo}". ` +
      `O objetivo é descobrir em qual nível o usuário está, então distribua as dificuldades de forma ` +
      `equilibrada entre as 10 questões (aproximadamente 3 a 4 de cada nível: iniciante, intermediario, avancado).\n` +
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
        { role: "user", content: user },
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
        detalhes: conteudo,
      });
    }

    //depois de validar que é um json, é preciso garantir que seja exatamente o json que nossa api está esperando
    if (!Array.isArray(avaliacaoGerada.questoes) || avaliacaoGerada.questoes.length === 0) {
      return res.status(502).json({
        erro: "IA não retornou questões no formato esperado",
        detalhes: avaliacaoGerada,
      });
    }

    //map gera um novo objeto com os dados que serao armazenados no banco, garante que tenha os nomes exatos que model espera
    const registros = avaliacaoGerada.questoes.map((questao) => ({
      enunciado: questao.enunciado,
      opcoes: questao.opcoes,
      gabarito: questao.gabarito,
      topico: questao.topico,
      habilidade: questao.habilidade,
      dificuldade: questao.dificuldade,
      tipo: "diagnostica",
      planoId: plano.id, // aqui é o id do plano que essas questoes pertencem. sabendo o plano, depois da pra buscar a quem pertence o plano, assim chegando no usuario
    }));

    //armazena de fato todos os objetos no banco | bulkcreate insere todo o array no banco (mais eficiente para loops, por nao ter que ir 10x no banco inserir um de cada vez)
    const questoesSalvas = await Avaliacao_diagnostica.bulkCreate(registros, {
      transaction: t, // mesma transação do Plano.create acima
      returning: true, //faz o INSERT devolver as linhas criadas, incluido o id com autoincrement que ele gerou para cada questão (isso é necessário para montar a resposta)
    });

    // as duas escritas (plano + questões) foram bem — confirma as duas de vez
    await t.commit();

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
    res.status(201).json({
      mensagem: "Plano criado e avaliação diagnóstica gerada com sucesso",
      plano: { id: plano.id, trilhaTitulo: plano.trilhaTitulo, status: plano.status },
      questoes: questoesParaUsuario,
    });
  } catch (err) {
    if (!t.finished){
      await t.rollback(); //só desfaz se a transação ainda não foi encerrada (evita erro em cima de erro)
    }
    
    res.status(400).json({
      erro: "Erro ao gerar avaliação diagnóstica",
      detalhes: err.message,
    });
  }
};

export const gerarProgresso = async (req, res) => {
  const t = await sequelize.transaction();
 
  try {
    const { id } = req.params;
 
    const plano = await Plano.findByPk(id, { transaction: t });
 
    if (!plano) {
      await t.rollback();
      return res.status(404).json({ erro: "Plano não encontrado" });
    }
 
    if (plano.usuarioId !== req.usuario.id) {
      await t.rollback();
      return res.status(403).json({ erro: "Esse plano não pertence a você" });
    }

    //so pode gerar progressodepois que a diagnostica foi corrigida, pois o nível vem dela
    if(plano.status !== "diagnostico_corrigido"){
      await t.rollback();
      return res.status(409).json({
        erro: "A avaliação de progressão só pode ser gerada depois da diagnóstica ser corrigida",
      });
    }

    //regra anti-salto: a dificuldade da p´roxima é derivada do nível já medido e não escolhida livremente (impede de pular de inciante para avançado de uma vez)
    const dificuldadeAlvo = NIVEL_PARA_DIFICULDADE[plano.nivel] ?? "intermediario";

    const system =
      "Você é um avaliador pedagógico. Gere avaliações em JSON estrito, sem texto fora do JSON. " +
      "Cada questão deve ter: id (número sequencial), enunciado (text), opcoes (array com 4 alternativas), " +
      'gabarito (0-3), topico (string), habilidade (string), dificuldade ("iniciante"|"intermediario"|"avancado"). ' +
      'O JSON raiz deve ter o formato: { "questoes": [...] }.';
 
    const user =
      `Gere uma avaliação DE PROGRESSO com 10 questões objetivas para a trilha "${trilha.titulo}". ` +
      `O usuário está no nível ${plano.nivel} de 5 nessa trilha, medido na diagnóstica anterior. ` +
      `Gere a maior parte das questões (cerca de 6 a 7) com dificuldade "${dificuldadeAlvo}", ` +
      `e distribua o restante entre o nível imediatamente abaixo e o imediatamente acima, ` +
      `para continuar mapeando a evolução do usuário sem dar um salto grande de dificuldade.\n` +
      `Descrição da trilha: ${trilha.descricao || "sem descrição"}\n` +
      `Competências: ${JSON.stringify(trilha.competencias || [])}\n` +
      `Tópicos: ${JSON.stringify(trilha.topicos || [])}\n` +
      `Habilidades: ${JSON.stringify(trilha.habilidades || [])}\n` +
      `Distribua as questões entre os tópicos/habilidades. Apenas JSON na resposta.`;
 
    const resposta = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });
 
    const conteudo = resposta.choices[0].message.content;
 
    let avaliacaoGerada;
    try {
      avaliacaoGerada = JSON.parse(conteudo);
    } catch (parseError) {
      await t.rollback();
      return res.status(502).json({
        erro: "IA retornou um formato inválido",
        detalhes: conteudo,
      });
    }
 
    if (!Array.isArray(avaliacaoGerada.questoes) || avaliacaoGerada.questoes.length === 0) {
      await t.rollback();
      return res.status(502).json({
        erro: "IA não retornou questões no formato esperado",
        detalhes: avaliacaoGerada,
      });
    }
 
    const registros = avaliacaoGerada.questoes.map((questao) => ({
      enunciado: questao.enunciado,
      opcoes: questao.opcoes,
      gabarito: questao.gabarito,
      topico: questao.topico,
      habilidade: questao.habilidade,
      dificuldade: questao.dificuldade,
      tipo: "progresso",
      planoId: plano.id,
    }));
 
    const questoesSalvas = await Avaliacao_diagnostica.bulkCreate(registros, {
      transaction: t,
      returning: true,
    });

    plano.status = "progresso_gerado";
    await plano.save({ transaction: t });

    await t.commit();

    const questoesParaUsuario = questoesSalvas.map((questao) => ({
      id: questao.id,
      enunciado: questao.enunciado,
      opcoes: questao.opcoes,
      topico: questao.topico,
      habilidade: questao.habilidade,
      dificuldade: questao.dificuldade,
    }));

    return res.status(201).json({
      mensagem: "Avaliação de progresso foi gerada com sucesso",
      plano: { id: plano.id, status: plano.status, nivel: plano.nivel },
      questoes: questoesParaUsuario,
    })
  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }
    res.status(400).json({
      erro: "Erro ao gerar avaliação de progresso",
      detalhes: err.message,
    });
  }
};

export const enviarDiagnostica = async (req, res) => {
 try {
    const { id } = req.params;
    const { respostas } = req.body;
 
    const plano = await Plano.findByPk(id);
 
    if (!plano) {
      return res.status(404).json({ erro: "Plano não encontrado" });
    }
 
    // garante que o plano é do usuário autenticado, não de outra pessoa
    if (plano.usuarioId !== req.usuario.id) {
      return res.status(403).json({ erro: "Esse plano não pertence a você" });
    }
 
    // impede reenvio: só pode corrigir uma vez, enquanto o status for exatamente esse
    if (plano.status !== "diagnostico_gerado") {
      return res.status(409).json({
        erro: "A diagnóstica desse plano já foi corrigida, ou ainda não foi gerada",
      });
    }
 
    const questoes = await Avaliacao_diagnostica.findAll({
      where: { planoId: plano.id, tipo: "diagnostica" },
    });
 
    // as respostas enviadas precisam bater exatamente com o conjunto de questões desse plano
    const idsEsperados = new Set(questoes.map((q) => q.id));
    const idsRecebidos = new Set(respostas.map((r) => r.questaoId));
 
    const mesmoConjunto =
      idsEsperados.size === idsRecebidos.size &&
      [...idsEsperados].every((idEsperado) => idsRecebidos.has(idEsperado));
 
    if (!mesmoConjunto) {
      return res.status(400).json({
        erro: "As respostas enviadas não correspondem exatamente às questões desse plano",
      });
    }
 
    const respostasPorId = new Map(respostas.map((r) => [r.questaoId, r.resposta]));
 
    const { nivel, percentual, pontosObtidos, pontosPossiveis, detalhes } = calcularNivel(
      questoes,
      respostasPorId
    );
 
    plano.status = "diagnostico_corrigido";
    plano.nivel = nivel;
    await plano.save();
 
    res.status(200).json({
      mensagem: "Diagnóstica corrigida com sucesso",
      plano: { id: plano.id, status: plano.status, nivel: plano.nivel },
      pontuacao: {
        acertosPonderados: pontosObtidos,
        totalPonderado: pontosPossiveis,
        percentual: Math.round(percentual * 100),
      },
      correcao: detalhes,
    });
  } catch (err) {
    res.status(400).json({
      erro: "Erro ao corrigir avaliação diagnóstica",
      detalhes: err.message,
    });
  }
};

export const enviarProgresso = async (req, res) => {
 try {
    const { id } = req.params;
    const { respostas } = req.body;
 
    const plano = await Plano.findByPk(id);
 
    if (!plano) {
      return res.status(404).json({ erro: "Plano não encontrado" });
    }
 
    if (plano.usuarioId !== req.usuario.id) {
      return res.status(403).json({ erro: "Esse plano não pertence a você" });
    }
 
    if (plano.status !== "progresso_gerado") {
      return res.status(409).json({
        erro: "O progresso desse plano já foi corrigido, ou ainda não foi gerado",
      });
    }
 
    const questoes = await Avaliacao_diagnostica.findAll({
      where: { planoId: plano.id, tipo: "progresso" },
    });
 
    const idsEsperados = new Set(questoes.map((q) => q.id));
    const idsRecebidos = new Set(respostas.map((r) => r.questaoId));
 
    const mesmoConjunto =
      idsEsperados.size === idsRecebidos.size &&
      [...idsEsperados].every((idEsperado) => idsRecebidos.has(idEsperado));
 
    if (!mesmoConjunto) {
      return res.status(400).json({
        erro: "As respostas enviadas não correspondem exatamente às questões desse plano",
      });
    }
 
    const respostasPorId = new Map(respostas.map((r) => [r.questaoId, r.resposta]));
 
    const { nivel, percentual, pontosObtidos, pontosPossiveis, detalhes } = calcularNivel(
      questoes,
      respostasPorId
    );
 
    plano.status = "progresso_corrigido";
    plano.nivel = nivel; // nível é atualizado com a medição mais recente
    await plano.save();
 
    res.status(200).json({
      mensagem: "Progresso corrigido com sucesso",
      plano: { id: plano.id, status: plano.status, nivel: plano.nivel },
      pontuacao: {
        acertosPonderados: pontosObtidos,
        totalPonderado: pontosPossiveis,
        percentual: Math.round(percentual * 100),
      },
      correcao: detalhes,
    });
  } catch (err) {
    res.status(400).json({
      erro: "Erro ao corrigir avaliação de progresso",
      detalhes: err.message,
    });
  }
};