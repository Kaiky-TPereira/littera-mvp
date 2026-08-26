# LITTERA — Protótipo de Combate

Protótipo jogável (1v1) para validar a mecânica central: **palavras como armas,
digitadas em tempo real**.

## Como rodar localmente

Requer [Node.js](https://nodejs.org) 18+ instalado (o `npm` já vem junto).

```bash
# 1. entre na pasta do projeto
cd littera-prototype

# 2. instale as dependências (só precisa fazer isso uma vez)
npm install

# 3. rode o servidor de desenvolvimento
npm run dev
```

O terminal vai mostrar um link, geralmente `http://localhost:5173`. Abra no
navegador e a batalha já começa.

Para gerar uma versão de produção (arquivos estáticos otimizados):

```bash
npm run build
npm run preview   # serve a versão de build localmente pra conferir
```

## Estrutura do projeto

```
src/
  types.ts              tipos centrais (Character, Spell, AttackResult...)
  battleLogic.ts         regras puras: grade do QTE, dano, crítico, ataque inimigo
  data/characters.ts     conteúdo do jogo — Alpha, Training Dummy, magias
  components/
    HealthBar.tsx         barra de vida
    TypingQTE.tsx          o quick time event de digitação
    BattleScreen.tsx       orquestra o loop de turnos completo
  App.tsx                 monta a tela
  styles.css              identidade visual "grimório vivo"
```

## Como as regras foram implementadas

- **Afinidade de letra**: `countAffinityLetters` conta ocorrências da letra do
  personagem na palavra (case-insensitive). Cada ocorrência dá +10% de dano.
- **Grade do QTE** (`gradeAttempt` em `battleLogic.ts`):
  - Tempo limite = `tamanho da palavra × 480ms + 900ms` (palavras maiores dão
    mais tempo, mas o ritmo continua tenso).
  - **PERFECT**: zero erros de digitação **e** dentro de 55% do tempo limite.
  - **GOOD**: palavra digitada corretamente no final, mas mais devagar ou com
    algum erro corrigido no meio do caminho.
  - **MISS**: tempo esgotado ou o texto final não bate com a palavra —
    o ataque falha (0 de dano).
- **Crítico**: PERFECT + palavra com 2 ou mais ocorrências da letra de
  afinidade → dano final dobrado.
- **Multiplicadores de dano**: PERFECT ×1.5, GOOD ×1.2, aplicados sobre
  `dano base × (1 + ocorrências × 0.10)`, depois ×2 se crítico.
- **Turno do inimigo**: dispara automaticamente depois que o resultado do
  ataque do jogador é resolvido, com dano aleatório entre `attackMin` e
  `attackMax`.

## Pontos já pensados para expansão futura

- `Character` já suporta múltiplas magias e uma única letra de afinidade —
  para adicionar um novo personagem (nova letra), basta criar outro objeto
  em `data/characters.ts`.
- `Spell` é independente de personagem — a mesma palavra pode ser reaproveitada
  por personagens diferentes que compartilhem a letra.
- `battleLogic.ts` não conhece React nem UI — pode ser reutilizado por um
  sistema de **Chain Spells** (combos entre letras de personagens diferentes)
  sem reescrever a lógica de dano.
- `BattlePhase` já é uma máquina de estados explícita — fácil de estender com
  fases como `CHAIN_SPELL` ou `ITEM_USE` mais tarde.
- Tipos de dano (`AttackResult`) podem ganhar um campo `element` no futuro sem
  quebrar nada que já existe.

## O que este protótipo NÃO tem (de propósito)

Inventário, história, mapa, loja, equipamentos e multiplayer ficaram de fora —
o objetivo aqui é validar só a sensação de "digitar = atacar" antes de
investir em qualquer outro sistema.
