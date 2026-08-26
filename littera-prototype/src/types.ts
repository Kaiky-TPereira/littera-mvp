export type Grade = "PERFECT" | "GOOD" | "MISS";

export interface Spell {
  id: string;
  word: string;
  baseDamage: number;
}

export interface Character {
  name: string;
  letter: string; // letra de afinidade, ex: "A"
  maxHp: number;
  spells: Spell[];
}

export interface Enemy {
  name: string;
  maxHp: number;
  attackMin: number;
  attackMax: number;
}

export interface AttackResult {
  grade: Grade;
  damage: number;
  isCritical: boolean;
  affinityCount: number;
  elapsedMs: number;
  accuracy: number; // 0-1
}

export type BattlePhase =
  | "SELECT_SPELL"
  | "TYPING"
  | "RESOLVING"
  | "ENEMY_TURN"
  | "VICTORY"
  | "DEFEAT";
