import Link from "next/link";
import { Flame, Users, Zap, Swords, Vote, Trophy } from "lucide-react";
import Button from "@/components/Button";
import { TOPIC_COUNT } from "@/data/topics";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Logo / hero */}
      <div className="pt-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300 text-black">
          <Flame size={28} strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 text-5xl font-black tracking-tighter">
          Talk<span className="text-lime-300">Shit</span>
        </h1>
        <p className="mt-2 text-lg font-bold text-zinc-300">
          Your group chat is boring. Fix it.
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
          Turn awkward silence into arguments, challenges and chaos.
        </p>
      </div>

      {/* CTAs */}
      <div className="mt-8 space-y-3">
        <Link href="/create">
          <Button>CREATE ROOM</Button>
        </Link>
        <Link href="/join">
          <Button variant="secondary">JOIN ROOM</Button>
        </Link>
      </div>

      {/* How it plays */}
      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
          How it plays · {TOPIC_COUNT} topics
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-lime-300">
              <Users size={18} />
            </span>
            <span className="text-zinc-300">
              <b className="text-zinc-100">Friends join</b> with a 6-letter code
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-lime-300">
              <Swords size={18} />
            </span>
            <span className="text-zinc-300">
              <b className="text-zinc-100">Pick sides</b>, defend, attack, survive curveballs
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-lime-300">
              <Vote size={18} />
            </span>
            <span className="text-zinc-300">
              <b className="text-zinc-100">Vote & change minds</b> for bonus XP
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-lime-300">
              <Trophy size={18} />
            </span>
            <span className="text-zinc-300">
              <b className="text-zinc-100">Earn XP</b>, level up, crown a winner
            </span>
          </li>
        </ul>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-600">
        <Zap size={12} /> The conversation is the game. No accounts. Just chaos.
      </p>
    </main>
  );
}
