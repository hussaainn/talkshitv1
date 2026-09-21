"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import Button from "@/components/Button";
import RoomCode from "@/components/RoomCode";
import PlayerList from "@/components/PlayerList";
import XPBar from "@/components/XPBar";
import { fetchRoomByCode, fetchPlayers, joinRoom } from "@/lib/rooms";
import { hostStartGame } from "@/lib/game";

// Real lobby backed by Supabase. Auto-refreshes every 3s until
// realtime subscriptions land in Milestone 4.
export default function RoomPage({ params }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
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

  // Everyone follows the host into the game.
  useEffect(() => {
    if (room && room.status !== "LOBBY" && code) {
      router.push(`/game/${code}`);
    }
  }, [room, code, router]);

  async function handleStart() {
    if (starting || !room) return;
    setStarting(true);
    setError("");
    try {
      await hostStartGame(room, players);
      router.push(`/game/${code}`);
    } catch (err) {
      setError(err.message || "Could not start the game.");
      setStarting(false);
    }
  }

  const myEntry = me && players.find((p) => p.id === me.id);
  const inRoom = !!myEntry;
  const isHost = !!myEntry?.is_host;
  const myXp = myEntry?.score ?? 0;

  async function handleQuickJoin(e) {
    e.preventDefault();
    if (joining || !room) return;
    setError("");
    if (!joinName.trim()) {
      setError("Enter your display name to join.");
      return;
    }
    setJoining(true);
    try {
      const { player } = await joinRoom({ playerName: joinName.trim(), code });
      const saved = {
        id: player.id,
        name: player.name,
        roomId: room.id,
        roomCode: room.code,
        isHost: false,
      };
      localStorage.setItem("talkshit-player", JSON.stringify(saved));
      setMe(saved);
      setJoinName("");
      await load();
    } catch (err) {
      setError(err.message || "Could not join.");
    } finally {
      setJoining(false);
    }
  }

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

          {!inRoom ? (
            <form onSubmit={handleQuickJoin} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-center text-sm font-bold text-zinc-300">
                You&apos;re spectating on this device.
              </p>
              <input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name to join"
                maxLength={24}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300 focus:outline-none"
              />
              {error && (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                  {error}
                </p>
              )}
              <Button type="submit" loading={joining ? "Joining..." : false}>
                JOIN GAME
              </Button>
            </form>
          ) : isHost ? (
            <>
              <Button onClick={handleStart} loading={starting ? "Starting game..." : false}>
                <Play size={18} /> START GAME
              </Button>
              {error && (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                  {error}
                </p>
              )}
              <p className="rounded-xl bg-zinc-950 px-4 py-3 text-center text-xs text-zinc-600">
                Need at least 2 players. Everyone jumps in automatically.
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
