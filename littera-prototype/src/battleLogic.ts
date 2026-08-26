import { AttackResult, Character, Grade, Spell } from "./types";
import { countAffinityLetters } from "./data/characters";

// Tempo total concedido para digitar a palavra, em ms.
// Palavras maiores ganham mais tempo, mas o piso mantém o ritmo tenso.
export function timeLimitForWord(word: string): number {
  return Math.round(word.length * 480 + 900);
}

// Limiar (em ms) abaixo do qual, com 0 erros, o ataque é PERFECT.
export function perfectThresholdForWord(word: string): number {
  return Math.round(timeLimitForWord(word) * 0.55);
}

interface GradeInput {
  word: string;
  elapsedMs: number;
  mistakeCount: number; // teclas erradas cometidas durante a digitação (mesmo corrigidas)
  finalTextMatches: boolean; // texto final digitado == palavra alvo
  timedOut: boolean;
}

export function gradeAttempt({
  word,
  elapsedMs,
  mistakeCount,
  finalTextMatches,
  timedOut,
}: GradeInput): { grade: Grade; accuracy: number } {
  const accuracy = Math.max(0, 1 - mistakeCount / word.length);

  if (timedOut || !finalTextMatches) {
    return { grade: "MISS", accuracy };
  }

  const perfectThreshold = perfectThresholdForWord(word);
  if (mistakeCount === 0 && elapsedMs <= perfectThreshold) {
    return { grade: "PERFECT", accuracy };
  }

  return { grade: "GOOD", accuracy };
}

const GRADE_MULTIPLIER: Record<Grade, number> = {
  PERFECT: 1.5,
  GOOD: 1.2,
  MISS: 0,
};

export function resolveAttack(
  character: Character,
  spell: Spell,
  gradeInput: GradeInput
): AttackResult {
  const { grade, accuracy } = gradeAttempt(gradeInput);
  const affinityCount = countAffinityLetters(spell.word, character.letter);

  if (grade === "MISS") {
    return {
      grade,
      damage: 0,
      isCritical: false,
      affinityCount,
      elapsedMs: gradeInput.elapsedMs,
      accuracy,
    };
  }

  const affinityBonus = 1 + affinityCount * 0.1;
  let damage = spell.baseDamage * affinityBonus * GRADE_MULTIPLIER[grade];

  const isCritical = grade === "PERFECT" && affinityCount >= 2;
  if (isCritical) {
    damage *= 2;
  }

  return {
    grade,
    damage: Math.round(damage),
    isCritical,
    affinityCount,
    elapsedMs: gradeInput.elapsedMs,
    accuracy,
  };
}

export function rollEnemyAttack(attackMin: number, attackMax: number): number {
  return Math.round(attackMin + Math.random() * (attackMax - attackMin));
}
