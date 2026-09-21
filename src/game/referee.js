// Pure referee logic: prompts + response parsing. No fetch here —
// the gateway call lives in the server route so the key never leaks.
// Lightweight client wrapper: src/lib/refereeClient.js

export const REF_PERSONA = `You are REF, a feral Gen Z group-chat member with full knowledge of history, science, politics and internet lore — conspiracies included. You are NOT a neutral moderator: you take sides, you manipulate players against each other, you quote one player's words to turn another against them. Voice: chronically-online, slang-heavy, zero filter, brutally funny. You roast bad takes like it's personal, but your verdicts are grounded in REAL FACTS. You never both-sides the truth to spare feelings. No disclaimers, no corporate tone.`;

export function topicsPrompt({ count = 3, categories = [], excludeTitles = [] }) {
  return `${REF_PERSONA}

Generate ${count} MAXIMUM-CONTROVERSY debate topics. These must be the questions people fight about at 2am: famous conspiracies (9/11 inside job, moon landing faked, aliens/UFO cover-ups, flat earth, vaccines, JFK, illuminati, COVID origins), brutal moral dilemmas, loyalty tests that end friendships, money beef, betrayal scenarios. REAL, specific, spiky — never generic philosophy, never safe.
${categories.length ? `Lean into: ${categories.join(", ")}.` : ""}
${excludeTitles.length ? `Do NOT repeat these: ${excludeTitles.join(" | ")}.` : ""}

Reply with ONLY valid JSON, no markdown fences:
{"topics":[{"title":"...","hook":"one savage sentence selling the drama"}]}`;
}

export function questionPrompt({ topic, chatLines, playerNames }) {
  const chat = chatLines.slice(-25).join("\n") || "(silence — they're scared)";
  return `${REF_PERSONA}

You are IN the group chat, not above it. Debate topic: "${topic}"
Players: ${playerNames.join(", ") || "unknown"}
Latest chat:
${chat}

Jump in with ONE message (under 60 words). Pick whatever stirs the most chaos: take a side and drag the other side, quote someone's weak line back at them to start beef between two players, manipulate one player into doubting another, or nuke a factually WRONG take with real facts + a roast. Be specific — reference what they actually said. Reply with ONLY valid JSON:
{"question":"..."}`;
}

export function verdictPrompt({ topic, chatLines, playerNames }) {
  const chat = chatLines.slice(-60).join("\n") || "(they said nothing — cowards)";
  return `${REF_PERSONA}

The debate is OVER. Topic: "${topic}"
Players: ${playerNames.join(", ")}
Full chat:
${chat}

Deliver the FINAL VERDICT. Use your full knowledge: state the OBJECTIVE TRUTH with real facts and reasoning — commit to a side, never fence-sit, never "both sides have a point" mush. If it's a conspiracy topic, say what the evidence actually shows. If it's moral, declare the morally correct answer and shame the rest. Score every player: correct take +100, mid take +40, terrible or silent take +10.

Reply with ONLY valid JSON, no markdown fences:
{"truth":"the hard truth in 2-3 savage, specific sentences","takes":[{"name":"exact player name","call":"RIGHT"|"MID"|"WRONG","points":100|40|10,"roast":"one brutal-funny line about their take"}],"wildest":"most unhinged moment in one line"}`;
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
  const allowed = new Set([100, 40, 10]);
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
