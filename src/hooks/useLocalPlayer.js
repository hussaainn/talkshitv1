"use client";

import { useEffect, useState } from "react";

const KEY = "talkshit-player";

// Minimal local identity for MVP (no accounts).
// After create/join we store the real Supabase player + room ids so a
// refresh keeps your seat. Shape: { id, name, roomId, roomCode, isHost }
export function useLocalPlayer() {
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPlayer(JSON.parse(raw));
    } catch {
      setPlayer(null);
    }
  }, []);

  function save(name, extra = {}) {
    const clean = (name || "").trim();
    if (!clean) return null;
    let existing = null;
    try {
      existing = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      existing = null;
    }
    const next = {
      id: extra.id || existing?.id || `p-${Date.now().toString(36)}`,
      name: clean,
      roomId: extra.roomId || existing?.roomId || null,
      roomCode: extra.roomCode || existing?.roomCode || null,
      isHost: extra.isHost ?? existing?.isHost ?? false,
    };
    localStorage.setItem(KEY, JSON.stringify(next));
    setPlayer(next);
    return next;
  }

  function clear() {
    localStorage.removeItem(KEY);
    setPlayer(null);
  }

  return { player, save, clear };
}
