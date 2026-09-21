"use client";

import { useEffect, useState } from "react";

const KEY = "talkshit-player";

// Minimal local identity for MVP (no accounts).
// Stores { id, name } in localStorage so a refresh keeps your seat.
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

  function save(name) {
    const clean = (name || "").trim();
    if (!clean) return null;
    let existing = null;
    try {
      existing = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      existing = null;
    }
    const next = {
      id: existing?.id || `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: clean,
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
