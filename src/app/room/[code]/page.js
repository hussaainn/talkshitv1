"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import Button from "@/components/Button";
import RoomCode from "@/components/RoomCode";
import PlayerList from "@/components/PlayerList";
import TopicCard from "@/components/TopicCard";
import PhaseIndicator from "@/components/PhaseIndicator";
import XPBar from "@/components/XPBar";
import { LocalContentProvider } from "@/game/contentProvider";
import { GAME_PHASES } from "@/game/gameEngine";

// MILESTONE 1: lobby preview with local data only.
// Realtime lobby (Milestone 4) will replace this with Supabase subscriptions.
export default function RoomPage({ params }) {
  const [code, setCode] = useState("");
  const [me, setMe] = useState(null);
  const [previewTopic] = useState(() => LocalContentProvider.random());

  useEffect(() => {
    // params is a Promise in Next 16 — unwrap it safely
    Promise.resolve(params).then((p) => setCode((p?.code || "").toUpperCase()));
    try {
      const raw = localStorage.getItem("talkshit-player");
      if (raw) setMe(JSON.parse(raw));
    } catch {
      setMe(null);
    }
  }, [params]);

  const players = me
    ? [{ id: me.id, name: me.name, score: 0, level: 1, is_host: true }]
    : [];

  return (
    <main className="flex flex-1 flex-col gap-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-200"
      >
        <ArrowLeft size={16} /> Leave
      </Link>

      <RoomCode code={code} />

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
          Players · {players.length}
        </p>
        <PlayerList players={players} />
      </div>

      <XPBar xp={0} />

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
          Game preview
        </p>
        <PhaseIndicator current={GAME_PHASES.PICK} />
        <div className="mt-3">
          <TopicCard topic={previewTopic} roundNumber={1} />
        </div>
      </div>

      <Button disabled>
        <Play size={18} /> START GAME
      </Button>
      <p className="rounded-xl bg-lime-300/10 px-4 py-3 text-center text-xs font-semibold text-lime-200">
        Milestone 1 preview — host controls + realtime lobby go live in
        Milestones 2–4.
      </p>
    </main>
  );
}
