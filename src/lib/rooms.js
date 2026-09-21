import { supabase, isSupabaseConfigured } from "./supabase";
import { generateRoomCode, normalizeRoomCode } from "./roomCode";

function dbError(message) {
  // Never expose raw database errors to users.
  return new Error(message);
}

// CREATE ROOM: inserts rooms row + host player row.
// Returns { room, player }.
export async function createRoom({ playerName, roomName }) {
  const name = (playerName || "").trim();
  if (!name) throw dbError("Enter your display name first.");
  if (!isSupabaseConfigured || !supabase) {
    throw dbError("Server not connected. Add Supabase keys and try again.");
  }

  // Unique human-readable code (retry on the rare collision).
  let room = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode(6);
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (existing) continue;

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        name: (roomName || "").trim() || "Friday Chaos",
        status: "LOBBY",
        // DB check constraint requires current_round >= 1.
        current_round: 1,
        current_phase: "LOBBY",
      })
      .select()
      .single();
    if (error) throw dbError("Could not create the room. Try again.");
    room = data;
    break;
  }
  if (!room) throw dbError("Could not generate a room code. Try again.");

  // players.id has no DB default — generate it client-side.
  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      id: crypto.randomUUID(),
      room_id: room.id,
      name,
      score: 0,
      level: 1,
      is_host: true,
      is_connected: true,
    })
    .select()
    .single();
  if (playerError) throw dbError("Room created but you could not join. Try joining with the code.");

  // Host owns the room.
  await supabase.from("rooms").update({ host_id: player.id }).eq("id", room.id);

  return { room, player };
}

// JOIN ROOM: validates code + name, inserts player row.
// Returns { room, player }.
export async function joinRoom({ playerName, code }) {
  const name = (playerName || "").trim();
  const cleanCode = normalizeRoomCode(code);
  if (!name) throw dbError("Enter your display name first.");
  if (!cleanCode) throw dbError("Enter a room code.");
  if (!isSupabaseConfigured || !supabase) {
    throw dbError("Server not connected. Add Supabase keys and try again.");
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", cleanCode)
    .maybeSingle();
  if (roomError) throw dbError("Could not look up that room. Try again.");
  if (!room) throw dbError("Room not found. Check the code and try again.");
  if (room.status !== "LOBBY") {
    throw dbError("That game already started. Ask the host for a new room.");
  }

  const { data: existingPlayers } = await supabase
    .from("players")
    .select("id,name")
    .eq("room_id", room.id);
  const taken = (existingPlayers || []).some(
    (p) => p.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (taken) throw dbError("That name is taken in this room. Pick another.");

  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      id: crypto.randomUUID(),
      room_id: room.id,
      name,
      score: 0,
      level: 1,
      is_host: false,
      is_connected: true,
    })
    .select()
    .single();
  if (playerError) throw dbError("Could not join the room. Try again.");

  return { room, player };
}

export async function fetchRoomByCode(code) {
  const cleanCode = normalizeRoomCode(code);
  if (!isSupabaseConfigured || !supabase) throw dbError("Server not connected.");
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", cleanCode)
    .maybeSingle();
  if (error) throw dbError("Could not load the room.");
  if (!data) throw dbError("Room not found.");
  return data;
}

export async function fetchPlayers(roomId) {
  if (!isSupabaseConfigured || !supabase) throw dbError("Server not connected.");
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw dbError("Could not load players.");
  return data || [];
}

export async function markDisconnected(playerId) {
  if (!isSupabaseConfigured || !supabase || !playerId) return;
  await supabase.from("players").update({ is_connected: false }).eq("id", playerId);
}
