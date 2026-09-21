import { supabase, isSupabaseConfigured } from "./supabase";
import { GAME_PHASES } from "@/game/gameEngine";

// Referee-chaos loop phases. The old PICK/DEFEND/ATTACK loop in gameEngine.js
// is deprecated — the AI ref runs SELECT → TALK → VERDICT → RESULTS.
//
// DB COMPAT: rooms/rounds have a check constraint that only allows the
// legacy values (LOBBY/PICK/DEFEND/ATTACK/CURVEBALL/FINAL/RESULTS).
// We map referee phases onto allowed values in exactly one place.
// (If the constraint is ever widened in Supabase, change the map below.)
export const REFEREE_PHASES = {
  SELECT: "SELECT",
  TALK: "TALK",
  VERDICT: "VERDICT",
  RESULTS: "RESULTS",
};

const TO_DB = { SELECT: "PICK", TALK: "DEFEND", VERDICT: "FINAL", RESULTS: "RESULTS" };
const FROM_DB = { PICK: "SELECT", DEFEND: "TALK", FINAL: "VERDICT" };

export function toDbPhase(phase) {
  return TO_DB[phase] || phase;
}

export function fromDbPhase(dbPhase) {
  if (dbPhase === "RESULTS" || dbPhase === "LOBBY") return dbPhase;
  return FROM_DB[dbPhase] || dbPhase;
}

function fail(message) {
  return new Error(message);
}

function needDb() {
  if (!isSupabaseConfigured || !supabase) throw fail("Server not connected.");
}

// Message protocol (messages table carries game entries + light chat).
// NOTE: the DB enforces messages.message <= ~500 chars, so JSON payloads
// (OPTS/VJ) are split into chunks: TAG:<total>:<idx>:<chunk> and reassembled.
//   OPTS chunks          — topic options {options:[{id,question,hook,category}]}
//   TV:<optionId>        — topic vote (latest per player counts)
//   ARG:<text>            — talk entry (kept for history)
//   REF:<text>            — referee message (question / correction / hype)
//   VJ chunks            — verdict payload {truth,takes,wildest}
//   XP:done               — marker: scores for this round already applied
//   SAY:<text>            — free chat
export function parseMessage(row) {
  const raw = row.message || "";
  // Chunked payload part: TAG:total:idx:chunk
  const part = raw.match(/^(OPTS|VJ):(\d+):(\d+):([\s\S]*)$/);
  if (part) {
    return {
      kind: "PART",
      tag: part[1],
      total: Number(part[2]),
      idx: Number(part[3]),
      chunk: part[4],
      row,
    };
  }
  if (raw.startsWith("TV:")) return { kind: "TV", optionId: raw.slice(3), row };
  if (raw.startsWith("ARG:")) return { kind: "ARG", text: raw.slice(4), row };
  if (raw.startsWith("REF:")) return { kind: "REF", text: raw.slice(4), row };
  if (raw.startsWith("VJ:")) {
    try {
      return { kind: "VJ", verdict: JSON.parse(raw.slice(3)), row };
    } catch {
      return { kind: "VJ", verdict: null, row };
    }
  }
  if (raw.startsWith("CH:")) {
    const rest = raw.slice(3);
    const i = rest.indexOf(":");
    return {
      kind: "CH",
      targetId: i === -1 ? "" : rest.slice(0, i),
      text: i === -1 ? rest : rest.slice(i + 1),
      row,
    };
  }
  if (raw.startsWith("SW:")) return { kind: "SW", side: Number(raw.slice(3)), row };
  if (raw === "XP:done") return { kind: "XP", row };
  if (raw.startsWith("SAY:")) return { kind: "SAY", text: raw.slice(4), row };
  return { kind: "SAY", text: raw, row };
}

// ---- Rounds ----

export async function fetchRounds(roomId) {
  needDb();
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("room_id", roomId)
    .order("round_number", { ascending: true });
  if (error) throw fail("Could not load rounds.");
  return data || [];
}

