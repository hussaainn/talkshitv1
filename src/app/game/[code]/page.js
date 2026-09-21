"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Gavel, Sparkles } from "lucide-react";
import Button from "@/components/Button";
import XPBar from "@/components/XPBar";
import { fetchRoomByCode, fetchPlayers } from "@/lib/rooms";
import {
  REFEREE_PHASES,
  fromDbPhase,
  fetchRounds,
  fetchMessages,
  postMessage,
  advancePhase,
  lockTopic,
  hostNextRound,
  applyVerdictScores,
  latestOptions,
  topicVotes,
  latestVerdict,
} from "@/lib/game";
import { refCall } from "@/lib/refereeClient";

const inputCls =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300 focus:outline-none";

export default function GamePage({ params }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [me, setMe] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [chatText, setChatText] = useState("");
  const [refOffline, setRefOffline] = useState(false);
  const generating = useRef(false);

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
      setPlayers(await fetchPlayers(r.id));
      setRounds(await fetchRounds(r.id));
      setMessages(await fetchMessages(r.id));
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

  // Talk messages: everything since this round was locked.
  const roundMessages = useMemo(() => {
    if (!round) return [];
    const start = new Date(round.created_at).getTime();
    return messages.filter((m) => new Date(m.row.created_at).getTime() >= start);
  }, [messages, round]);

  // Selection messages: everything since the previous round (no round row yet).
  const selectionMessages = useMemo(() => {
    const older = rounds.filter((x) => x.round_number < (room?.current_round || 1));
    const cutoff = older.length
      ? Math.max(...older.map((x) => new Date(x.created_at).getTime()))
      : 0;
    return messages.filter((m) => new Date(m.row.created_at).getTime() > cutoff);
  }, [messages, rounds, room]);

  const options = useMemo(() => latestOptions(selectionMessages), [selectionMessages]);
  const tvotes = useMemo(() => topicVotes(selectionMessages), [selectionMessages]);
  const verdict = useMemo(() => latestVerdict(roundMessages), [roundMessages]);
  const xpDone = useMemo(() => roundMessages.some((m) => m.kind === "XP"), [roundMessages]);

  const feed = useMemo(
    () => roundMessages.filter((m) => ["REF", "SAY", "ARG"].includes(m.kind)),
    [roundMessages]
  );

  const myEntry = me && players.find((p) => p.id === me.id);
  const isHost = !!myEntry?.is_host;
  const phase = fromDbPhase(room?.current_phase || REFEREE_PHASES.SELECT);
  const nameOf = (pid) => players.find((p) => p.id === pid)?.name || "Someone";

  const chatLines = useMemo(
    () =>
      feed
        .filter((m) => m.kind !== "REF")
        .map((m) => `${nameOf(m.row.player_id)}: ${m.kind === "ARG" ? m.text : m.text}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feed, players]
  );

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
      setChatText("");
    }
  }

  // Host auto-generates 3 topic options when entering SELECT with none.
  useEffect(() => {
    if (
      !room ||
      phase !== REFEREE_PHASES.SELECT ||
      !isHost ||
      options.length > 0 ||
      generating.current ||
      busy
    )
      return;
    generating.current = true;
    (async () => {
      setBusy("topics");
      try {
        const excludeTitles = rounds.map((r) => r.topic);
        const res = await refCall("topics", { excludeTitles });
        if (res.ai === false) setRefOffline(true);
        const fresh = await fetchMessages(room.id);
        if (latestOptions(fresh).length === 0) {
          await postMessage(room.id, me.id, `OPTS:${JSON.stringify({ options: res.topics })}`);
        }
        await load();
      } catch (err) {
        setError(err.message || "Could not generate topics.");
      } finally {
        setBusy("");
        generating.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, phase, isHost, options.length]);

  async function handleAskRef() {
    await run("ref", async () => {
      const res = await refCall("question", {
        topic: round.topic,
        chatLines,
        playerNames: players.map((p) => p.name),
      });
      if (res.ai === false) setRefOffline(true);
      await postMessage(room.id, me.id, `REF:${res.question}`);
    });
  }

  async function handleVerdict() {
    await run("verdict", async () => {
      await advancePhase(room.id, round.id, REFEREE_PHASES.VERDICT);
      const res = await refCall("verdict", {
        topic: round.topic,
        chatLines,
        playerNames: players.map((p) => p.name),
      });
      if (res.ai === false) setRefOffline(true);
      const fresh = await fetchMessages(room.id);
      const start = new Date(round.created_at).getTime();
      const scoped = fresh.filter((m) => new Date(m.row.created_at).getTime() >= start);
      if (!latestVerdict(scoped)) {
        await postMessage(room.id, me.id, `VJ:${JSON.stringify(res.verdict)}`);
      }
      const after = await fetchMessages(room.id);
      const scopedAfter = after.filter(
        (m) => new Date(m.row.created_at).getTime() >= start
      );
      if (!scopedAfter.some((m) => m.kind === "XP")) {
        const v = latestVerdict(scopedAfter);
        await applyVerdictScores(room.id, players, v);
      }
      await advancePhase(room.id, round.id, REFEREE_PHASES.RESULTS);
    });
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Entering the chaos...
      </main>
    );
  }

  if (!me) {
    return (
      <main className="flex flex-1 flex-col gap-4 pt-10 text-center">
        <p className="text-sm text-zinc-400">Join the room first to play.</p>
        <Link href="/join">
          <Button variant="secondary">JOIN ROOM</Button>
        </Link>
      </main>
    );
  }

  if (!room || room.status === "LOBBY") {
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

  const myVote = me ? tvotes[me.id] : undefined;
  const tally = {};
  for (const oid of Object.values(tvotes)) tally[oid] = (tally[oid] || 0) + 1;
  const topOption =
    options.length > 0
      ? [...options].sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0))[0]
      : null;

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
          Round {room.current_round} · {phase}
        </span>
      </div>

      {refOffline && (
        <p className="rounded-xl bg-zinc-900 px-4 py-2 text-center text-xs font-semibold text-zinc-500">
          📴 AI ref is offline — running on local chaos.
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {error}
        </p>
      )}

      {/* SELECT */}
      {phase === REFEREE_PHASES.SELECT && (
        <section className="space-y-3">
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight">Pick your poison</h2>
            <p className="text-sm text-zinc-500">Vote. Most votes wins. No mercy.</p>
          </div>
          {busy === "topics" || options.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 p-6 text-center text-sm text-zinc-500">
              {isHost ? "Ref is cooking up drama..." : "Host is getting topics..."}
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((o) => (
                <button
                  key={o.id}
                  disabled={!!busy}
                  onClick={() => run("vote", () => postMessage(room.id, me.id, `TV:${o.id}`))}
                  className={`w-full rounded-2xl border p-4 text-left transition active:scale-[0.99] disabled:opacity-60 ${
                    myVote === o.id
                      ? "border-lime-300 bg-lime-300/10"
                      : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  <p className="font-extrabold text-zinc-100">{o.question}</p>
                  {o.hook && <p className="mt-1 text-xs text-zinc-500">{o.hook}</p>}
                  <p className="mt-2 text-xs font-black text-lime-300">
                    {tally[o.id] || 0} vote{(tally[o.id] || 0) === 1 ? "" : "s"}
                    {myVote === o.id ? " · YOUR PICK" : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
          {isHost && options.length > 0 && (
            <Button
              disabled={!topOption || !!busy}
              loading={busy === "lock" ? "Locking..." : false}
              onClick={() => run("lock", () => lockTopic(room, topOption))}
            >
              LOCK IT IN
            </Button>
          )}
          {!isHost && (
            <p className="text-center text-xs text-zinc-600">
              Host locks the topic once votes are in.
            </p>
          )}
        </section>
      )}

      {/* TALK */}
      {phase === REFEREE_PHASES.TALK && round && (
        <section className="space-y-3">
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-red-300">
              {round.category || "Chaos"}
            </span>
            <p className="mt-3 text-xl font-extrabold leading-snug">{round.topic}</p>
          </div>

          <div className="space-y-2">
            {feed.length === 0 && (
              <p className="text-center text-xs text-zinc-600">
                Dead silence. Say something unhinged.
              </p>
            )}
            {feed.map((m) =>
              m.kind === "REF" ? (
                <div
                  key={m.row.id}
                  className="rounded-2xl border border-lime-300/30 bg-lime-300/5 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-widest text-lime-300">
                    🤖 REF
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">{m.text}</p>
                </div>
              ) : (
                <p key={m.row.id} className="px-1 text-sm text-zinc-300">
                  <b className="text-zinc-100">{nameOf(m.row.player_id)}:</b> {m.text}
                </p>
              )
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value.slice(0, 500))}
              placeholder="Drop your take..."
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

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              disabled={!!busy}
              loading={busy === "ref" ? "Ref is typing..." : false}
              onClick={handleAskRef}
            >
              <Sparkles size={16} /> ASK REF
            </Button>
            {isHost ? (
              <Button
                disabled={!!busy}
                loading={busy === "verdict" ? "Judging..." : false}
                onClick={handleVerdict}
              >
                <Gavel size={16} /> END + VERDICT
              </Button>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-zinc-800 px-4 text-center text-xs font-bold text-zinc-500">
                Host ends the debate
              </div>
            )}
          </div>
        </section>
      )}

      {/* VERDICT (transient) */}
      {phase === REFEREE_PHASES.VERDICT && (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-lime-300 border-t-transparent" />
          <p className="mt-3 font-black">REF IS JUDGING YOU...</p>
          <p className="mt-1 text-xs text-zinc-500">Pray your take wasn&apos;t trash.</p>
        </section>
      )}

      {/* RESULTS */}
      {phase === REFEREE_PHASES.RESULTS && (
        <section className="space-y-3">
          {!verdict ? (
            <p className="rounded-2xl border border-zinc-800 p-6 text-center text-sm text-zinc-500">
              Waiting for the verdict...
            </p>
          ) : (
            <>
              <div className="rounded-3xl border border-lime-300/30 bg-lime-300/5 p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                  ⚖️ The truth
                </p>
                <p className="mt-2 font-extrabold leading-snug">{verdict.truth}</p>
                {verdict.wildest && (
                  <p className="mt-2 text-xs text-zinc-500">🌶️ {verdict.wildest}</p>
                )}
              </div>
              <div className="space-y-2">
                {(verdict.takes || []).map((t, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black">{t.name}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          t.call === "RIGHT"
                            ? "bg-lime-300/15 text-lime-300"
                            : t.call === "WRONG"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {t.call} · +{t.points + 20}
                      </span>
                    </div>
                    {t.roast && (
                      <p className="mt-1 text-sm text-zinc-400">🤖 {t.roast}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <XPBar xp={myEntry?.score ?? 0} />
          {isHost && xpDone && (
            <Button
              variant="secondary"
              loading={busy === "next" ? "Starting..." : false}
              onClick={() => run("next", () => hostNextRound(room))}
            >
              NEXT ROUND
            </Button>
          )}
          {!isHost && (
            <p className="text-center text-xs text-zinc-600">
              Waiting for host to start the next round...
            </p>
          )}
        </section>
      )}
    </main>
  );
}
