import { Crown } from "lucide-react";
import Avatar from "./Avatar";

export default function PlayerList({ players = [], highlightId = null }) {
  if (players.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">
        No players yet. Share the code.
      </div>
    );
  }

  return (
    <ul className="stagger space-y-2">
      {players.map((p) => {
        const you = highlightId && p.id === highlightId;
        return (
          <li
            key={p.id || p.name}
            className={`animate-fade-up flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 backdrop-blur transition ${
              you
                ? "border-lime-300/40 bg-lime-300/[0.07]"
                : "border-white/[0.07] bg-white/[0.03]"
            }`}
          >
            <Avatar name={p.name} ring={!!p.is_host} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display font-bold text-zinc-100">
                {p.name}
                {you && <span className="ml-1.5 text-[11px] font-bold text-lime-300">YOU</span>}
              </span>
              <span className="block text-xs font-semibold text-zinc-500">
                Lv {p.level ?? 1} · {(p.score ?? 0).toLocaleString()} XP
              </span>
            </span>
            {p.is_host ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-lime-200 to-lime-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                <Crown size={11} /> Host
              </span>
            ) : (
              <span
                className={`h-2 w-2 rounded-full ${p.is_connected === false ? "bg-zinc-600" : "bg-emerald-400"}`}
                title={p.is_connected === false ? "offline" : "online"}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
