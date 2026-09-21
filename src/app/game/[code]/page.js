"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Button from "@/components/Button";
import TopicCard from "@/components/TopicCard";
import PhaseIndicator from "@/components/PhaseIndicator";
import XPBar from "@/components/XPBar";
import { fetchRoomByCode, fetchPlayers } from "@/lib/rooms";
import {
  fetchRounds,
  fetchVotes,
  fetchMessages,
  castVote,
  postMessage,
  advancePhase,
  hostNextRound,
  awardXp,
  picksFromVotes,
  finalsFromVotes,
} from "@/lib/game";
import { LocalContentProvider } from "@/game/contentProvider";
import { GAME_PHASES } from "@/game/gameEngine";
import { calculateRoundXp } from "@/game/scoring";

const inputCls =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300 focus:outline-none";

export default function GamePage({ params }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [me, setMe] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [votes, setVotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [argText, setArgText] = useState("");
  const [counterText, setCounterText] = useState("");
  const [targetId, setTargetId] = useState("");
  const [chatText, setChatText] = useState("");

  useEffect(() => {
    Promise.resolve(params).then((p) => setCode((p?.code || "").toUpperCase()));
    try {
      const raw = localStorage.getItem("talkshit-player");
      if (raw) setMe(JSON.parse(raw));
    } catch {
      setMe(null);
    }
  }, [params]);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      const r = await fetchRoomByCode(code);
      setRoom(r);
      const ps = await fetchPlayers(r.id);
      setPlayers(ps);
      const rs = await fetchRounds(r.id);
      setRounds(rs);
      const cur =
        rs.find((x) => x.round_number === r.current_round) || rs[rs.length - 1];
      if (cur) {
        setVotes(await fetchVotes(cur.id));
        setMessages(await fetchMessages(r.id));
      }
      setError("");
    } catch (err) {
      setError(err.message || "Could not load the game.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [code, load]);

  const round = useMemo(
    () =>
      rounds.find((x) => x.round_number === room?.current_round) ||
      rounds[rounds.length - 1] ||
      null,
    [rounds, room]
  );

  const topic = useMemo(() => {
    if (!round) return null;
    return (
      LocalContentProvider.byId(round.topic) || {
        id: round.topic,
        category: round.category || "Custom",
        question: round.topic,
        sides: ["SIDE A", "SIDE B"],
        curveballs: [" minds changed?"],
      }
    );
  }, [round]);

  const curveball = useMemo(() => {
    if (!topic?.curveballs?.length || !round) return null;
    return topic.curveballs[(round.round_number - 1) % topic.curveballs.length];
  }, [topic, round]);

  // Messages are room-scoped in the DB — scope to this round by timestamp.
  const roundMessages = useMemo(() => {
    if (!round) return [];
    const start = new Date(round.created_at).getTime();
    return messages.filter((m) => new Date(m.row.created_at).getTime() >= start);
  }, [messages, round]);

  const args = useMemo(() => roundMessages.filter((m) => m.kind === "ARG"), [roundMessages]);
  const counters = useMemo(() => roundMessages.filter((m) => m.kind === "CH"), [roundMessages]);
  const switches = useMemo(() => roundMessages.filter((m) => m.kind === "SW"), [roundMessages]);
  const chats = useMemo(
    () => messages.filter((m) => m.kind === "SAY").slice(-20),
    [messages]
  );
  const xpAwarded = useMemo(
    () => roundMessages.some((m) => m.kind === "XP"),
    [roundMessages]
  );

  const picks = useMemo(() => picksFromVotes(votes), [votes]);
  const finals = useMemo(() => finalsFromVotes(votes), [votes]);

  const myEntry = me && players.find((p) => p.id === me.id);
  const isHost = !!myEntry?.is_host;
  const phase = room?.current_phase || GAME_PHASES.PICK;
  const myPick = me ? picks[me.id] : undefined;
  const myFinal = me ? finals[me.id] : undefined;
  const myArg = me && args.find((a) => a.row.player_id === me.id);
  const nameOf = (pid) => players.find((p) => p.id === pid)?.name || "Someone";

  async function run(label, fn) {
    if (busy) return;
    setBusy(label);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy("");
      setArgText("");
      setCounterText("");
      setChatText("");
    }
  }

  // ---- Results math ----
  const results = useMemo(() => {
    const counts = [0, 0];
    let switched = 0;
    let stayed = 0;
    for (const [pid, side] of Object.entries(finals)) {
      counts[side] = (counts[side] || 0) + 1;
      if (picks[pid] !== undefined) {
        if (picks[pid] !== side) switched += 1;
        else stayed += 1;
      }
    }
    const winner = counts[0] === counts[1] ? null : counts[0] > counts[1] ? 0 : 1;
    return { counts, switched, stayed, winner };
  }, [finals, picks]);

  const xpPreview = useMemo(() => {
    const events = {};
    for (const p of players) {
      events[p.id] = {
        participated: picks[p.id] !== undefined,
        argued: args.some((a) => a.row.player_id === p.id),
        challenged: counters.some((c) => c.row.player_id === p.id),
        voted: finals[p.id] !== undefined,
        switched:
          picks[p.id] !== undefined &&
          finals[p.id] !== undefined &&
          picks[p.id] !== finals[p.id],
        won: results.winner !== null && finals[p.id] === results.winner,
      };
    }
    return calculateRoundXp({ playerIds: players.map((p) => p.id), events });
  }, [players, picks, finals, args, counters, results]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading game...
      </main>
    );
  }

  if (!me) {
    return (
      <main className="flex flex-1 flex-col gap-4 pt-10 text-center">
        <p className="text-sm text-zinc-400">Join the room first to play.</p>
        <Link href={`/join`}>
          <Button variant="secondary">JOIN ROOM</Button>
        </Link>
      </main>
    );
  }

  if (!room || !round || room.status === "LOBBY") {
    return (
      <main className="flex flex-1 flex-col gap-4 pt-10 text-center">
        <p className="text-sm text-zinc-400">The game hasn&apos;t started yet.</p>
        {code && (
          <Link href={`/room/${code}`}>
            <Button variant="secondary">Back to lobby</Button>
          </Link>
        )}
      </main>
    );
  }

  const allPicked = players.length > 0 && players.every((p) => picks[p.id] !== undefined);
  const allFinal = players.length > 0 && players.every((p) => finals[p.id] !== undefined);
  const sides = topic?.sides || ["SIDE A", "SIDE B"];

  return (
    <main className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/room/${code}`)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500"
        >
          <ArrowLeft size={16} /> Lobby
        </button>
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
          {code} · {players.length} players
        </span>
      </div>

      <PhaseIndicator current={phase} />
      <TopicCard topic={topic} roundNumber={round.round_number} />
      <XPBar xp={myEntry?.score ?? 0} />

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {error}
        </p>
      )}

      {/* PICK */}
      {phase === GAME_PHASES.PICK && (
        <section className="space-y-3">
          {myPick === undefined ? (
            <div className="grid grid-cols-2 gap-3">
              {sides.map((side, i) => (
                <button
                  key={side}
                  disabled={!!busy}
                  onClick={() => run("pick", () => castVote(round.id, me.id, i))}
                  className="rounded-2xl bg-lime-300 px-4 py-5 text-base font-black text-black active:scale-[0.98] disabled:opacity-50"
                >
                  {busy === "pick" ? "..." : side}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-lime-300/30 bg-lime-300/10 p-4 text-center text-sm font-bold text-lime-200">
              Locked: {sides[myPick]}. Waiting for{" "}
              {players.filter((p) => picks[p.id] === undefined).length} more...
            </p>
          )}
          {isHost && (
            <Button
              variant="secondary"
              disabled={!allPicked || !!busy}
              loading={busy === "advance" ? "Advancing..." : false}
              onClick={() => run("advance", () => advancePhase(room.id, round.id, GAME_PHASES.DEFEND))}
            >
              NEXT: DEFEND {allPicked ? "" : `(${Object.keys(picks).length}/${players.length})`}
            </Button>
          )}
        </section>
      )}

      {/* DEFEND */}
      {phase === GAME_PHASES.DEFEND && (
        <section className="space-y-3">
          {!myArg ? (
            <div className="space-y-2">
              <textarea
                value={argText}
                onChange={(e) => setArgText(e.target.value.slice(0, 500))}
                placeholder="Why is your side correct?"
                rows={3}
                className={inputCls}
              />
              <Button
                disabled={!argText.trim() || !!busy}
                loading={busy === "arg" ? "Submitting..." : false}
                onClick={() => run("arg", () => postMessage(room.id, me.id, `ARG:${argText.trim()}`))}
              >
                SUBMIT ARGUMENT
              </Button>
            </div>
          ) : (
            <p className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-center text-sm font-bold text-zinc-300">
              Argument in. +30 XP at results.
            </p>
          )}
          <div className="space-y-2">
            {args.map((a) => (
              <div key={a.row.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-lime-300">
                  {nameOf(a.row.player_id)} · {sides[picks[a.row.player_id]] ?? ""}
                </p>
                <p className="mt-1 text-sm text-zinc-200">{a.text}</p>
              </div>
            ))}
          </div>
          {isHost && (
            <Button
              variant="secondary"
              loading={busy === "advance" ? "Advancing..." : false}
              onClick={() => run("advance", () => advancePhase(room.id, round.id, GAME_PHASES.ATTACK))}
            >
              NEXT: ATTACK
            </Button>
          )}
        </section>
      )}

      {/* ATTACK */}
      {phase === GAME_PHASES.ATTACK && (
        <section className="space-y-3">
          <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Challenge
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className={inputCls}
            >
              <option value="">Pick a player...</option>
              {players
                .filter((p) => p.id !== me.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <textarea
              value={counterText}
              onChange={(e) => setCounterText(e.target.value.slice(0, 500))}
              placeholder="What's wrong with their argument?"
              rows={2}
              className={inputCls}
            />
            <Button
              disabled={!targetId || !counterText.trim() || !!busy}
              loading={busy === "counter" ? "Sending..." : false}
              onClick={() =>
                run("counter", () =>
                  postMessage(room.id, me.id, `CH:${targetId}:${counterText.trim()}`)
                )
              }
            >
              SEND COUNTER
            </Button>
          </div>
          <div className="space-y-2">
            {counters.map((c) => (
              <div key={c.row.id} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-red-300">
                  {nameOf(c.row.player_id)} → {nameOf(c.targetId)}
                </p>
                <p className="mt-1 text-sm text-zinc-200">{c.text}</p>
              </div>
            ))}
          </div>
          {isHost && (
            <Button
              variant="secondary"
              loading={busy === "advance" ? "Advancing..." : false}
              onClick={() => run("advance", () => advancePhase(room.id, round.id, GAME_PHASES.CURVEBALL))}
            >
              NEXT: CURVEBALL
            </Button>
          )}
        </section>
      )}

      {/* CURVEBALL */}
      {phase === GAME_PHASES.CURVEBALL && (
        <section className="space-y-3">
          <div className="rounded-3xl border border-lime-300/30 bg-lime-300/5 p-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
              Curveball
            </p>
            <p className="mt-2 text-lg font-extrabold">{curveball}</p>
            <p className="mt-1 text-sm text-zinc-400">Does your answer change?</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={!!busy}
              onClick={() => run("sw", () => postMessage(room.id, me.id, `SW:${myPick ?? 0}`))}
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-sm font-black text-zinc-100 disabled:opacity-50"
            >
              KEEP MY SIDE
            </button>
            <button
              disabled={!!busy || myPick === undefined}
              onClick={() => run("sw", () => postMessage(room.id, me.id, `SW:${myPick === 0 ? 1 : 0}`))}
              className="rounded-2xl bg-lime-300 px-4 py-4 text-sm font-black text-black disabled:opacity-50"
            >
              SWITCH (+50 XP)
            </button>
          </div>
          {switches.length > 0 && (
            <p className="text-center text-xs text-zinc-500">
              Declared: {switches.filter((s) => s.side !== picks[s.row.player_id]).length} switched ·{" "}
              {switches.filter((s) => s.side === picks[s.row.player_id]).length} stayed
            </p>
          )}
          {isHost && (
            <Button
              variant="secondary"
              loading={busy === "advance" ? "Advancing..." : false}
              onClick={() => run("advance", () => advancePhase(room.id, round.id, GAME_PHASES.FINAL))}
            >
              NEXT: FINAL VOTE
            </Button>
          )}
        </section>
      )}

      {/* FINAL */}
      {phase === GAME_PHASES.FINAL && (
        <section className="space-y-3">
          {myFinal === undefined ? (
            <div className="grid grid-cols-2 gap-3">
              {sides.map((side, i) => (
                <button
                  key={side}
                  disabled={!!busy}
                  onClick={() => run("final", () => castVote(round.id, me.id, i))}
                  className="rounded-2xl bg-lime-300 px-4 py-5 text-base font-black text-black active:scale-[0.98] disabled:opacity-50"
                >
                  {busy === "final" ? "..." : side}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-lime-300/30 bg-lime-300/10 p-4 text-center text-sm font-bold text-lime-200">
              Final: {sides[myFinal]}. Waiting for{" "}
              {players.filter((p) => finals[p.id] === undefined).length} more...
            </p>
          )}
          {isHost && (
            <Button
              variant="secondary"
              disabled={!allFinal || !!busy}
              loading={busy === "advance" ? "Revealing..." : false}
              onClick={() => run("advance", () => advancePhase(room.id, round.id, GAME_PHASES.RESULTS))}
            >
              SHOW RESULTS {allFinal ? "" : `(${Object.keys(finals).length}/${players.length})`}
            </Button>
          )}
        </section>
      )}

      {/* RESULTS */}
      {phase === GAME_PHASES.RESULTS && (
        <section className="space-y-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              Round {round.round_number} complete
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {sides.map((side, i) => (
                <div key={side} className="rounded-2xl bg-zinc-900 p-4">
                  <p className="text-3xl font-black text-lime-300">{results.counts[i] || 0}</p>
                  <p className="text-xs font-black">{side}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Changed mind: {results.switched} · Stayed firm: {results.stayed}
              {results.winner !== null && ` · Winner: ${sides[results.winner]}`}
            </p>
          </div>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3"
              >
                <span className="font-bold">{p.name}</span>
                <span className="text-sm font-black text-lime-300">
                  +{xpPreview[p.id] || 0} XP
                </span>
              </div>
            ))}
          </div>
          {isHost && !xpAwarded && (
            <Button
              loading={busy === "xp" ? "Awarding..." : false}
              onClick={() => run("xp", () => awardXp(room.id, players, xpPreview))}
            >
              AWARD XP
            </Button>
          )}
          {isHost && xpAwarded && (
            <Button
              variant="secondary"
              loading={busy === "next" ? "Starting..." : false}
              onClick={() => run("next", () => hostNextRound(room))}
            >
              NEXT ROUND
            </Button>
          )}
          {!isHost && !xpAwarded && (
            <p className="text-center text-xs text-zinc-500">Host is awarding XP...</p>
          )}
          {!isHost && xpAwarded && (
            <p className="text-center text-xs text-zinc-500">Waiting for host to start next round...</p>
          )}
        </section>
      )}

      {/* Light chat */}
      <section className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Table talk</p>
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {chats.length === 0 && (
            <p className="text-xs text-zinc-600">Quiet... too quiet.</p>
          )}
          {chats.map((c) => (
            <p key={c.row.id} className="text-sm text-zinc-300">
              <b className="text-zinc-100">{nameOf(c.row.player_id)}:</b> {c.text}
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value.slice(0, 200))}
            placeholder="Say something..."
            className={inputCls}
          />
          <button
            disabled={!chatText.trim() || !!busy}
            onClick={() => run("chat", () => postMessage(room.id, me.id, `SAY:${chatText.trim()}`))}
            className="shrink-0 rounded-2xl bg-zinc-800 px-4 text-zinc-100 disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}
