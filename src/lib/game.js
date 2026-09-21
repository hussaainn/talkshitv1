import { supabase, isSupabaseConfigured } from "./supabase";
import { LocalContentProvider } from "@/game/contentProvider";
import { GAME_PHASES } from "@/game/gameEngine";

function fail(message) {
  return new Error(message);
}

function needDb() {
  if (!isSupabaseConfigured || !supabase) throw fail("Server not connected.");
}

// Message protocol (messages table carries game entries + light chat):
//   ARG:<text>            — DEFEND argument
//   CH:<targetId>:<text>  — ATTACK counter against target's argument
//   SW:<side>             — CURVEBALL declared side (0/1)
//   XP:done               — marker: XP for this round already awarded
//   SAY:<text>            — free chat
export function parseMessage(row) {
  const raw = row.message || "";
  if (raw.startsWith("ARG:")) return { kind: "ARG", text: raw.slice(4), row };
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
  const topic = LocalContentProvider.random([]);
  if (!topic) throw fail("No topics available.");

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .insert({
      room_id: room.id,
      round_number: 1,
      topic: topic.id,
      category: topic.category,
      current_phase: GAME_PHASES.PICK,
    })
    .select()
    .single();
  if (roundError) throw fail("Could not start the game. Try again.");

  const { error: roomError } = await supabase
    .from("rooms")
    .update({ status: "PLAYING", current_round: 1, current_phase: GAME_PHASES.PICK })
    .eq("id", room.id);
  if (roomError) throw fail("Could not start the game. Try again.");
  return round;
}

export async function hostNextRound(room) {
  needDb();
  const rounds = await fetchRounds(room.id);
  const usedIds = rounds.map((r) => r.topic);
  const topic = LocalContentProvider.random(usedIds);
  if (!topic) throw fail("No fresh topics left. Everyone has argued everything.");

  const nextNumber = (room.current_round || rounds.length) + 1;
  const { data: round, error } = await supabase
    .from("rounds")
    .insert({
      room_id: room.id,
      round_number: nextNumber,
      topic: topic.id,
      category: topic.category,
      current_phase: GAME_PHASES.PICK,
    })
    .select()
    .single();
  if (error) throw fail("Could not start the next round.");
  await supabase
    .from("rooms")
    .update({ current_round: nextNumber, current_phase: GAME_PHASES.PICK })
    .eq("id", room.id);
  return round;
}

export async function advancePhase(roomId, roundId, nextPhase) {
  needDb();
  const r1 = await supabase.from("rooms").update({ current_phase: nextPhase }).eq("id", roomId);
  if (r1.error) throw fail("Could not advance the phase.");
  if (roundId) {
    await supabase.from("rounds").update({ current_phase: nextPhase }).eq("id", roundId);
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
