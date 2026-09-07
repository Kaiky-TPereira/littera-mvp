import { useRef, useState } from "react";
import { Character, Enemy, BattlePhase, Spell, AttackResult } from "../types";
import { rollEnemyAttack } from "../battleLogic";
import HealthBar from "./HealthBar";
import TypingQTE from "./TypingQTE";

interface BattleScreenProps {
  character: Character;
  enemy: Enemy;
}

interface FloatingText {
  id: number;
  text: string;
  side: "player" | "enemy";
  kind: "damage" | "grade" | "crit" | "miss" | "affinity";
}

let floatId = 0;

export default function BattleScreen({ character, enemy }: BattleScreenProps) {
  const [playerHp, setPlayerHp] = useState(character.maxHp);
  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [phase, setPhase] = useState<BattlePhase>("SELECT_SPELL");
  const [activeSpell, setActiveSpell] = useState<Spell | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [log, setLog] = useState<string>("Escolha uma palavra para atacar.");
  const timeouts = useRef<number[]>([]);

  const pushFloat = (f: Omit<FloatingText, "id">) => {
    const id = floatId++;
    setFloatingTexts((prev) => [...prev, { ...f, id }]);
    const t = window.setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((x) => x.id !== id));
    }, 1300);
    timeouts.current.push(t);
  };

  const selectSpell = (spell: Spell) => {
    if (phase !== "SELECT_SPELL") return;
    const containsLetter = spell.word.toUpperCase().includes(character.letter.toUpperCase());
    if (!containsLetter) {
      // Guarda de regra: personagem só usa palavras com sua letra.
      return;
    }
    setActiveSpell(spell);
    setPhase("TYPING");
    setLog(`Conjurando ${spell.word}...`);
  };

  const handleAttackResult = (result: AttackResult) => {
    setPhase("RESOLVING");

    if (result.grade === "MISS") {
      pushFloat({ text: "MISS", side: "enemy", kind: "miss" });
      setLog("O feitiço falhou! O ataque não teve efeito.");
    } else {
      const newHp = Math.max(0, enemyHp - result.damage);
      setEnemyHp(newHp);

      // Sequência de feedback: grade -> de onde veio o bônus (afinidade) ->
      // crítico (se houver) -> número final de dano. Cada etapa explica a
      // próxima, pra deixar claro por que essa palavra causou esse dano.
      pushFloat({ text: result.grade, side: "enemy", kind: "grade" });

      if (result.affinityCount > 0) {
        const affinityTimeout = window.setTimeout(() => {
          pushFloat({
            text: `${character.letter} ×${result.affinityCount} · +${result.affinityCount * 10}%`,
            side: "enemy",
            kind: "affinity",
          });
        }, 300);
        timeouts.current.push(affinityTimeout);
      }

      if (result.isCritical) {
        const critTimeout = window.setTimeout(() => {
          pushFloat({ text: "CRÍTICO!", side: "enemy", kind: "crit" });
        }, 550);
        timeouts.current.push(critTimeout);
      }

      const dmgTimeout = window.setTimeout(() => {
        pushFloat({ text: `-${result.damage}`, side: "enemy", kind: "damage" });
      }, 800);
      timeouts.current.push(dmgTimeout);

      setLog(
        `${result.grade}${result.isCritical ? " CRÍTICO" : ""} — ${result.damage} de dano` +
          (result.affinityCount > 0
            ? ` (${character.letter} ×${result.affinityCount}, +${result.affinityCount * 10}% de afinidade)`
            : "")
      );

      if (newHp <= 0) {
        const victoryTimeout = window.setTimeout(() => setPhase("VICTORY"), 1300);
        timeouts.current.push(victoryTimeout);
        return;
      }
    }

    const enemyTurnTimeout = window.setTimeout(() => {
      setPhase("ENEMY_TURN");
      runEnemyTurn();
    }, 1400);
    timeouts.current.push(enemyTurnTimeout);
  };

  const runEnemyTurn = () => {
    const dmg = rollEnemyAttack(enemy.attackMin, enemy.attackMax);
    setPlayerHp((prevHp) => {
      const newHp = Math.max(0, prevHp - dmg);
      pushFloat({ text: `-${dmg}`, side: "player", kind: "damage" });
      const followUp = window.setTimeout(() => {
        if (newHp <= 0) {
          setPhase("DEFEAT");
          setLog(`${enemy.name} finalizou o combate.`);
        } else {
          setPhase("SELECT_SPELL");
          setActiveSpell(null);
          setLog(`${enemy.name} atacou por ${dmg}. Escolha sua próxima palavra.`);
        }
      }, 700);
      timeouts.current.push(followUp);
      return newHp;
    });
  };

  const restart = () => {
    timeouts.current.forEach((t) => clearTimeout(t));
    timeouts.current = [];
    setPlayerHp(character.maxHp);
    setEnemyHp(enemy.maxHp);
    setPhase("SELECT_SPELL");
    setActiveSpell(null);
    setFloatingTexts([]);
    setLog("Escolha uma palavra para atacar.");
  };

  const isOver = phase === "VICTORY" || phase === "DEFEAT";

  return (
    <div className="battle">
      <div className="battle__arena">
        <div className="combatant combatant--player">
          <HealthBar name={character.name} hp={playerHp} maxHp={character.maxHp} align="left" />
          <div className="combatant__sigil combatant__sigil--player">{character.letter}</div>
          {floatingTexts
            .filter((f) => f.side === "player")
            .map((f) => (
              <span key={f.id} className={`float-text float-text--${f.kind}`}>
                {f.text}
              </span>
            ))}
        </div>

        <div className="battle__vs">VS</div>

        <div className="combatant combatant--enemy">
          <HealthBar name={enemy.name} hp={enemyHp} maxHp={enemy.maxHp} align="right" />
          <div className="combatant__sigil combatant__sigil--enemy">◆</div>
          {floatingTexts
            .filter((f) => f.side === "enemy")
            .map((f) => (
              <span key={f.id} className={`float-text float-text--${f.kind}`}>
                {f.text}
              </span>
            ))}
        </div>
      </div>

      <div className="battle__log">{log}</div>

      <div className="battle__stage">
        {phase === "SELECT_SPELL" && (
          <div className="spell-select">
            {character.spells.map((spell) => (
              <button
                key={spell.id}
                className="spell-button"
                onClick={() => selectSpell(spell)}
              >
                <span className="spell-button__word">{spell.word}</span>
                <span className="spell-button__meta">Dano base {spell.baseDamage}</span>
              </button>
            ))}
          </div>
        )}

        {phase === "TYPING" && activeSpell && (
          <TypingQTE character={character} spell={activeSpell} onComplete={handleAttackResult} />
        )}

        {phase === "RESOLVING" && <div className="battle__waiting">Resolvendo ataque...</div>}
        {phase === "ENEMY_TURN" && (
          <div className="battle__waiting">{enemy.name} está atacando...</div>
        )}

        {isOver && (
          <div className="battle__end">
            <div className={`battle__end-title ${phase === "VICTORY" ? "is-victory" : "is-defeat"}`}>
              {phase === "VICTORY" ? "VITÓRIA" : "DERROTA"}
            </div>
            <button className="restart-button" onClick={restart}>
              Reiniciar batalha
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
