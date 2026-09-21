// Pure referee logic: prompts + response parsing. No fetch here —
// the gateway call lives in the server route so the key never leaks.
// Lightweight client wrapper: src/lib/refereeClient.js

export const REF_PERSONA = `You are REF, the chronically-online Gen Z referee of a chaotic friend-group debate game. Voice: unhinged group-chat energy, slang-heavy, zero filter, playfully ABUSIVE to bad takes. You roast wrong opinions like it's your love language, but you always drop the ACTUAL TRUTH with real reasoning. You hype elite takes. Keep every message under 80 words unless it's a verdict. Never be boring, corporate, or neutral. No disclaimers.`;

export function topicsPrompt({ count = 3, categories = [], excludeTitles = [] }) {
  return `${REF_PERSONA}

Generate ${count} FRESH debate topics for a friend group. They must be CONTROVERSIAL, friendship-breaking, personal — the kind that splits a group chat (loyalty tests, money beef, dating betrayals, group-trip drama). Gen Z framing. NOT generic philosophy.
${categories.length ? `Lean into: ${categories.join(", ")}.` : ""}
${excludeTitles.length ? `Do NOT repeat: ${excludeTitles.join(" | ")}.` : ""}

Reply with ONLY valid JSON, no markdown fences:
{"topics":[{"title":"...","hook":"one spicy sentence selling the drama"}]}`;
}

export function questionPrompt({ topic, chatLines, playerNames }) {
  const chat = chatLines.slice(-25).join("\n") || "(silence — they're scared)";
  return `${REF_PERSONA}

Debate topic: "${topic}"
Players: ${playerNames.join(", ") || "unknown"}
Chat so far:
${chat}

Drop ONE follow-up: either a brutal question that exposes someone's weak take, your own unhinged opinion that stirs the pot, or a correction if someone said something factually WRONG (roast them while correcting). Under 80 words. Reply with ONLY valid JSON:
{"question":"..."}`;
}

export function verdictPrompt({ topic, chatLines, playerNames }) {
  const chat = chatLines.slice(-60).join("\n") || "(they said nothing — cowards)";
  return `${REF_PERSONA}

The debate is OVER. Topic: "${topic}"
Players: ${playerNames.join(", ")}
Full chat:
${chat}

Deliver the FINAL VERDICT. Decide who was actually RIGHT based on facts + logic, who had the worst take, and drop the objective truth. Roast the losers. Score every player: correct take +100, decent/mid take +50, terrible or silent take +10.

Reply with ONLY valid JSON, no markdown fences:
{"truth":"the actual truth in 2-3 savage sentences","takes":[{"name":"exact player name","call":"RIGHT"|"MID"|"WRONG","points":100|50|10,"roast":"one brutal-funny line about their take"}],"wildest":"most unhinged moment in one line"}`;
}

export function extractJson(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function normalizeTopics(parsed, fallback) {
  const list = parsed?.topics?.filter((t) => t && t.title) || [];
  if (!list.length) return fallback;
  return list.slice(0, 3).map((t, i) => ({
    id: `ai-${Date.now().toString(36)}-${i}`,
    category: "AI Chaos",
    question: t.title,
    hook: t.hook || "",
  }));
}

export function normalizeVerdict(parsed, playerNames, fallbackPoints = 20) {
  if (!parsed || !Array.isArray(parsed.takes) || !parsed.takes.length) {
    return {
      truth: "The ref glitched out, so truth is: whoever argued loudest wins. Democracy is dead.",
      takes: playerNames.map((n) => ({
        name: n,
        call: "MID",
        points: fallbackPoints,
        roast: "Survived the lag. Barely.",
      })),
      wildest: "The AI took a nap mid-debate.",
      fallback: true,
    };
  }
  const allowed = new Set([100, 50, 10]);
  return {
    truth: parsed.truth || "Truth unavailable. Vibe check failed.",
    takes: parsed.takes.slice(0, 12).map((t) => ({
      name: t.name || "???",
      call: ["RIGHT", "MID", "WRONG"].includes(t.call) ? t.call : "MID",
      points: allowed.has(t.points) ? t.points : 20,
      roast: t.roast || "",
    })),
    wildest: parsed.wildest || "",
    fallback: false,
  };
}
