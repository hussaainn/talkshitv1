import {
  topicsPrompt,
  questionPrompt,
  verdictPrompt,
  extractJson,
  normalizeTopics,
  normalizeVerdict,
} from "@/game/referee";
import { randomSpicy } from "@/data/spicyTopics";

const BASE_URL = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.AI_MODEL || "nex-agi/nex-n2.5-pro:free";
const KEY = process.env.AI_API;

async function callRef(prompt) {
  if (!KEY) throw new Error("missing-key");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
        "HTTP-Referer": "https://talkshit.game",
        "X-Title": "TalkShit Referee",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 700,
      }),
    });
    if (!res.ok) throw new Error(`gateway-${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("empty-reply");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const { action } = body;

  try {
    if (action === "topics") {
      const raw = await callRef(
        topicsPrompt({
          count: 3,
          categories: body.categories || [],
          excludeTitles: body.excludeTitles || [],
        })
      );
      const topics = normalizeTopics(extractJson(raw), randomSpicy(3));
      return Response.json({ topics, ai: true });
    }

    if (action === "question") {
      if (!body.topic) return Response.json({ error: "Topic required." }, { status: 400 });
      const raw = await callRef(
        questionPrompt({
          topic: body.topic,
          chatLines: body.chatLines || [],
          playerNames: body.playerNames || [],
        })
      );
      const parsed = extractJson(raw);
      return Response.json({
        question: parsed?.question || raw.slice(0, 400),
        ai: true,
      });
    }

    if (action === "verdict") {
      if (!body.topic) return Response.json({ error: "Topic required." }, { status: 400 });
      const raw = await callRef(
        verdictPrompt({
          topic: body.topic,
          chatLines: body.chatLines || [],
          playerNames: body.playerNames || [],
        })
      );
      const verdict = normalizeVerdict(extractJson(raw), body.playerNames || []);
      return Response.json({ verdict, ai: !verdict.fallback });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    // Graceful offline-ref fallbacks — game never hard-blocks on AI.
    if (action === "topics") {
      return Response.json({ topics: randomSpicy(3), ai: false });
    }
    if (action === "question") {
      const fallbacks = [
        "Okay but who hurt you? Defend that take with actual logic, I'm waiting.",
        "Worst take so far gets publicly executed. Keep talking.",
        "Someone's lying and the whole group knows it. Fess up.",
      ];
      return Response.json({
        question: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        ai: false,
      });
    }
    if (action === "verdict") {
      return Response.json({
        verdict: normalizeVerdict(null, body.playerNames || []),
        ai: false,
      });
    }
    return Response.json({ error: "Referee unavailable." }, { status: 502 });
  }
}
