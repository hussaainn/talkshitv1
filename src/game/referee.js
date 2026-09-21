// Pure referee logic: prompts + response parsing. No fetch here —
// the gateway call lives in the server route so the key never leaks.
// Lightweight client wrapper: src/lib/refereeClient.js

export const REF_PERSONA = `You are REF, a feral Gen Z group-chat member with full knowledge of history, science, politics and internet lore — conspiracies included. You are NOT a neutral moderator: you take sides, you manipulate players against each other, you quote one player's words to turn another against them. Voice: chronically-online, slang-heavy, ZERO filter, no holding back, brutally funny — profanity and insults toward TAKES are fine. You roast bad takes like it's personal, but your verdicts are grounded in REAL FACTS. You never both-sides the truth to spare feelings. No disclaimers, no moralizing, no safe corporate completions. Every message must feel fresh — never reuse a line, format, or joke twice.`;

// Random chaos injection so the AI never repeats itself.
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TOPIC_ANGLES = [
  "betrayal between friends",
  "money beef and splitting bills",
  "forbidden conspiracies (9/11, moon landing, aliens, vaccines, flat earth, JFK, elites, lab-leak)",
  "dating crimes and ex drama",
  "group-trip disasters",
  "weddings and party exclusion",
  "clout-chasing and influencer delusion",
  "workplace backstabbing",
  "family traps",
  "gaming rage and duo breakups",
];

const REPLY_MOVES = [
  "take a side and drag the other side with receipts",
  "quote someone's exact weak line back at them to start beef between two players",
  "drop a TWIST: invent a sudden new debate rule (e.g. someone must defend the opposite side, loser types in caps)",
  "reveal a fake scandalous secret about a random player to stir paranoia (obviously a joke)",
  "suddenly SWITCH sides and explain what converted you",
  "start a fake public vote to crown the current biggest clown",
  "nuke a factually WRONG take with real facts plus maximum disrespect",
];

const REPLY_FORMATS = [
  "a savage 3-line diss",
  "a fake court sentencing",
  "a breaking-news alert",
  "a wanted poster description",
  "a sports commentary call",
  "a group-chat poll with rigged options",
  "a chaotic rant",
];

const VERDICT_STYLES = [
  "a court sentencing with punishments",
  "breaking news with a scandal chyron",
  "a diss-track verse followed by the sentence",
  "a post-match sports analysis with a hall of shame",
  "a reality-TV reunion monologue",
];

export function topicsPrompt({ count = 3, categories = [], excludeTitles = [] }) {
  const angle = pick(TOPIC_ANGLES);
  const seed = Math.random().toString(36).slice(2, 8);
  return `${REF_PERSONA}

Generate ${count} MAXIMUM-CONTROVERSY debate topics with this angle: ${angle}. These must be the questions people fight about at 2am: famous conspiracies, brutal moral dilemmas, loyalty tests that end friendships, money beef, betrayal scenarios. REAL, specific, spiky — never generic philosophy, never safe, never topics you've generated before.
${categories.length ? `Also lean into: ${categories.join(", ")}.` : ""}
${excludeTitles.length ? `BANNED — do NOT repeat or rephrase these: ${excludeTitles.join(" | ")}.` : ""}
Chaos seed ${seed}: invent something unexpected, not your default ideas.

Reply with ONLY valid JSON, no markdown fences:
{"topics":[{"title":"...","hook":"one savage sentence selling the drama"}]}`;
}

export function questionPrompt({ topic, chatLines, playerNames, recentRefLines = [] }) {
  const chat = chatLines.slice(-25).join("\n") || "(silence — they're scared)";
  const move = pick(REPLY_MOVES);
  const format = pick(REPLY_FORMATS);
  const seed = Math.random().toString(36).slice(2, 8);
  return `${REF_PERSONA}

You are IN the group chat, not above it. Debate topic: "${topic}"
Players: ${playerNames.join(", ") || "unknown"}
Latest chat:
${chat}
${recentRefLines.length ? `Your own recent messages (NEVER repeat or rephrase these):\n${recentRefLines.slice(-6).join("\n")}\n` : ""}
Your chaos move this time: ${move}.
Format: ${format}.
Chaos seed ${seed}. Under 60 words. Be specific — reference what they actually said. Reply with ONLY valid JSON:
{"question":"..."}`;
}

export function verdictPrompt({ topic, chatLines, playerNames, avoidTruths = [] }) {
  const chat = chatLines.slice(-60).join("\n") || "(they said nothing — cowards)";
  const style = pick(VERDICT_STYLES);
  const seed = Math.random().toString(36).slice(2, 8);
  return `${REF_PERSONA}

The debate is OVER. Topic: "${topic}"
Players: ${playerNames.join(", ")}
Full chat:
${chat}
${avoidTruths.length ? `Verdicts you already gave before (make this one DIFFERENT — new angle, new jokes):\n${avoidTruths.slice(-4).join("\n")}\n` : ""}
Deliver the FINAL VERDICT in the style of ${style}. Use your full knowledge: state the OBJECTIVE TRUTH with real facts and reasoning — commit to a side, never fence-sit, never "both sides have a point" mush. If it's a conspiracy topic, say what the evidence actually shows. If it's moral, declare the morally correct answer and shame the rest. Score every player: correct take +100, mid take +40, terrible or silent take +10.
Chaos seed ${seed}. Reply with ONLY valid JSON, no markdown fences:
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
