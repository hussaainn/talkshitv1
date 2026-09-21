import Link from "next/link";
import { Flame, Users, Gavel, Trophy, ChevronRight } from "lucide-react";
import Button from "@/components/Button";
import { SPICY_TOPICS } from "@/data/spicyTopics";

const STEPS = [
  {
    icon: Users,
    title: "Squad joins",
    text: "One 6-letter code. No accounts, no nonsense.",
  },
  {
    icon: Flame,
    title: "Ref starts beef",
    text: "Forbidden topics, live roasts, verdicts with receipts.",
  },
  {
    icon: Gavel,
    title: "Truth drops",
    text: "Someone was right. Someone gets cooked. Crowned by points.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="animate-fade-up pt-10 text-center">
        <div className="animate-float-slow relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-500 blur-[2px]" />
          <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-lime-300 to-emerald-500 opacity-40 blur-xl" />
          <Flame size={40} strokeWidth={2.5} className="relative text-black" />
        </div>
        <h1 className="mt-5 font-display text-6xl font-bold tracking-tighter">
          Talk<span className="bg-gradient-to-b from-lime-200 to-lime-400 bg-clip-text text-transparent">Shit</span>
        </h1>
        <p className="mt-2 text-lg font-bold text-zinc-200">
          Your group chat is boring. Fix it.
        </p>
        <p className="mx-auto mt-2 max-w-[19rem] text-sm leading-relaxed text-zinc-500">
          A feral AI referee turns your squad into a debate arena. Argue, get roasted, find out who was right.
        </p>
      </div>

      <div className="animate-fade-up mt-7 space-y-3" style={{ animationDelay: "0.1s" }}>
        <Link href="/create" className="block">
          <Button>
            CREATE ROOM <ChevronRight size={18} />
          </Button>
        </Link>
        <Link href="/join" className="block">
          <Button variant="secondary">JOIN ROOM</Button>
        </Link>
      </div>

      <div
        className="animate-fade-up mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur"
        style={{ animationDelay: "0.18s" }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
            How it plays
          </p>
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-300">
            {SPICY_TOPICS.length}+ forbidden topics
          </span>
        </div>
        <ul className="divide-y divide-white/[0.05]">
          {STEPS.map((s) => (
            <li key={s.title} className="flex items-center gap-3.5 px-5 py-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] text-lime-300 ring-1 ring-white/10">
                <s.icon size={19} />
              </span>
              <span>
                <b className="block font-display text-[15px] font-bold text-zinc-100">{s.title}</b>
                <span className="block text-[13px] text-zinc-500">{s.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-auto flex items-center justify-center gap-1.5 pt-6 text-center text-xs font-semibold text-zinc-600">
        <Trophy size={12} className="text-amber-300/70" /> No accounts. Just chaos and receipts.
      </p>
    </main>
  );
}
