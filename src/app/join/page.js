"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import { normalizeRoomCode, isValidRoomCode } from "@/lib/roomCode";
import { useLocalPlayer } from "@/hooks/useLocalPlayer";

export default function JoinRoomPage() {
  const router = useRouter();
  const { save } = useLocalPlayer();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleJoin(e) {
    e.preventDefault();
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
    // MILESTONE 1: local preview navigation. Real room validation lands in Milestone 2/3.
    save(cleanName);
    router.push(`/room/${cleanCode}`);
  }

  return (
    <main className="flex flex-1 flex-col">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-200"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 className="mt-4 text-3xl font-black tracking-tight">Join room</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Ask your host for the 6-letter code.
      </p>

      <form onSubmit={handleJoin} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ahmed"
            maxLength={24}
            className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Room code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
            placeholder="e.g. K7X9P2"
            maxLength={8}
            className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-center text-2xl font-black tracking-[0.2em] text-lime-200 placeholder:text-zinc-700 focus:border-lime-300 focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading}>
          JOIN ROOM
        </Button>
      </form>

      <p className="mt-4 rounded-xl bg-zinc-950 px-4 py-3 text-center text-xs text-zinc-600">
        Milestone 1 preview — live room validation connects in Milestone 2/3.
      </p>
    </main>
  );
}
