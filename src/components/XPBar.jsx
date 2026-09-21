import { levelForXp } from "@/game/scoring";

export default function XPBar({ xp = 0 }) {
  const { level, current, next, progress } = levelForXp(xp);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="uppercase tracking-widest text-zinc-400">
          Level {level}
        </span>
        <span className="text-zinc-500">
          {current} / {next} XP
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="xp-fill h-full rounded-full bg-lime-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
