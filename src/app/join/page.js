"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import Button from "@/components/Button";
import { normalizeRoomCode, isValidRoomCode } from "@/lib/roomCode";
import { joinRoom } from "@/lib/rooms";
import { useLocalPlayer } from "@/hooks/useLocalPlayer";
import { buzz } from "@/lib/vibrate";

const fieldCls =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300/70 focus:outline-none focus:ring-2 focus:ring-lime-300/20";

export default function JoinRoomPage() {
  const router = useRouter();
  const { save } = useLocalPlayer();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    if (loading) return;
    setError("");
    const cleanName = name.trim();
    const cleanCode = normalizeRoomCode(code);
    if (!cleanName) {
      setError("Enter your display name first.");
      return;
    }
    if (!isValidRoomCode(cleanCode)) {
      setError("That room code doesn't look right. Check it and try again.");
      return;
    }
    setLoading(true);
    try {
      const { room, player } = await joinRoom({
        playerName: cleanName,
        code: cleanCode,
      });
      buzz(20);
      save(player.name, {
        id: player.id,
        roomId: room.id,
        roomCode: room.code,
        isHost: false,
      });
      router.push(`/room/${room.code}`);
    } catch (err) {
      setError(err.message || "Could not join the room. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-zinc-400 transition hover:text-zinc-100"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="animate-fade-up mt-5">
        <h1 className="font-display text-4xl font-bold tracking-tight">Join room</h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
          <KeyRound size={14} className="text-lime-300" /> Get the 6-letter code from your host.
        </p>
      </div>

      <form onSubmit={handleJoin} className="animate-fade-up mt-6 space-y-4" style={{ animationDelay: "0.08s" }}>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ahmed"
            maxLength={24}
            autoFocus
            className={fieldCls}
          />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Room code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
            placeholder="K7X9P2"
            maxLength={8}
            autoCapitalize="characters"
            autoCorrect="off"
            className={`${fieldCls} text-center font-display text-3xl font-bold tracking-[0.25em] text-lime-200 placeholder:text-zinc-700`}
          />
        </div>

        {error && (
          <p className="animate-pop-in rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading ? "Joining room..." : false}>
          JOIN THE CHAOS
        </Button>
      </form>
    </main>
  );
}
