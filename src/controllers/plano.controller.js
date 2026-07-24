import Groq from "groq-sdk";
import trilha from "../data/trilha.json" with { type: "json" };
import { Plano, Avaliacao_diagnostica } from "../models/index.model.js";
import sequelize from "../database/database.js";
import { calcularNivel, NIVEL_PARA_DIFICULDADE } from "../utils/nivel.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================================
// Prompts reutilizados pela IA (Groq) — mesma "regra do jogo" em toda geração
// ============================================================================
const SYSTEM_PROMPT =
  "Você é um avaliador pedagógico. Gere avaliações em JSON estrito, sem texto fora do JSON. " +
  "Cada questão deve ter: id (número sequencial), enunciado (text), opcoes (array com 4 alternativas), " +
  'gabarito (0-3), topico (string), habilidade (string), dificuldade ("iniciante"|"intermediario"|"avancado"). ' +
  'O JSON raiz deve ter o formato: { "questoes": [...] }.';


// ============================================================================
// GET /planos
// Lista os planos do usuário autenticado, do mais recente pro mais antigo.
// ============================================================================
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


// ============================================================================
// POST /planos/diagnostica
// Cria um plano novo e já gera a avaliação diagnóstica nele (10 questões,
// dificuldade distribuída entre os 3 níveis — ainda não se sabe o nível do
// usuário, então a ideia é mapear, não mirar um nível específico).
// ============================================================================
export const gerarDiagnostica = async (req, res) => {
  const t = await sequelize.transaction(); // abre a transação: nada é gravado de verdade até o commit

  try {
    // --------------------------------------------------------------------
    // 1. cria o plano — é ele que vai "dar identidade" a essas questões
    // --------------------------------------------------------------------
    const plano = await Plano.create(
      {
        usuarioId: req.usuario.id,
        trilhaTitulo: trilha.titulo,
        status: "diagnostico_gerado",
      },
      { transaction: t } // marca essa escrita como parte da transação t
    );

    // --------------------------------------------------------------------
    // 2. monta o prompt e chama a IA
    // --------------------------------------------------------------------
    const user =
      `Gere uma avaliação DIAGNÓSTICA com 10 questões objetivas para a trilha "${trilha.titulo}". ` +
      `O objetivo é descobrir em qual nível o usuário está, então distribua as dificuldades de forma ` +
      `equilibrada entre as 10 questões (aproximadamente 3 a 4 de cada nível: iniciante, intermediario, avancado).\n` +
      `Descrição da trilha: ${trilha.descricao || "sem descrição"}\n` +
      `Competências: ${JSON.stringify(trilha.competencias || [])}\n` +
      `Tópicos: ${JSON.stringify(trilha.topicos || [])}\n` +
      `Habilidades: ${JSON.stringify(trilha.habilidades || [])}\n` +
      `Distribua as questões entre os tópicos/habilidades. Apenas JSON na resposta.`;

    // chamada da IA na Groq
    const resposta = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    // --------------------------------------------------------------------
    // 3. parse + validação do que a IA devolveu — nunca confiar cegamente
    // --------------------------------------------------------------------
    // pega o texto que a IA devolveu de dentro do array resposta.choices
    const conteudo = resposta.choices[0].message.content;

    // cria a variável que vai receber o objeto
    let avaliacaoGerada;

    // transforma o texto em objeto (parse), em um try/catch separado pra não
    // voltar um 500 genérico se a IA mandar algo mal formado
    try {
      avaliacaoGerada = JSON.parse(conteudo);
    } catch (parseError) {
      await t.rollback();
      return res.status(502).json({
        erro: "IA retornou um formato inválido",
        detalhes: conteudo,
      });
    }

    // depois de validar que é um JSON, precisa garantir que é exatamente o
    // formato que a nossa API está esperando
    if (!Array.isArray(avaliacaoGerada.questoes) || avaliacaoGerada.questoes.length === 0) {
      await t.rollback();
      return res.status(502).json({
        erro: "IA não retornou questões no formato esperado",
        detalhes: avaliacaoGerada,
      });
    }

    // --------------------------------------------------------------------
    // 4. salva as questões, vinculadas a esse plano
    // --------------------------------------------------------------------
    // map gera um novo objeto com os dados que serão armazenados no banco,
    // garantindo que tenha os nomes exatos que o model espera
    const registros = avaliacaoGerada.questoes.map((questao) => ({
      enunciado: questao.enunciado,
      opcoes: questao.opcoes,
      gabarito: questao.gabarito,
      topico: questao.topico,
      habilidade: questao.habilidade,
      dificuldade: questao.dificuldade,
      tipo: "diagnostica",
      planoId: plano.id, // sabendo o plano, dá pra chegar no dono (plano.usuarioId)
    }));

    // bulkCreate insere o array inteiro numa única operação (mais eficiente
    // que ir 10x no banco, uma inserção de cada vez)
    const questoesSalvas = await Avaliacao_diagnostica.bulkCreate(registros, {
      transaction: t, // mesma transação do Plano.create acima
      returning: true, // faz o INSERT devolver as linhas criadas, incluindo o id gerado
    });

    // as duas escritas (plano + questões) foram bem — confirma as duas de vez
    await t.commit();

    // --------------------------------------------------------------------
    // 5. resposta pro cliente — sem o gabarito, mas com o id de cada questão
    // --------------------------------------------------------------------
    const questoesParaUsuario = questoesSalvas.map((questao) => ({
      id: questao.id,
      enunciado: questao.enunciado,
      opcoes: questao.opcoes,
      topico: questao.topico,
      habilidade: questao.habilidade,
      dificuldade: questao.dificuldade,
    }));

    res.status(201).json({
      mensagem: "Plano criado e avaliação diagnóstica gerada com sucesso",
      plano: { id: plano.id, trilhaTitulo: plano.trilhaTitulo, status: plano.status },
      questoes: questoesParaUsuario,
    });
  } catch (err) {
    // só desfaz se a transação ainda não foi encerrada (evita erro em cima de erro)
    if (!t.finished) {
      await t.rollback();
    }

    res.status(400).json({
      erro: "Erro ao gerar avaliação diagnóstica",
      detalhes: err.message,
    });
  }
};


