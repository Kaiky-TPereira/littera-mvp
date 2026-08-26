interface HealthBarProps {
  name: string;
  hp: number;
  maxHp: number;
  align: "left" | "right";
}

export default function HealthBar({ name, hp, maxHp, align }: HealthBarProps) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const isLow = pct <= 25;

  return (
    <div className={`health-bar health-bar--${align}`}>
      <div className="health-bar__name">{name}</div>
      <div className="health-bar__track">
        <div
          className={`health-bar__fill ${isLow ? "health-bar__fill--low" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="health-bar__value">
        {Math.max(0, hp)} / {maxHp}
      </div>
    </div>
  );
}
