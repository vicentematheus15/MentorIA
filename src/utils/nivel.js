// peso de cada dificuldade — acertar uma questão avançada vale mais que uma iniciante
const PESO_DIFICULDADE = {
  iniciante: 1,
  intermediario: 2,
  avancado: 3,
};

// nível geral do plano (1-5) -> dificuldade predominante da próxima avaliação (progresso)
export const NIVEL_PARA_DIFICULDADE = {
  1: "iniciante",
  2: "iniciante",
  3: "intermediario",
  4: "intermediario",
  5: "avancado",
};

/*
 * Calcula o nível (1 a 5) a partir das questões salvas e das respostas do usuário.
 * @param {Array} questoes - registros do banco, cada um com { id, gabarito, dificuldade, enunciado }
 * @param {Map<number, number>} respostasPorId - questaoId -> alternativa escolhida pelo usuário
 */
export function calcularNivel(questoes, respostasPorId) {
  let pontosObtidos = 0;
  let pontosPossiveis = 0;
  const detalhes = [];

  for (const questao of questoes) {
    const peso = PESO_DIFICULDADE[questao.dificuldade] ?? 1; // dificuldade desconhecida conta como peso mínimo
    pontosPossiveis += peso;

    const respostaUsuario = respostasPorId.get(questao.id);
    const correta = respostaUsuario === questao.gabarito;

    if (correta) pontosObtidos += peso;

    detalhes.push({
      questaoId: questao.id,
      enunciado: questao.enunciado,
      respostaUsuario,
      respostaCorreta: questao.gabarito,
      correta,
    });
  }

  const percentual = pontosPossiveis > 0 ? pontosObtidos / pontosPossiveis : 0;

  let nivel;
  if (percentual < 0.2) nivel = 1;
  else if (percentual < 0.4) nivel = 2;
  else if (percentual < 0.6) nivel = 3;
  else if (percentual < 0.8) nivel = 4;
  else nivel = 5;

  return { nivel, percentual, pontosObtidos, pontosPossiveis, detalhes };
}