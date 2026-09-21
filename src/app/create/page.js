"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import RoomCode from "@/components/RoomCode";
import { createRoom } from "@/lib/rooms";
import { useLocalPlayer } from "@/hooks/useLocalPlayer";

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
        className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-200"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 className="mt-4 text-3xl font-black tracking-tight">Create room</h1>
      <p className="mt-1 text-sm text-zinc-500">
        You&apos;ll be the host. Share the code with your friends.
      </p>

      {!code ? (
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahish"
              maxLength={24}
              className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Room name <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Friday Chaos"
              maxLength={32}
              className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-lime-300 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
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
          <p className="text-center text-sm text-zinc-500">
            Share this code with your friends.
          </p>
          <Button onClick={() => router.push(`/room/${code}`)}>START WAITING</Button>
        </div>
      )}
    </main>
  );
}
