// XP rules live here — never hardcode XP values inside UI components.
// UI calls addXp() / levelForXp() instead.

export const XP = {
  PARTICIPATION: 20,
  ARGUMENT: 30,
  CHALLENGE: 25,
  VOTE: 10,
  CHANGE_POSITION: 50,
  ROUND_WINNER: 75,
};

// Level thresholds. Level 1 starts at 0 XP.
// Beyond the table we keep adding +1500 per level so progression stays sensible.
const LEVEL_THRESHOLDS = [0, 500, 1200, 2000, 3000, 4200, 5600, 7200, 9000];

export function levelForXp(xp = 0) {
  const safeXp = Math.max(0, Number(xp) || 0);

  // Base table
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (safeXp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  let floor = LEVEL_THRESHOLDS[level - 1];
  let next =
    level < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[level]
      : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 1800;

  // Extend beyond the table by +1800 XP per level
  while (safeXp >= next) {
    level += 1;
    floor = next;
    next = floor + 1800;
  }

  const span = Math.max(1, next - floor);
  const progress = Math.min(1, Math.max(0, (safeXp - floor) / span));

  return { level, current: safeXp, floor, next, progress };
}

export function addXp(currentXp = 0, amount = 0) {
  const next = Math.max(0, (Number(currentXp) || 0) + (Number(amount) || 0));
  const before = levelForXp(currentXp);
  const after = levelForXp(next);
  return { xp: next, leveledUp: after.level > before.level, level: after.level };
}

// Round scoring helper used by the game engine.
// Input: per-player events for one round. Output: xp breakdown per player.
export function calculateRoundXp({ playerIds = [], events = {} }) {
  // events: { [playerId]: { participated, argued, challenged, voted, switched, won } }
  const result = {};
  for (const pid of playerIds) {
    const e = events[pid] || {};
    let total = 0;
    if (e.participated) total += XP.PARTICIPATION;
    if (e.argued) total += XP.ARGUMENT;
    if (e.challenged) total += XP.CHALLENGE;
    if (e.voted) total += XP.VOTE;
    if (e.switched) total += XP.CHANGE_POSITION;
    if (e.won) total += XP.ROUND_WINNER;
    result[pid] = total;
  }
  return result;
}
