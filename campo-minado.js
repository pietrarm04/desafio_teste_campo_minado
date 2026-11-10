'use strict';

const LINHAS_PADRAO = 14;
const COLUNAS_PADRAO = 18;
const BOMBAS_PADRAO = 40;

function posicoesAleatorias(total, quantidade, random) {
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const valor = random();
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor >= 1) {
      throw new RangeError('A função random deve retornar um número entre 0 (inclusive) e 1 (exclusive)');
    }
    const j = Math.floor(valor * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, quantidade);
}

function vizinhos(tabuleiro, l, c) {
  const lista = [];
  for (let dl = -1; dl <= 1; dl++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dl === 0 && dc === 0) continue;
      const nl = l + dl;
      const nc = c + dc;
      if (nl >= 0 && nl < tabuleiro.linhas && nc >= 0 && nc < tabuleiro.colunas) {
        lista.push([nl, nc]);
      }
    }
  }
  return lista;
}

function criarTabuleiro({
  linhas = LINHAS_PADRAO,
  colunas = COLUNAS_PADRAO,
  bombas = BOMBAS_PADRAO,
  random = Math.random,
  bombasEm = null,
} = {}) {
  if (!Number.isInteger(linhas) || !Number.isInteger(colunas) || linhas < 1 || colunas < 1) {
    throw new RangeError('Dimensões inválidas');
  }
  const total = linhas * colunas;
  let posicoes = null;

  if (bombasEm !== null) {
    if (!Array.isArray(bombasEm)) {
      throw new TypeError('bombasEm deve ser um array de coordenadas');
    }
    posicoes = bombasEm.map((posicao) => {
      if (!Array.isArray(posicao) || posicao.length !== 2 ||
          !Number.isInteger(posicao[0]) || !Number.isInteger(posicao[1])) {
        throw new RangeError('Coordenadas de bomba devem ser números inteiros');
      }
      const [l, c] = posicao;
      if (l < 0 || l >= linhas || c < 0 || c >= colunas) {
        throw new RangeError('Bomba fora do tabuleiro');
      }
      return l * colunas + c;
    });
  }

  const qtd = posicoes !== null ? new Set(posicoes).size : bombas;
  if (posicoes !== null && qtd !== posicoes.length) throw new Error('Bombas duplicadas');
  if (!Number.isInteger(qtd) || qtd < 0 || qtd >= total) {
    throw new RangeError('Quantidade de bombas inválida');
  }

  if (posicoes === null && typeof random !== 'function') {
    throw new TypeError('random deve ser uma função');
  }
  const sorteadas = posicoes !== null ? posicoes : posicoesAleatorias(total, qtd, random);
  const celulas = Array.from({ length: linhas }, () =>
    Array.from({ length: colunas }, () => ({
      bomba: false, aberta: false, bandeira: false, vizinhas: 0,
    }))
  );
  const tabuleiro = { linhas, colunas, bombas: qtd, celulas, status: 'jogando', abertas: 0 };

  for (const p of sorteadas) {
    celulas[Math.floor(p / colunas)][p % colunas].bomba = true;
  }
  for (let l = 0; l < linhas; l++) {
    for (let c = 0; c < colunas; c++) {
      celulas[l][c].vizinhas = vizinhos(tabuleiro, l, c)
        .filter(([nl, nc]) => celulas[nl][nc].bomba).length;
    }
  }
  return tabuleiro;
}

function validarPosicao(t, l, c) {
  if (!Number.isInteger(l) || !Number.isInteger(c) ||
      l < 0 || l >= t.linhas || c < 0 || c >= t.colunas) {
    throw new RangeError('Posição fora do tabuleiro');
  }
}

function alternarBandeira(t, l, c) {
  validarPosicao(t, l, c);
  if (t.status !== 'jogando') return t;
  const cel = t.celulas[l][c];
  if (!cel.aberta) cel.bandeira = !cel.bandeira;
  return t;
}

function abrir(t, l, c) {
  validarPosicao(t, l, c);
  if (t.status !== 'jogando') return t;
  const inicial = t.celulas[l][c];
  if (inicial.aberta || inicial.bandeira) return t;

  if (inicial.bomba) {
    inicial.aberta = true;
    t.status = 'perdeu';
    return t;
  }

  const pilha = [[l, c]];
  while (pilha.length) {
    const [cl, cc] = pilha.pop();
    const cel = t.celulas[cl][cc];
    if (cel.aberta || cel.bandeira || cel.bomba) continue;
    cel.aberta = true;
    t.abertas++;
    if (cel.vizinhas === 0) pilha.push(...vizinhos(t, cl, cc));
  }

  if (t.abertas === t.linhas * t.colunas - t.bombas) t.status = 'ganhou';
  return t;
}

module.exports = {
  criarTabuleiro, abrir, alternarBandeira, vizinhos,
  LINHAS_PADRAO, COLUNAS_PADRAO, BOMBAS_PADRAO,
};