export async function hostStartGame(room, players) {
  needDb();
  if (players.length < 2) throw fail("Need at least 2 players to start.");
  // No round yet — the group votes on a topic first (SELECT phase).
  const { error } = await supabase
    .from("rooms")
    .update({
      status: "PLAYING",
      current_round: 1,
      current_phase: toDbPhase(REFEREE_PHASES.SELECT),
    })
    .eq("id", room.id);
  if (error) throw fail("Could not start the game. Try again.");
  return true;
}

// Lock the voted topic: creates the round and opens TALK.
export async function lockTopic(room, option) {
  needDb();
  if (!option?.question) throw fail("Pick a topic first.");
  const { data: round, error } = await supabase
    .from("rounds")
    .insert({
      room_id: room.id,
      round_number: room.current_round || 1,
      topic: option.question,
      category: option.category || "Chaos",
      current_phase: toDbPhase(REFEREE_PHASES.TALK),
    })
    .select()
    .single();
  if (error) throw fail("Could not lock the topic.");
  await supabase
    .from("rooms")
    .update({ current_phase: toDbPhase(REFEREE_PHASES.TALK) })
    .eq("id", room.id);
  return round;
}

export async function hostNextRound(room) {
  needDb();
  const next = (room.current_round || 1) + 1;
  const { error } = await supabase
    .from("rooms")
    .update({ current_round: next, current_phase: toDbPhase(REFEREE_PHASES.SELECT) })
    .eq("id", room.id);
  if (error) throw fail("Could not start the next round.");
  return next;
}

export async function advancePhase(roomId, roundId, nextPhase) {
  needDb();
  const dbPhase = toDbPhase(nextPhase);
  const r1 = await supabase.from("rooms").update({ current_phase: dbPhase }).eq("id", roomId);
  if (r1.error) throw fail("Could not advance the phase.");
  if (roundId) {
    await supabase.from("rounds").update({ current_phase: dbPhase }).eq("id", roundId);
  }
}

// ---- Votes (choice stored as "0"/"1"; earliest vote per player = PICK, latest = FINAL) ----

export async function fetchVotes(roundId) {
  needDb();
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("round_id", roundId)
    .order("created_at", { ascending: true });
  if (error) throw fail("Could not load votes.");
  return data || [];
}

export async function castVote(roundId, playerId, sideIndex) {
  needDb();
  const { error } = await supabase.from("votes").insert({
    id: crypto.randomUUID(),
    round_id: roundId,
    player_id: playerId,
    choice: String(sideIndex),
  });
  if (error) throw fail("Vote failed. Try again.");
}

export function picksFromVotes(votes) {
  const picks = {};
  for (const v of votes) {
    if (picks[v.player_id] === undefined) picks[v.player_id] = Number(v.choice);
  }
  return picks;
}

export function finalsFromVotes(votes) {
  const seen = new Set();
  const finals = {};
  for (const v of votes) {
    if (!seen.has(v.player_id)) {
      seen.add(v.player_id);
      continue; // first vote was the PICK
    }
    finals[v.player_id] = Number(v.choice);
  }
  return finals;
}

// ---- Messages ----

export async function fetchMessages(roomId) {
  needDb();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw fail("Could not load messages.");
  return (data || []).map(parseMessage);
}

export async function postMessage(roomId, playerId, body) {
  needDb();
  const clean = (body || "").trim();
  if (!clean) throw fail("Message cannot be empty.");
  if (clean.length > 500) throw fail("Keep it under 500 characters.");
  const { error } = await supabase.from("messages").insert({
    id: crypto.randomUUID(),
    room_id: roomId,
    player_id: playerId,
    message: clean,
  });
  if (error) throw fail("Could not send. Try again.");
}

// ---- Referee helpers ----

// Post a JSON payload split into <=400-char chunks (DB caps message ~500).
export async function postChunked(roomId, playerId, tag, obj) {
  const json = JSON.stringify(obj);
  const SIZE = 400;
  const total = Math.max(1, Math.ceil(json.length / SIZE));
  for (let i = 0; i < total; i++) {
    await postMessage(roomId, playerId, `${tag}:${total}:${i}:${json.slice(i * SIZE, (i + 1) * SIZE)}`);
  }
}

