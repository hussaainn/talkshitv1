"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";
import Button from "@/components/Button";
import RoomCode from "@/components/RoomCode";
import { createRoom } from "@/lib/rooms";
import { useLocalPlayer } from "@/hooks/useLocalPlayer";
import { buzz } from "@/lib/vibrate";

const fieldCls =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300/70 focus:outline-none focus:ring-2 focus:ring-lime-300/20";

export default function CreateRoomPage() {
  const router = useRouter();
  const { save } = useLocalPlayer();
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (loading) return;
    setError("");
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Enter your display name first.");
      return;
    }
    setLoading(true);
    try {
      const { room, player } = await createRoom({
        playerName: cleanName,
        roomName: roomName.trim(),
      });
      buzz(20);
      save(player.name, {
        id: player.id,
        roomId: room.id,
        roomCode: room.code,
        isHost: true,
      });
      setCode(room.code);
    } catch (err) {
      setError(err.message || "Could not create the room. Try again.");
    } finally {
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
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Create room
        </h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
          <Crown size={14} className="text-lime-300" /> You&apos;re the host. Own it.
        </p>
      </div>

      {!code ? (
        <form onSubmit={handleCreate} className="animate-fade-up mt-6 space-y-4" style={{ animationDelay: "0.08s" }}>
          <div>
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahish"
              maxLength={24}
              autoFocus
              className={fieldCls}
            />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Squad name <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Friday Chaos"
              maxLength={32}
              className={fieldCls}
            />
          </div>

          {error && (
            <p className="animate-pop-in rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading ? "Creating room..." : false}>
            CREATE ROOM
          </Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <RoomCode code={code} />
          <p className="-mt-1 text-center text-sm font-semibold text-zinc-400">
            Drop this in the group chat. They&apos;ve got 30 seconds before you judge them.
          </p>
          <Button onClick={() => { buzz(15); router.push(`/room/${code}`); }}>
            ENTER LOBBY
          </Button>
        </div>
      )}
    </main>
  );
}
