# Campo Minado — Casos de Teste em JavaScript

Implementação da lógica de um Campo Minado em JavaScript, com tabuleiro padrão de **18 colunas x 14 linhas (252 células) e 40 bombas**. O projeto contém casos de teste automatizados utilizando o executor nativo do Node.js (`node:test`).

## Como rodar

Requisito: Node.js 18 ou mais novo. Não é necessário instalar dependências.

```bash
npm test
```

(ou `node --test campo-minado.test.js`)

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `campo-minado.js` | Lógica do jogo: criação do tabuleiro, posicionamento de bombas, abertura de células, bandeiras e verificação de vitória ou derrota |
| `campo-minado.test.js` | Casos de teste automatizados (CT01 a CT28), organizados em 6 grupos |
| `package.json` | Configuração do projeto e comando `npm test` |

---

## Regras do jogo

### Tabuleiro

- O tabuleiro padrão possui **14 linhas e 18 colunas**, totalizando **252 células**.
- O jogo possui **40 bombas** no tabuleiro padrão.
- Cada célula registra se contém uma bomba, se está aberta, se possui uma bandeira e quantas bombas existem nas células vizinhas.
- As posições das bombas são sorteadas na criação do tabuleiro. Também é possível informar posições específicas para montar cenários controlados de teste.

### Bombas e células vizinhas

- Cada célula contabiliza as bombas existentes nas até 8 células ao seu redor (horizontal, vertical e diagonal).
- Células sem bombas vizinhas recebem contagem igual a zero.
- A contagem considera apenas posições que estejam dentro dos limites do tabuleiro.

### Abrir células

- Ao abrir uma célula que contém uma bomba, o status do jogo passa para `perdeu`.
- Ao abrir uma célula sem bomba, ela é marcada como aberta.
- Se a célula aberta não tiver bombas vizinhas, a abertura se expande automaticamente para as células vizinhas, respeitando bombas e bandeiras.
- Células numeradas limitam a expansão automática.
- Uma célula já aberta ou marcada com bandeira não é aberta novamente.
- Posições inválidas lançam erro.

### Bandeiras

- É possível alternar a bandeira em uma célula fechada.
- Uma célula marcada com bandeira não pode ser aberta.
- Não é possível colocar ou alternar bandeira em uma célula que já esteja aberta.

### Fim do jogo

- O jogador vence quando abre todas as células que não possuem bombas.
- No tabuleiro padrão, é necessário abrir as **212 células seguras** (252 − 40).
- O jogador perde ao abrir uma célula que contém bomba.
- Depois que o jogo termina, novas ações de abertura são ignoradas.

---

## Casos de teste

Os testes utilizam o executor nativo do Node.js (`node:test`) e as verificações do módulo `node:assert/strict`. Cada caso prepara um tabuleiro, executa uma ação e confere o resultado esperado.

Para tornar os cenários reproduzíveis, são utilizadas duas estratégias:

- **Semente fixa:** permite gerar tabuleiros aleatórios repetíveis. A mesma semente produz o mesmo tabuleiro.
- **Posicionamento manual de bombas:** permite definir coordenadas específicas para testar situações como bombas nos cantos ou uma coluna de bombas.

### Criação do tabuleiro

| Nº | Caso | Resultado esperado |
|---|---|---|
| CT01 | Verificar padrões do tabuleiro | 14 linhas, 18 colunas e 40 bombas |
| CT02 | Criar tabuleiro padrão | 14 linhas, 18 colunas e 252 células |
| CT03 | Criar 100 tabuleiros aleatórios | Cada tabuleiro contém exatamente 40 bombas |
| CT04 | Repetir a mesma semente | A mesma semente gera tabuleiros iguais |
| CT05 | Utilizar sementes diferentes | Sementes diferentes geram tabuleiros diferentes nos cenários testados |
| CT06 | Verificar estado inicial | Todas as células começam fechadas e sem bandeiras; status `jogando` e contador de abertas igual a zero |
| CT07 | Conferir contagem de bombas vizinhas | A contagem calculada pelo jogo coincide com uma contagem independente por força bruta |

### Validação de parâmetros

| Nº | Caso | Resultado esperado |
|---|---|---|
| CT08 | Quantidade de bombas maior ou igual ao total de células | Criação rejeitada com `RangeError` (testa 252 e 253 bombas) |
| CT09 | Quantidade de bombas negativa ou fracionada | Criação rejeitada com `RangeError` |
| CT10 | Dimensões inválidas | Dimensões zero, negativas ou fracionadas são rejeitadas com `RangeError` |
| CT11 | Coordenadas de bombas inválidas | Coordenadas fora do tabuleiro, fracionadas, malformadas ou duplicadas são rejeitadas |

### Contagem de células vizinhas

| Nº | Caso | Resultado esperado |
|---|---|---|
| CT12 | Célula próxima ao canto superior esquerdo | Contabiliza corretamente duas bombas vizinhas |
| CT13 | Célula no centro do tabuleiro | Contabiliza corretamente uma bomba ao redor |
| CT14 | Células próximas ao canto inferior direito | Contabilizam corretamente a bomba vizinha, respeitando os limites |
| CT15 | Célula distante das bombas | Contagem igual a zero |

### Abertura de células

| Nº | Caso | Resultado esperado |
|---|---|---|
| CT16 | Abrir uma bomba | O status do jogo passa para `perdeu` |
| CT17 | Abrir uma célula numerada | Somente a célula selecionada é aberta e o jogo continua |
| CT18 | Abrir uma célula vazia | A abertura se expande e, no cenário preparado, todas as células seguras são abertas e o jogo é vencido |
| CT19 | Expandir até células numeradas | A expansão para nas células numeradas e não atravessa a coluna de bombas |
| CT20 | Expandir em 50 tabuleiros aleatórios | A expansão não abre nenhuma célula que contenha bomba |
| CT21 | Abrir uma célula já aberta | O contador de células abertas não é alterado |
| CT22 | Abrir posição inválida | A operação lança `RangeError` |
| CT23 | Abrir célula depois do fim do jogo | A nova jogada é ignorada e o estado permanece encerrado |

### Bandeiras

| Nº | Caso | Resultado esperado |
|---|---|---|
| CT24 | Alternar bandeira em célula fechada | A bandeira é marcada e pode ser removida |
| CT25 | Abrir célula marcada com bandeira | A célula permanece fechada e o jogo continua |
| CT26 | Marcar célula já aberta | A bandeira não é colocada |

### Vitória

| Nº | Caso | Resultado esperado |
|---|---|---|
| CT27 | Abrir todas as células seguras | Ao abrir as 212 células sem bombas, o status passa para `ganhou` |
| CT28 | Deixar uma célula segura fechada | O jogo não é marcado como vencido |

