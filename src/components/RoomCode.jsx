"use client";

import { useState } from "react";
import { Copy, Check, Ticket } from "lucide-react";
import { buzz } from "@/lib/vibrate";

export default function RoomCode({ code, label = "Room code" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    buzz(10);
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard unavailable — still show feedback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="animate-pop-in relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 text-center backdrop-blur">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-lime-300/15 blur-2xl" />
      <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        <Ticket size={13} /> {label}
      </p>
      <p className="mt-1 font-display text-5xl font-bold tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
        {code || "------"}
      </p>
      <div className="my-3 border-t border-dashed border-white/15" />
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-xl bg-white/[0.07] px-5 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-white/[0.12] active:scale-95"
      >
        {copied ? <Check size={16} className="text-lime-300" /> : <Copy size={16} />}
        {copied ? "Copied!" : "Copy code"}
      </button>
    </div>
  );
}
