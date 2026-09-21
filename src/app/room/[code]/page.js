"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, RefreshCw, Radio } from "lucide-react";
import Button from "@/components/Button";
import RoomCode from "@/components/RoomCode";
import PlayerList from "@/components/PlayerList";
import XPBar from "@/components/XPBar";
import { fetchRoomByCode, fetchPlayers, joinRoom } from "@/lib/rooms";
import { hostStartGame } from "@/lib/game";
import { buzz } from "@/lib/vibrate";

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
      buzz([20, 40, 20]);
      router.push(`/game/${code}`);
    } catch (err) {
      setError(err.message || "Could not start the game.");
      setStarting(false);
    }
  }

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
      buzz(20);
      await load();
    } catch (err) {
      setError(err.message || "Could not join.");
    } finally {
      setJoining(false);
    }
  }

  const myEntry = me && players.find((p) => p.id === me.id);
  const inRoom = !!myEntry;
  const isHost = !!myEntry?.is_host;
  const myXp = myEntry?.score ?? 0;

  return (
    <main className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-zinc-400 transition hover:text-zinc-100"
        >
          <ArrowLeft size={15} /> Leave
        </Link>
        <button
          onClick={() => load()}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-zinc-400 transition hover:text-zinc-100 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <RoomCode code={code} />
      {room && (
        <div className="-mt-2 flex items-center justify-center gap-2 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-display font-bold text-zinc-200">{room.name}</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {room.status}
          </span>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : error && !room ? (
        <div className="space-y-3">
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
            {error}
          </p>
          <Link href="/join">
            <Button variant="secondary">Back to join</Button>
          </Link>
        </div>
      ) : (
        <>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
              <Radio size={12} className="text-emerald-400" /> Squad · {players.length}
            </p>
            <PlayerList players={players} highlightId={me?.id} />
          </div>

          <XPBar xp={myXp} name={myEntry?.name} />

          {!inRoom ? (
            <form
              onSubmit={handleQuickJoin}
              className="animate-pop-in space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
            >
              <p className="text-center font-display text-lg font-bold">
                You&apos;re spectating on this device
              </p>
              <input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name to join"
                maxLength={24}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300/70 focus:outline-none"
              />
              {error && (
                <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                  {error}
                </p>
              )}
              <Button type="submit" loading={joining ? "Joining..." : false}>
                JOIN GAME
              </Button>
            </form>
          ) : isHost ? (
            <div className="space-y-3">
              <Button
                onClick={handleStart}
                loading={starting ? "Starting game..." : false}
                className={players.length >= 2 ? "animate-glow-pulse" : ""}
              >
                <Play size={18} /> START GAME
              </Button>
              {error && (
                <p className="animate-pop-in rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                  {error}
                </p>
              )}
              <p className="rounded-2xl bg-white/[0.03] px-4 py-3 text-center text-xs font-semibold text-zinc-500">
                {players.length >= 2
                  ? "Squad's here. Unleash the ref."
                  : "Waiting for at least 1 more victim to join..."}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 text-center backdrop-blur">
              <div className="mx-auto flex h-9 w-9 items-center justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-lime-300" />
                ))}
              </div>
              <p className="mt-2 font-display text-base font-bold text-zinc-200">
                WAITING FOR HOST...
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-600">
                You auto-jump in when the game starts.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
