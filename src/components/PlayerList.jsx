import { Crown } from "lucide-react";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function PlayerList({ players = [] }) {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
        No players yet. Share the code.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {players.map((p) => (
        <li
          key={p.id || p.name}
          className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-black text-lime-300">
            {initials(p.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold text-zinc-100">{p.name}</span>
            <span className="block text-xs text-zinc-500">
              Lv {p.level ?? 1} · {p.score ?? 0} XP
            </span>
          </span>
          {p.is_host && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lime-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-lime-300">
              <Crown size={12} /> Host
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