// Reassemble the latest complete chunk set for a tag within scoped messages.
function reassemble(scoped, tag) {
  const parts = scoped.filter((m) => m.kind === "PART" && m.tag === tag);
  if (!parts.length) return null;
  // Walk back from newest to find the latest complete generation.
  const byTime = [...parts].sort(
    (a, b) => new Date(a.row.created_at) - new Date(b.row.created_at)
  );
  for (let end = byTime.length - 1; end >= 0; end--) {
    const total = byTime[end].total;
    const set = [];
    for (let i = end; i >= 0 && set.length < total; i--) {
      if (byTime[i].total === total && !set.some((p) => p.idx === byTime[i].idx)) {
        set.push(byTime[i]);
      }
    }
    if (set.length === total) {
      set.sort((a, b) => a.idx - b.idx);
      try {
        return JSON.parse(set.map((p) => p.chunk).join(""));
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Latest OPTS wins (one selection per round; scoped by round timestamp).
export function latestOptions(scopedMessages) {
  const data = reassemble(scopedMessages, "OPTS");
  const options = data?.options?.filter((o) => o && (o.question || o.title)) || [];
  return options.slice(0, 5).map((o, i) => ({
    id: o.id || `opt-${i}`,
    question: o.question || o.title,
    hook: o.hook || "",
    category: o.category || "Chaos",
  }));
}

// Latest TV per player.
export function topicVotes(roundMessages) {
  const votes = {};
  for (const m of roundMessages) {
    if (m.kind === "TV") votes[m.row.player_id] = m.optionId;
  }
  return votes;
}

export function latestVerdict(scopedMessages) {
  const direct = scopedMessages.filter((m) => m.kind === "VJ" && m.verdict);
  if (direct.length) return direct[direct.length - 1].verdict;
  return reassemble(scopedMessages, "VJ");
}

// Every complete VJ payload in a message list (for anti-repeat lists).
export function allVerdicts(allMessages) {
  const out = [];
  let block = [];
  const flush = () => {
    if (block.length) {
      const v = reassemble(block, "VJ");
      if (v) out.push(v);
      const direct = block.filter((m) => m.kind === "VJ" && m.verdict);
      for (const d of direct) out.push(d.verdict);
      block = [];
    }
  };
  const ordered = [...allMessages].sort(
    (a, b) => new Date(a.row.created_at) - new Date(b.row.created_at)
  );
  for (const m of ordered) {
    if ((m.kind === "PART" && m.tag === "VJ") || m.kind === "VJ") block.push(m);
    else flush();
  }
  flush();
  return out;
}

// Apply verdict scores: +20 participation, + verdict points (matched by name).
// Guarded by XP:done marker posted in the same call.
export async function applyVerdictScores(roomId, players, verdict) {
  needDb();
  const byName = {};
  for (const p of players) byName[p.name.trim().toLowerCase()] = p;
  for (const p of players) {
    const take = (verdict?.takes || []).find(
      (t) => (t.name || "").trim().toLowerCase() === p.name.trim().toLowerCase()
    );
    const gain = 20 + (take?.points || 10);
    const nextScore = (p.score || 0) + gain;
    await supabase
      .from("players")
      .update({ score: nextScore, level: Math.floor(nextScore / 500) + 1 })
      .eq("id", p.id);
  }
  await postMessage(roomId, players[0].id, "XP:done");
}

// ---- XP (host applies once; guarded by XP:done marker) ----

export async function awardXp(roomId, players, xpMap) {
  needDb();
  for (const p of players) {
    const gain = xpMap[p.id] || 0;
    if (!gain) continue;
    const nextScore = (p.score || 0) + gain;
    await supabase
      .from("players")
      .update({ score: nextScore, level: Math.floor(nextScore / 500) + 1 })
      .eq("id", p.id);
  }
  await postMessage(roomId, players[0].id, "XP:done");
}