// ============================================================================
// POST /planos/:id/progresso
// Gera a avaliação de progresso de um plano já diagnosticado. A dificuldade
// é derivada do nível calculado na diagnóstica (regra anti-salto), não
// escolhida livremente pelo cliente.
// ============================================================================
export const gerarProgresso = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // --------------------------------------------------------------------
    // 1. valida existência, dono e estágio do plano
    // --------------------------------------------------------------------
    const plano = await Plano.findByPk(id, { transaction: t });

    if (!plano) {
      await t.rollback();
      return res.status(404).json({ erro: "Plano não encontrado" });
    }

    if (plano.usuarioId !== req.usuario.id) {
      await t.rollback();
      return res.status(403).json({ erro: "Esse plano não pertence a você" });
    }

    // só pode gerar progresso depois que a diagnóstica foi corrigida,
    // pois é dela que vem o nível usado aqui embaixo
    if (plano.status !== "diagnostico_corrigido") {
      await t.rollback();
      return res.status(409).json({
        erro: "A avaliação de progresso só pode ser gerada depois da diagnóstica ser corrigida",
      });
    }

    // --------------------------------------------------------------------
    // 2. dificuldade alvo, derivada do nível — regra anti-salto
    // --------------------------------------------------------------------
    // a dificuldade da próxima prova é derivada do nível já medido, não
    // escolhida livremente: impede pular de "iniciante" pra "avançado" de vez
    const dificuldadeAlvo = NIVEL_PARA_DIFICULDADE[plano.nivel] ?? "intermediario";

    // --------------------------------------------------------------------
    // 3. monta o prompt e chama a IA
    // --------------------------------------------------------------------
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
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    // --------------------------------------------------------------------
    // 4. parse + validação do que a IA devolveu
    // --------------------------------------------------------------------
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

    // --------------------------------------------------------------------
    // 5. salva as questões e avança o status do plano
    // --------------------------------------------------------------------
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

    // --------------------------------------------------------------------
    // 6. resposta pro cliente — sem o gabarito
    // --------------------------------------------------------------------
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
    });
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


// ============================================================================
// POST /planos/:id/diagnostica/enviar
// Recebe as respostas do usuário, corrige contra o gabarito salvo e calcula
// o nível geral do plano (1-5), ponderado pela dificuldade de cada questão.
// ============================================================================
export const enviarDiagnostica = async (req, res) => {
  try {
    const { id } = req.params;
    const { respostas } = req.body;

    // --------------------------------------------------------------------
    // 1. valida existência, dono e estágio do plano
    // --------------------------------------------------------------------
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

    // --------------------------------------------------------------------
    // 2. busca as questões desse plano e confere se as respostas batem
    // --------------------------------------------------------------------
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

    // --------------------------------------------------------------------
    // 3. corrige e calcula o nível
    // --------------------------------------------------------------------
    const respostasPorId = new Map(respostas.map((r) => [r.questaoId, r.resposta]));

    const { nivel, percentual, pontosObtidos, pontosPossiveis, detalhes } = calcularNivel(
      questoes,
      respostasPorId
    );

    plano.status = "diagnostico_corrigido";
    plano.nivel = nivel;
    await plano.save();

    // --------------------------------------------------------------------
    // 4. resposta pro cliente — aqui sim, com o gabarito de cada questão
    // --------------------------------------------------------------------
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


// ============================================================================
// POST /planos/:id/progresso/enviar
// Mesma lógica do enviarDiagnostica, mas para as questões de tipo
// "progresso" — e atualiza o nível do plano com a medição mais recente.
// ============================================================================
export const enviarProgresso = async (req, res) => {
  try {
    const { id } = req.params;
    const { respostas } = req.body;

    // --------------------------------------------------------------------
    // 1. valida existência, dono e estágio do plano
    // --------------------------------------------------------------------
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

    // --------------------------------------------------------------------
    // 2. busca as questões desse plano e confere se as respostas batem
    // --------------------------------------------------------------------
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

    // --------------------------------------------------------------------
    // 3. corrige e recalcula o nível
    // --------------------------------------------------------------------
    const respostasPorId = new Map(respostas.map((r) => [r.questaoId, r.resposta]));

    const { nivel, percentual, pontosObtidos, pontosPossiveis, detalhes } = calcularNivel(
      questoes,
      respostasPorId
    );

    plano.status = "progresso_corrigido";
    plano.nivel = nivel; // nível é atualizado com a medição mais recente
    await plano.save();

    // --------------------------------------------------------------------
    // 4. resposta pro cliente — com o gabarito de cada questão
    // --------------------------------------------------------------------
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