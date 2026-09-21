"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function RoomCode({ code }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable — still show feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Room code
      </p>
      <p className="mt-2 text-4xl font-black tracking-[0.15em] text-lime-300">
        {code || "------"}
      </p>
      <button
        onClick={handleCopy}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Copied!" : "Copy code"}
      </button>
    </div>
  );
}
