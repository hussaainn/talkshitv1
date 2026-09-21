// Achievement definitions. Unlock checks will be wired to real
// round events in a later milestone (XP/levels milestone).

export const ACHIEVEMENTS = [
  { id: "first-blood", name: "FIRST BLOOD", description: "Make your first argument." },
  { id: "counterpunch", name: "COUNTERPUNCH", description: "Successfully challenge someone." },
  { id: "open-mind", name: "OPEN MIND", description: "Change your position after a curveball." },
  { id: "instigator", name: "INSTIGATOR", description: "Participate in a highly active discussion." },
  { id: "knowledge-drop", name: "KNOWLEDGE DROP", description: "Provide a useful contribution." },
  { id: "devils-advocate", name: "DEVIL'S ADVOCATE", description: "Defend the opposite side." },
  { id: "comeback", name: "COMEBACK", description: "Recover after a poor round." },
  { id: "regular", name: "REGULAR", description: "Complete 10 rounds." },
  { id: "chaos-agent", name: "CHAOS AGENT", description: "Trigger multiple curveballs." },
  { id: "last-man-standing", name: "LAST MAN STANDING", description: "Stay until the end of a long discussion." },
];

export function achievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}
