import { GAME_PHASES } from "@/game/gameEngine";

const ORDER = [
  GAME_PHASES.PICK,
  GAME_PHASES.DEFEND,
  GAME_PHASES.ATTACK,
  GAME_PHASES.CURVEBALL,
  GAME_PHASES.FINAL,
  GAME_PHASES.RESULTS,
];

const LABELS = {
  PICK: "Pick",
  DEFEND: "Defend",
  ATTACK: "Attack",
  CURVEBALL: "Curve",
  FINAL: "Final",
  RESULTS: "Results",
};

export default function PhaseIndicator({ current = GAME_PHASES.PICK }) {
  const activeIndex = ORDER.indexOf(current);

  return (
    <div className="flex items-center gap-1">
      {ORDER.map((phase, i) => {
        const isActive = i === activeIndex;
        const isDone = activeIndex >= 0 && i < activeIndex;
        return (
          <div key={phase} className="flex-1 text-center">
            <div
              className={
                isActive
                  ? "h-1.5 rounded-full bg-lime-300"
                  : isDone
                    ? "h-1.5 rounded-full bg-zinc-600"
                    : "h-1.5 rounded-full bg-zinc-800"
              }
            />
            <p
              className={
                isActive
                  ? "mt-1 text-[10px] font-black uppercase tracking-wider text-lime-300"
                  : "mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600"
              }
            >
              {LABELS[phase]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
