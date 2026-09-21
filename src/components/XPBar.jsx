import { Zap } from "lucide-react";
import { levelForXp } from "@/game/scoring";

export default function XPBar({ xp = 0, name = null }) {
  const { level, current, next, progress } = levelForXp(xp);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 font-display text-[11px] font-bold text-black">
            {level}
          </span>
          <span className="uppercase tracking-widest text-zinc-400">
            Level {level}
            {name ? ` · ${name}` : ""}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-500 tabular-nums">
          <Zap size={12} className="text-amber-300" />
          {current.toLocaleString()} / {next.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
        <div
          className="xp-fill h-full rounded-full bg-gradient-to-r from-amber-300 via-lime-300 to-emerald-400"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
