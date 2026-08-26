import BattleScreen from "./components/BattleScreen";
import { ALPHA, TRAINING_DUMMY } from "./data/characters";

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">
          LITTER<span className="app__title-accent">A</span>
        </h1>
        <p className="app__subtitle">Every Letter Is a Weapon</p>
      </header>

      <BattleScreen character={ALPHA} enemy={TRAINING_DUMMY} />
    </div>
  );
}
