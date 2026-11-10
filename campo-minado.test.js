'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  criarTabuleiro, abrir, alternarBandeira,
  LINHAS_PADRAO, COLUNAS_PADRAO, BOMBAS_PADRAO,
} = require('./campo-minado');

function semente(s) {
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const todas = (t) => t.celulas.flat();
const contarBombas = (t) => todas(t).filter((c) => c.bomba).length;

function vizinhasPorForcaBruta(t, l, c) {
  let n = 0;
  for (let i = l - 1; i <= l + 1; i++) {
    for (let j = c - 1; j <= c + 1; j++) {
      if ((i !== l || j !== c) && t.celulas[i]?.[j]?.bomba) n++;
    }
  }
  return n;
}

test.describe('Criação do tabuleiro 18 x 14 com 40 bombas', () => {
  test('padrões: 14 linhas, 18 colunas, 40 bombas', () => {
    assert.equal(LINHAS_PADRAO, 14);
    assert.equal(COLUNAS_PADRAO, 18);
    assert.equal(BOMBAS_PADRAO, 40);
  });

  test('tem 14 linhas, 18 colunas e 252 células', () => {
    const t = criarTabuleiro();
    assert.equal(t.celulas.length, 14);
    assert.ok(t.celulas.every((linha) => linha.length === 18));
    assert.equal(todas(t).length, 252);
  });

  test('tem exatamente 40 bombas em 100 jogos aleatórios', () => {
    for (let i = 1; i <= 100; i++) {
      assert.equal(contarBombas(criarTabuleiro({ random: semente(i) })), 40);
    }
  });

  test('mesma semente gera o mesmo tabuleiro', () => {
    const a = criarTabuleiro({ random: semente(7) });
    const b = criarTabuleiro({ random: semente(7) });
    assert.deepEqual(a, b);
  });

  test('sementes diferentes geram tabuleiros diferentes', () => {
    const a = criarTabuleiro({ random: semente(1) });
    const b = criarTabuleiro({ random: semente(2) });
    assert.notDeepEqual(a, b);
  });

  test('começa com todas as células fechadas, sem bandeiras e status "jogando"', () => {
    const t = criarTabuleiro({ random: semente(3) });
    assert.ok(todas(t).every((c) => !c.aberta && !c.bandeira));
    assert.equal(t.status, 'jogando');
    assert.equal(t.abertas, 0);
  });

  test('o número de bombas vizinhas bate com a contagem por força bruta', () => {
    const t = criarTabuleiro({ random: semente(11) });
    for (let l = 0; l < 14; l++) {
      for (let c = 0; c < 18; c++) {
        assert.equal(t.celulas[l][c].vizinhas, vizinhasPorForcaBruta(t, l, c));
      }
    }
  });
});

test.describe('Validação de parâmetros', () => {
  test('rejeita bombas maior ou igual ao número de células', () => {
    assert.throws(() => criarTabuleiro({ bombas: 252 }), RangeError);
    assert.throws(() => criarTabuleiro({ bombas: 253 }), RangeError);
  });
  test('rejeita bombas negativas ou fracionadas', () => {
    assert.throws(() => criarTabuleiro({ bombas: -1 }), RangeError);
    assert.throws(() => criarTabuleiro({ bombas: 2.5 }), RangeError);
  });
  test('rejeita dimensões inválidas', () => {
    assert.throws(() => criarTabuleiro({ linhas: 0 }), RangeError);
    assert.throws(() => criarTabuleiro({ colunas: -3 }), RangeError);
    assert.throws(() => criarTabuleiro({ linhas: 2.5 }), RangeError);
    assert.throws(() => criarTabuleiro({ colunas: 3.5 }), RangeError);
  });
  test('rejeita bomba fora do tabuleiro, coordenada inválida ou duplicada', () => {
    assert.throws(() => criarTabuleiro({ bombasEm: [[14, 0]] }), RangeError);
    assert.throws(() => criarTabuleiro({ bombasEm: [[0, 18]] }), RangeError);
    assert.throws(() => criarTabuleiro({ bombasEm: [[1.5, 2]] }), RangeError);
    assert.throws(() => criarTabuleiro({ bombasEm: [[1, 2.5]] }), RangeError);
    assert.throws(() => criarTabuleiro({ bombasEm: [[1, 1], [1, 1]] }), /duplicadas/);
    assert.throws(() => criarTabuleiro({ bombasEm: [[1]] }), RangeError);
  });
});

test.describe('Contagem de vizinhas (bombas posicionadas à mão)', () => {
  const t = () => criarTabuleiro({ bombasEm: [[0, 0], [0, 1], [7, 9], [13, 17]] });

  test('canto superior esquerdo vizinho de duas bombas', () => {
    assert.equal(t().celulas[1][0].vizinhas, 2);
  });
  test('célula no centro com uma bomba ao redor', () => {
    assert.equal(t().celulas[6][8].vizinhas, 1);
  });
  test('canto inferior direito vizinho da última bomba', () => {
    assert.equal(t().celulas[12][16].vizinhas, 1);
    assert.equal(t().celulas[13][16].vizinhas, 1);
  });
  test('célula distante de qualquer bomba tem 0', () => {
    assert.equal(t().celulas[4][4].vizinhas, 0);
  });
});

test.describe('Abrir células', () => {
  test('abrir uma bomba perde o jogo', () => {
    const t = criarTabuleiro({ bombasEm: [[5, 5]] });
    abrir(t, 5, 5);
    assert.equal(t.status, 'perdeu');
  });

  test('abrir célula numerada abre só ela', () => {
    const t = criarTabuleiro({ bombasEm: [[5, 5]] });
    abrir(t, 5, 6);
    assert.equal(t.abertas, 1);
    assert.equal(t.celulas[5][6].aberta, true);
    assert.equal(t.status, 'jogando');
  });

  test('abrir célula vazia expande (flood fill) e ganha com uma bomba no canto', () => {
    const t = criarTabuleiro({ bombasEm: [[0, 0]] });
    abrir(t, 13, 17);
    assert.equal(t.abertas, 251);
    assert.equal(t.celulas[0][0].aberta, false);
    assert.equal(t.status, 'ganhou');
  });

  test('a expansão para nas células numeradas', () => {
    const bombasEm = Array.from({ length: 14 }, (_, l) => [l, 9]);
    const t = criarTabuleiro({ bombasEm });
    abrir(t, 0, 0);
    assert.equal(t.abertas, 14 * 9);
    assert.ok(t.celulas.every((linha) => !linha[10].aberta));
  });

  test('a expansão nunca abre bombas (50 tabuleiros de 40 bombas)', () => {
    for (let i = 1; i <= 50; i++) {
      const t = criarTabuleiro({ random: semente(i) });
      const vazias = [];
      t.celulas.forEach((linha, l) => linha.forEach((c, k) => {
        if (!c.bomba && c.vizinhas === 0) vazias.push([l, k]);
      }));
      if (!vazias.length) continue;
      abrir(t, ...vazias[0]);
      assert.ok(todas(t).every((c) => !(c.aberta && c.bomba)));
    }
  });

  test('abrir célula já aberta não altera o contador', () => {
    const t = criarTabuleiro({ bombasEm: [[5, 5]] });
    abrir(t, 5, 6);
    abrir(t, 5, 6);
    assert.equal(t.abertas, 1);
  });

  test('posição fora do tabuleiro lança erro', () => {
    const t = criarTabuleiro({ random: semente(1) });
    assert.throws(() => abrir(t, -1, 0), RangeError);
    assert.throws(() => abrir(t, 14, 0), RangeError);
    assert.throws(() => abrir(t, 0, 18), RangeError);
    assert.throws(() => abrir(t, 0.5, 0), RangeError);
  });

  test('depois do fim de jogo, novas jogadas são ignoradas', () => {
    const t = criarTabuleiro({ bombasEm: [[5, 5]] });
    abrir(t, 5, 5);
    abrir(t, 0, 0);
    assert.equal(t.celulas[0][0].aberta, false);
    assert.equal(t.status, 'perdeu');
  });
});

test.describe('Bandeiras', () => {
  test('alterna a bandeira em célula fechada', () => {
    const t = criarTabuleiro({ random: semente(5) });
    alternarBandeira(t, 3, 3);
    assert.equal(t.celulas[3][3].bandeira, true);
    alternarBandeira(t, 3, 3);
    assert.equal(t.celulas[3][3].bandeira, false);
  });

  test('célula com bandeira não é aberta', () => {
    const t = criarTabuleiro({ bombasEm: [[5, 5]] });
    alternarBandeira(t, 5, 5);
    abrir(t, 5, 5);
    assert.equal(t.status, 'jogando');
    assert.equal(t.celulas[5][5].aberta, false);
  });

  test('não coloca bandeira em célula aberta', () => {
    const t = criarTabuleiro({ bombasEm: [[5, 5]] });
    abrir(t, 5, 6);
    alternarBandeira(t, 5, 6);
    assert.equal(t.celulas[5][6].bandeira, false);
  });
});

test.describe('Vitória com 40 bombas', () => {
  test('ganha ao abrir todas as 212 células seguras', () => {
    const t = criarTabuleiro({ random: semente(42) });
    for (let l = 0; l < 14; l++) {
      for (let c = 0; c < 18; c++) {
        if (!t.celulas[l][c].bomba) abrir(t, l, c);
      }
    }
    assert.equal(t.abertas, 212);
    assert.equal(t.status, 'ganhou');
  });

  test('não ganha enquanto faltar uma célula segura', () => {
    const t = criarTabuleiro({ random: semente(42) });
    let pulada = false;
    for (let l = 0; l < 14; l++) {
      for (let c = 0; c < 18; c++) {
        const cel = t.celulas[l][c];
        if (cel.bomba) continue;
        if (!pulada && !cel.aberta) { pulada = true; continue; }
        abrir(t, l, c);
      }
    }
    assert.notEqual(t.status, 'ganhou');
  });
});
