import { useEffect, useRef, useState } from "react";
import { Character, Spell } from "../types";
import { resolveAttack } from "../battleLogic";
import { timeLimitForWord } from "../battleLogic";
import { getAffinityIndices } from "../data/characters";
import type { AttackResult } from "../types";

interface TypingQTEProps {
  character: Character;
  spell: Spell;
  onComplete: (result: AttackResult) => void;
}

export default function TypingQTE({ character, spell, onComplete }: TypingQTEProps) {
  const [typed, setTyped] = useState("");
  const [remainingMs, setRemainingMs] = useState(timeLimitForWord(spell.word));
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(performance.now());
  const mistakeCountRef = useRef(0);
  const finishedRef = useRef(false);
  const totalTime = timeLimitForWord(spell.word);

  const finish = (timedOut: boolean, currentTyped: string) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const elapsedMs = performance.now() - startTimeRef.current;
    const finalTextMatches = currentTyped.toUpperCase() === spell.word.toUpperCase();

    const result = resolveAttack(character, spell, {
      word: spell.word,
      elapsedMs,
      mistakeCount: mistakeCountRef.current,
      finalTextMatches,
      timedOut,
    });

    onComplete(result);
  };

  // Timer regressivo
  useEffect(() => {
    startTimeRef.current = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const left = totalTime - elapsed;
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(interval);
        finish(true, typed);
      }
    }, 40);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spell.word]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [spell.word]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (finishedRef.current) return;
    const raw = e.target.value.toUpperCase().slice(0, spell.word.length);

    // Conta como erro qualquer caractere novo digitado que não bate com o
    // alvo na mesma posição — mesmo que o jogador corrija depois.
    if (raw.length > typed.length) {
      const newIndex = raw.length - 1;
      if (raw[newIndex] !== spell.word[newIndex]) {
        mistakeCountRef.current += 1;
      }
    }

    setTyped(raw);

    if (raw.length === spell.word.length) {
      finish(false, raw);
    }
  };

  const affinityIndices = getAffinityIndices(spell.word, character.letter);
  const affinitySet = new Set(affinityIndices);
  const affinityCount = affinityIndices.length;
  const pctTime = Math.max(0, Math.min(100, (remainingMs / totalTime) * 100));
  const urgent = pctTime <= 30;

  return (
    <div className="qte">
      <div className="qte__prompt">
        Digite a palavra para conjurar <strong>{spell.word}</strong>
      </div>

      {affinityCount > 0 && (
        <div className="affinity-badge">
          <span className="affinity-badge__icon">✦</span>
          <span className="affinity-badge__letter">
            {character.letter} ×{affinityCount}
          </span>
          <span className="affinity-badge__bonus">+{affinityCount * 10}% DANO</span>
        </div>
      )}

      <div className="qte__word" aria-hidden>
        {spell.word.split("").map((char, i) => {
          const typedChar = typed[i];
          const isAffinity = affinitySet.has(i);
          let state = "pending";
          if (typedChar !== undefined) {
            state = typedChar === char ? "correct" : "wrong";
          }
          return (
            <span
              key={i}
              className={`qte__letter qte__letter--${state} ${
                isAffinity ? "qte__letter--affinity" : ""
              }`}
            >
              {char}
            </span>
          );
        })}
      </div>

      <input
        ref={inputRef}
        className="qte__input"
        value={typed}
        onChange={handleChange}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={`Digite ${spell.word}`}
      />

      <div className="qte__timer-track">
        <div
          className={`qte__timer-fill ${urgent ? "qte__timer-fill--urgent" : ""}`}
          style={{ width: `${pctTime}%` }}
        />
      </div>
    </div>
  );
}
