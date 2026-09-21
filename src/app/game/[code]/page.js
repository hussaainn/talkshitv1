"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Gavel, Lock, RotateCcw, Swords } from "lucide-react";
import Button from "@/components/Button";
import XPBar from "@/components/XPBar";
import Avatar from "@/components/Avatar";
import { buzz } from "@/lib/vibrate";
import { fetchRoomByCode, fetchPlayers } from "@/lib/rooms";
import {
  REFEREE_PHASES,
  fromDbPhase,
  fetchRounds,
  fetchMessages,
  postMessage,
  postChunked,
  advancePhase,
  lockTopic,
  hostNextRound,
  applyVerdictScores,
  latestOptions,
  topicVotes,
  latestVerdict,
  allVerdicts,
} from "@/lib/game";
import { refCall } from "@/lib/refereeClient";

const TITLE = {
  RIGHT: "TRUTH HOLDER 👑",
  MID: "FENCE SITTER 🪑",
  WRONG: "GROUP IDIOT 🤡",
};

const inputCls =
  "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-[15px] font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300/70 focus:outline-none focus:ring-2 focus:ring-lime-300/20";

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
  const refBusy = useRef(false);
  const verdicting = useRef(false);

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
      try {
        const r = await fetchRoomByCode(code);
        setRoom(r);
        setPlayers(await fetchPlayers(r.id));
        setRounds(await fetchRounds(r.id));
        setMessages(await fetchMessages(r.id));
        // Never wipe a sticky action error on background polls —
        // otherwise failures look like an infinite spinner.
        if (!silent) setError("");
      } catch (err) {
        if (!silent) setError(err.message || "Could not load the game.");
      } finally {
        setLoading(false);
      }
    },
    [code]
  );

  useEffect(() => {
    if (!code) return;
    load(false);
    const t = setInterval(() => load(true), 3000);
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

  const playerMsgs = useMemo(() => feed.filter((m) => m.kind !== "REF"), [feed]);
  const refMsgs = useMemo(() => feed.filter((m) => m.kind === "REF"), [feed]);

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
      await load(false);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy("");
      setChatText("");
    }
  }

  async function generateOptions() {
    await run("topics", async () => {
      const excludeTitles = rounds.map((r) => r.topic);
      const res = await refCall("topics", { excludeTitles });
      if (res.ai === false) setRefOffline(true);
      const fresh = await fetchMessages(room.id);
      if (latestOptions(fresh).length === 0) {
        await postChunked(room.id, me.id, "OPTS", { options: res.topics });
      }
    });
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
      setError("");
      try {
        const excludeTitles = rounds.map((r) => r.topic);
        const res = await refCall("topics", { excludeTitles });
        if (res.ai === false) setRefOffline(true);
        const fresh = await fetchMessages(room.id);
        if (latestOptions(fresh).length === 0) {
          await postChunked(room.id, me.id, "OPTS", { options: res.topics });
        }
        await load(false);
      } catch (err) {
        setError(err.message || "Could not generate topics.");
      } finally {
        setBusy("");
        generating.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, phase, isHost, options.length]);

  // The ref is a group member, not a button: the host's device auto-replies
  // when 2+ fresh player messages pile up (30s cooldown, max 6 per round).
  // Host-only so two devices never double-post.
  useEffect(() => {
    if (!room || !round || phase !== REFEREE_PHASES.TALK || !isHost) return;
    if (busy || refBusy.current) return;
    if (playerMsgs.length < 2 || refMsgs.length >= 6) return;
    const lastRefTime = refMsgs.length
      ? new Date(refMsgs[refMsgs.length - 1].row.created_at).getTime()
      : new Date(round.created_at).getTime();
    const fresh = playerMsgs.filter(
      (m) => new Date(m.row.created_at).getTime() > lastRefTime
    ).length;
    if (fresh < 2 || Date.now() - lastRefTime < 30000) return;
    refBusy.current = true;
    (async () => {
      setBusy("ref");
      try {
        const res = await refCall("question", {
          topic: round.topic,
          chatLines,
          playerNames: players.map((p) => p.name),
          recentRefLines: refMsgs.slice(-6).map((m) => m.text),
        });
        if (res.ai === false) setRefOffline(true);
        await postMessage(room.id, me.id, `REF:${res.question}`);
        await load(false);
      } catch {
        // Stay silent — next activity window retries.
      } finally {
        setBusy("");
        refBusy.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed, room, round, phase, isHost, busy]);

  // Auto-verdict: 10+ messages then 45s of silence ends the debate.
  // Reset the once-per-round guard whenever the round changes.
  useEffect(() => {
    verdicting.current = false;
  }, [round?.id]);

  useEffect(() => {
    if (!room || !round || phase !== REFEREE_PHASES.TALK || !isHost) return;
    if (busy || verdicting.current || verdict) return;
    if (playerMsgs.length < 10) return;
    const lastPlayer = Math.max(
      ...playerMsgs.map((m) => new Date(m.row.created_at).getTime())
    );
    if (Date.now() - lastPlayer < 45000) return;
    verdicting.current = true;
    handleVerdict().finally(() => {
      verdicting.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed, room, round, phase, isHost, busy, verdict]);

  async function handleVerdict() {
    await run("verdict", async () => {
      await advancePhase(room.id, round.id, REFEREE_PHASES.VERDICT);
      const avoidTruths = allVerdicts(messages)
        .map((v) => v.truth)
        .filter(Boolean);
      const res = await refCall("verdict", {
        topic: round.topic,
        chatLines,
        playerNames: players.map((p) => p.name),
        avoidTruths,
      });
      if (res.ai === false) setRefOffline(true);
      const fresh = await fetchMessages(room.id);
      const start = new Date(round.created_at).getTime();
      const scoped = fresh.filter((m) => new Date(m.row.created_at).getTime() >= start);
      if (!latestVerdict(scoped)) {
        await postChunked(room.id, me.id, "VJ", res.verdict);
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
          className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-zinc-400 transition hover:text-zinc-100"
        >
          <ArrowLeft size={15} /> Lobby
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-zinc-300">
          <Swords size={12} className="text-rose-400" /> Round {room.current_round} · {phase}
        </span>
      </div>

      {refOffline && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center text-xs font-bold text-zinc-500">
          📴 AI ref is offline — running on local chaos.
        </p>
      )}

      {error && (
        <p className="animate-pop-in rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
          {error}
        </p>
      )}

      {/* SELECT */}
      {phase === REFEREE_PHASES.SELECT && (
        <section className="space-y-3">
          <div className="animate-fade-up text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-rose-300">
              The ref demands a topic
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
              Pick your poison
            </h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              Vote. Most votes wins. No mercy.
            </p>
          </div>
          {options.length === 0 ? (
            <div className="animate-pop-in space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur">
              {busy === "topics" ? (
                <>
                  <div className="mx-auto flex h-9 w-9 items-center justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-rose-400" />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-zinc-400">
                    {isHost ? "Ref is cooking up drama..." : "Host is getting topics..."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-zinc-500">No topics yet.</p>
                  {isHost && (
                    <Button variant="secondary" onClick={generateOptions}>
                      GENERATE TOPICS
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="stagger space-y-2.5">
              {options.map((o, idx) => {
                const count = tally[o.id] || 0;
                const share = players.length
                  ? Math.round((count / players.length) * 100)
                  : 0;
                const mine = myVote === o.id;
                const voters = players
                  .filter((p) => tvotes[p.id] === o.id)
                  .map((p) => p.name);
                return (
                  <button
                    key={o.id}
                    disabled={!!busy}
                    onClick={() => {
                      buzz(10);
                      run("vote", () => postMessage(room.id, me.id, `TV:${o.id}`));
                    }}
                    className={`animate-fade-up w-full overflow-hidden rounded-3xl border p-4 text-left transition active:scale-[0.99] disabled:opacity-60 ${
                      mine
                        ? "border-lime-300/60 bg-lime-300/[0.08] shadow-[0_0_30px_-8px_rgba(190,242,100,0.4)]"
                        : "border-white/[0.08] bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-lg bg-white/[0.07] px-2 py-0.5 font-display text-[11px] font-bold text-zinc-400">
                        #{idx + 1}
                      </span>
                      {mine && (
                        <span className="rounded-full bg-lime-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
                          Your pick
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-display text-[17px] font-bold leading-snug text-zinc-50">
                      {o.question}
                    </p>
                    {o.hook && <p className="mt-1 text-xs font-semibold text-zinc-500">{o.hook}</p>}
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          mine ? "bg-lime-300" : "bg-zinc-600"
                        }`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-zinc-500">
                      <span className={mine ? "text-lime-300" : "text-zinc-300"}>
                        {count} vote{count === 1 ? "" : "s"}
                      </span>
                      {voters.length > 0 && ` · ${voters.slice(0, 3).join(", ")}${voters.length > 3 ? "…" : ""}`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          {isHost && options.length > 0 && (
            <Button
              disabled={!topOption || !!busy}
              loading={busy === "lock" ? "Locking..." : false}
              onClick={() => {
                buzz([15, 40, 15]);
                run("lock", () => lockTopic(room, topOption));
              }}
            >
              <Lock size={17} /> LOCK IT IN
            </Button>
          )}
          {!isHost && options.length > 0 && (
            <p className="text-center text-xs font-semibold text-zinc-600">
              Host locks the topic once votes are in.
            </p>
          )}
        </section>
      )}

      {/* TALK */}
      {phase === REFEREE_PHASES.TALK && round && (
        <section className="space-y-3">
          <div className="animate-pop-in relative overflow-hidden rounded-3xl border border-rose-500/25 bg-gradient-to-b from-rose-500/[0.12] to-white/[0.02] p-5">
            <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-rose-500/20 blur-3xl" />
            <span className="rounded-full bg-rose-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
              {round.category || "Chaos"}
            </span>
            <p className="mt-2.5 font-display text-xl font-bold leading-snug">{round.topic}</p>
          </div>

          <div className="space-y-2.5">
            {feed.length === 0 && (
              <p className="py-4 text-center text-xs font-bold text-zinc-600">
                Dead silence. Say something unhinged.
              </p>
            )}
            {feed.map((m) => {
              if (m.kind === "REF") {
                return (
                  <div
                    key={m.row.id}
                    className="animate-pop-in rounded-2xl rounded-tl-md border border-rose-500/30 bg-gradient-to-b from-rose-500/[0.12] to-rose-500/[0.03] p-4"
                  >
                    <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-rose-300">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-rose-400 to-orange-500 text-[10px] text-black">
                        🤖
                      </span>
                      Ref · live
                    </p>
                    <p className="mt-1.5 text-[15px] font-semibold leading-relaxed text-zinc-50">
                      {m.text}
                    </p>
                  </div>
                );
              }
              const mine = m.row.player_id === me.id;
              return (
                <div key={m.row.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  <Avatar name={nameOf(m.row.player_id)} size="sm" />
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      mine
                        ? "rounded-tr-md border border-lime-300/25 bg-lime-300/[0.09]"
                        : "rounded-tl-md border border-white/[0.08] bg-white/[0.04]"
                    }`}
                  >
                    {!mine && (
                      <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                        {nameOf(m.row.player_id)}
                      </p>
                    )}
                    <p className="text-[15px] font-medium leading-relaxed text-zinc-100">
                      {m.text}
                    </p>
                  </div>
                </div>
              );
            })}
            {busy === "ref" && (
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-rose-500/30 bg-rose-500/[0.07] p-4">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-rose-300" />
                  ))}
                </span>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">
                  Ref is typing...
                </p>
              </div>
            )}
          </div>

          <div className="sticky bottom-3 space-y-2.5 rounded-3xl border border-white/10 bg-[#0c0c12]/90 p-2.5 shadow-2xl backdrop-blur-xl">
            <div className="flex gap-2">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value.slice(0, 500))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && chatText.trim() && !busy) {
                    buzz(8);
                    run("chat", () => postMessage(room.id, me.id, `SAY:${chatText.trim()}`));
                  }
                }}
                placeholder="Drop your take..."
                className={inputCls}
              />
              <button
                disabled={!chatText.trim() || !!busy}
                onClick={() => {
                  buzz(8);
                  run("chat", () => postMessage(room.id, me.id, `SAY:${chatText.trim()}`));
                }}
                className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-lime-200 to-lime-300 px-4 text-black transition active:scale-95 disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>
            {isHost ? (
              <Button
                variant="danger"
                size="md"
                disabled={!!busy}
                loading={busy === "verdict" ? "Judging..." : false}
                onClick={() => {
                  buzz([20, 40, 20]);
                  handleVerdict();
                }}
              >
                <Gavel size={16} /> END DEBATE
              </Button>
            ) : (
              <p className="pb-1 text-center text-[11px] font-bold text-zinc-600">
                Verdict drops automatically — or the host ends it
              </p>
            )}
          </div>
        </section>
      )}

      {/* VERDICT (transient) */}
      {phase === REFEREE_PHASES.VERDICT && (
        <section className="animate-pop-in rounded-3xl border border-amber-300/25 bg-gradient-to-b from-amber-400/[0.08] to-transparent p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-amber-300/20 border-t-amber-300" />
          <p className="mt-4 font-display text-xl font-bold">REF IS JUDGING YOU...</p>
          <p className="mt-1 text-xs font-bold text-zinc-500">Pray your take wasn&apos;t trash.</p>
        </section>
      )}

      {/* RESULTS */}
      {phase === REFEREE_PHASES.RESULTS && (
        <section className="space-y-3">
          {!verdict ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/[0.04]" />
              ))}
              <p className="text-center text-xs font-bold text-zinc-600">
                Waiting for the verdict...
              </p>
            </div>
          ) : (
            <>
              <div className="animate-pop-in relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-b from-amber-400/[0.1] to-white/[0.02] p-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">
                  ⚖️ The truth
                </p>
                <p className="mt-2 font-display text-lg font-bold leading-snug">{verdict.truth}</p>
                {verdict.wildest && (
                  <p className="mt-2.5 rounded-xl bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-400">
                    🌶️ {verdict.wildest}
                  </p>
                )}
              </div>
              <div className="stagger space-y-2">
                {(verdict.takes || []).map((t, i) => {
                  const meTake =
                    players.find(
                      (p) => p.name.trim().toLowerCase() === (t.name || "").trim().toLowerCase()
                    )?.id === me.id;
                  return (
                    <div
                      key={i}
                      className={`animate-fade-up rounded-2xl border p-4 backdrop-blur ${
                        t.call === "RIGHT"
                          ? "border-lime-300/30 bg-lime-300/[0.05]"
                          : t.call === "WRONG"
                            ? "border-rose-500/30 bg-rose-500/[0.06]"
                            : "border-white/[0.08] bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={t.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display font-bold">
                            {t.name}
                            {meTake && (
                              <span className="ml-1.5 text-[10px] font-black text-zinc-500">YOU</span>
                            )}
                          </span>
                          <span className="block text-[11px] font-bold text-zinc-500">
                            {TITLE[t.call] || ""}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-xl px-2.5 py-1.5 text-center text-[11px] font-black leading-tight ${
                            t.call === "RIGHT"
                              ? "bg-lime-300 text-black"
                              : t.call === "WRONG"
                                ? "bg-rose-500 text-black"
                                : "bg-white/10 text-zinc-200"
                          }`}
                        >
                          {t.call}
                          <span className="block text-[10px]">+{t.points + 20}</span>
                        </span>
                      </div>
                      {t.roast && (
                        <p className="mt-2 rounded-xl bg-black/30 px-3 py-2 text-[13px] font-medium text-zinc-300">
                          🤖 {t.roast}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  🏆 Table ranking
                </p>
                <div className="mt-2.5 space-y-2">
                  {[...players]
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((p, i) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 ${
                          i === 0 ? "bg-amber-300/[0.08] ring-1 ring-amber-300/25" : ""
                        }`}
                      >
                        <span className="w-7 text-center font-display text-base font-bold">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                        </span>
                        <Avatar name={p.name} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-100">
                          {p.name}
                          {p.id === me.id && (
                            <span className="ml-1.5 text-[10px] font-black text-zinc-500">YOU</span>
                          )}
                        </span>
                        <span className="font-display text-sm font-bold tabular-nums text-lime-300">
                          {(p.score || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
          <XPBar xp={myEntry?.score ?? 0} name={myEntry?.name} />
          {isHost && xpDone && (
            <Button
              loading={busy === "next" ? "Starting..." : false}
              onClick={() => {
                buzz([15, 40, 15]);
                run("next", () => hostNextRound(room));
              }}
            >
              <RotateCcw size={17} /> NEXT ROUND
            </Button>
          )}
          {!isHost && (
            <p className="pb-2 text-center text-xs font-semibold text-zinc-600">
              Waiting for host to start the next round...
            </p>
          )}
        </section>
      )}
    </main>
  );
}
