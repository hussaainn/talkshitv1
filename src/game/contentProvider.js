import { TOPICS } from "@/data/topics";

// The game engine asks the content provider for topics.
// MVP uses LocalContentProvider. Later we can add AIContentProvider
// with the same interface without touching game rules.
//
// NOTE: an AI gateway key is reserved in .env as AI_API (OpenAI-compatible
// endpoint, model "nex-n2.5-pro:free"). It is intentionally unused in the MVP.

export const LocalContentProvider = {
  all() {
    return TOPICS;
  },

  byCategory(category) {
    return TOPICS.filter((t) => t.category === category);
  },

  categories() {
    return [...new Set(TOPICS.map((t) => t.category))].sort();
  },

  // Random topic excluding already-used ids, optionally filtered by category.
  // Returns null when everything has been used.
  random(excludeIds = [], category = null) {
    const excluded = new Set(excludeIds);
    const pool = TOPICS.filter(
      (t) => !excluded.has(t.id) && (!category || t.category === category)
    );
    if (pool.length === 0) return null;
    const i = Math.floor(Math.random() * pool.length);
    return pool[i];
  },

  byId(id) {
    return TOPICS.find((t) => t.id === id) || null;
  },
};
