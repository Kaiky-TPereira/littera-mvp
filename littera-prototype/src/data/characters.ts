import { Character, Enemy } from "../types";

// Ponto único de configuração de conteúdo. Novos personagens, letras e
// magias entram aqui — nenhuma lógica de combate precisa mudar.
export const ALPHA: Character = {
  name: "Alpha",
  letter: "A",
  maxHp: 100,
  spells: [
    { id: "flame", word: "FLAME", baseDamage: 20 },
    { id: "water", word: "WATER", baseDamage: 15 },
    { id: "avalanche", word: "AVALANCHE", baseDamage: 35 },
  ],
};

export const TRAINING_DUMMY: Enemy = {
  name: "Training Dummy",
  maxHp: 100,
  attackMin: 8,
  attackMax: 16,
};

// Contagem de ocorrências (case-insensitive) da letra de afinidade em uma palavra.
export function countAffinityLetters(word: string, letter: string): number {
  const target = letter.toUpperCase();
  return word
    .toUpperCase()
    .split("")
    .filter((char) => char === target).length;
}
