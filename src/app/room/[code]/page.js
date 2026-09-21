"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import Button from "@/components/Button";
import RoomCode from "@/components/RoomCode";
import PlayerList from "@/components/PlayerList";
import XPBar from "@/components/XPBar";
import { fetchRoomByCode, fetchPlayers } from "@/lib/rooms";

// Real lobby backed by Supabase. Auto-refreshes every 3s until
// realtime subscriptions land in Milestone 4.
export default function RoomPage({ params }) {
  const [code, setCode] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.resolve(params).then((p) => setCode((p?.code || "").toUpperCase()));
    try {
      const raw = localStorage.getItem("talkshit-player");
      if (raw) setMe(JSON.parse(raw));
    } catch {
      setMe(null);
    }
  }, [params]);

  const load = useCallback(
    async (silent = false) => {
      if (!code) return;
      if (!silent) setRefreshing(true);
      try {
        const r = await fetchRoomByCode(code);
        const ps = await fetchPlayers(r.id);
        setRoom(r);
        setPlayers(ps);
        setError("");
      } catch (err) {
        if (!silent) setError(err.message || "Could not load the room.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [code]
  );

  useEffect(() => {
    if (!code) return;
    load();
    const t = setInterval(() => load(true), 3000);
    return () => clearInterval(t);
  }, [code, load]);

  const myEntry = me && players.find((p) => p.id === me.id);
  const isHost = myEntry ? !!myEntry.is_host : !!me?.isHost;
  const myXp = myEntry?.score ?? 0;

  return (
    <main className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-200"
        >
          <ArrowLeft size={16} /> Leave
        </Link>
        <button
          onClick={() => load()}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-200 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <RoomCode code={code} />
      {room?.name && (
        <p className="-mt-2 text-center text-sm font-bold text-zinc-400">
          {room.name} · {room.status}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-zinc-800 p-6 text-center text-sm text-zinc-500">
          Loading room...
        </div>
      ) : error && !room ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </p>
          <Link href="/join">
            <Button variant="secondary">Back to join</Button>
          </Link>
        </div>
      ) : (
        <>
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              Players · {players.length}
            </p>
            <PlayerList players={players} />
            {code && players.length === 0 && !error && (
              <p className="mt-2 text-center text-xs text-zinc-600">
                Waiting for players to appear...
              </p>
            )}
          </div>

          <XPBar xp={myXp} />

          {isHost ? (
            <>
              <Button disabled>
                <Play size={18} /> START GAME
              </Button>
              <p className="rounded-xl bg-zinc-950 px-4 py-3 text-center text-xs text-zinc-600">
                Starting the game goes live in Milestone 5 — lobby is real now,
                auto-refreshes every 3s until realtime (Milestone 4).
              </p>
            </>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center">
              <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-lime-300 border-t-transparent" />
              <p className="mt-2 text-sm font-bold text-zinc-300">
                WAITING FOR HOST...
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                The host will start the game soon.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
