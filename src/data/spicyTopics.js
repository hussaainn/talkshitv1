// Friendship-breaking topic deck. Gen Z voice, genuinely debatable,
// designed to split a group chat. Used as fallback when the AI ref
// is offline, and as seed material for AI-generated options.

export const SPICY_TOPICS = [
  {
    id: "spicy-001",
    category: "Friendship Test",
    question: "Your friend starts dating your ex 2 months after the breakup. Is the friendship over?",
    hook: "Be honest — you're judging someone right now.",
  },
  {
    id: "spicy-002",
    category: "Money",
    question: "Friend owes you 500 SAR for 6 months but posts vacation stories weekly. Do you publicly call them out?",
    hook: "The story views say everything.",
  },
  {
    id: "spicy-003",
    category: "Loyalty",
    question: "Your best friend cheats on their partner and swears you to secrecy. Do you snitch?",
    hook: "Someone in this room is the cheater's friend.",
  },
  {
    id: "spicy-004",
    category: "Group Chat",
    question: "Is screenshotting the group chat and sending it outside an unforgivable crime?",
    hook: "Check who just went quiet.",
  },
  {
    id: "spicy-005",
    category: "Weddings",
    question: "Your friend has a child-free wedding and you have a newborn. Are you actually angry or just dramatic?",
    hook: "This ends friendships in real life.",
  },
  {
    id: "spicy-006",
    category: "Clout",
    question: "Friend becomes an influencer and starts acting famous with 2k followers. Do you humble them or cut them off?",
    hook: "We all know one.",
  },
  {
    id: "spicy-007",
    category: "Secrets",
    question: "You find out a friend's partner is cheating — from a third friend who told you not to tell. What do you do?",
    hook: "Every option ruins something.",
  },
  {
    id: "spicy-008",
    category: "Money",
    question: "Splitting the bill equally when one person ordered a salad and water — fair or scam?",
    hook: "The salad person never forgets.",
  },
  {
    id: "spicy-009",
    category: "Loyalty",
    question: "Two friends in the group hate each other. You have to pick a side forever. Is staying neutral cowardly?",
    hook: "Neutrality has a body count.",
  },
  {
    id: "spicy-010",
    category: "Dating",
    question: "Is it ever okay to date your friend's sibling without asking first?",
    hook: "Asking first is just asking for a no.",
  },
  {
    id: "spicy-011",
    category: "Work",
    question: "Your friend gets you a job then tells everyone you only got it because of them. Gratitude or disrespect?",
    hook: "Nepotism with extra steps.",
  },
  {
    id: "spicy-012",
    category: "Party",
    question: "Friend throws a party and doesn't invite one person from the group. Is the host messy or honest?",
    hook: "Someone's getting left on read tonight.",
  },
  {
    id: "spicy-013",
    category: "Socials",
    question: "Your friend never likes your posts but watches all your stories. Is that fake love?",
    hook: "The algorithm knows the truth.",
  },
  {
    id: "spicy-014",
    category: "Trips",
    question: "Planning a group trip where one friend can only afford half the budget. Downgrade for them or leave them behind?",
    hook: "Friendship vs. infinity pool.",
  },
  {
    id: "spicy-015",
    category: "Truth",
    question: "Your friend's new haircut is objectively terrible and they love it. Brutal honesty or protective lie?",
    hook: "Photos are forever.",
  },
  {
    id: "spicy-016",
    category: "Gaming",
    question: "Friend rage-quits ranked and costs you your promotion match. Is one game enough to end a duo?",
    hook: "Elo hell has a name and it's theirs.",
  },
  {
    id: "spicy-017",
    category: "Family",
    question: "Your friend talks trash about their own mother to you, then gets mad when you agree. Were you set up?",
    hook: "It was a trap all along.",
  },
  {
    id: "spicy-018",
    category: "Deep",
    question: "Would you give up 5 years of your life so your best friend could live 10 more? No take-backs.",
    hook: "Jokes stop here. Maybe.",
  },
  {
    id: "con-001",
    category: "Conspiracy",
    question: "9/11 was an inside job. Change my mind.",
    hook: "This one ends group chats.",
  },
  {
    id: "con-002",
    category: "Conspiracy",
    question: "The moon landing was faked in a studio. Are you a believer or a sheep?",
    hook: "NASA is watching this debate.",
  },
  {
    id: "con-003",
    category: "Conspiracy",
    question: "Aliens exist and governments are hiding it. What's your proof either way?",
    hook: "The truth is out there. Probably.",
  },
  {
    id: "con-004",
    category: "Conspiracy",
    question: "Vaccines: life-saving science or something they're not telling us?",
    hook: "Bring facts or get cooked.",
  },
  {
    id: "con-005",
    category: "Conspiracy",
    question: "The earth is flat and every photo is CGI. Defend your side.",
    hook: "Someone here unironically believes this.",
  },
  {
    id: "con-006",
    category: "Conspiracy",
    question: "A secret elite group actually runs the world. Who's in it and what's the proof?",
    hook: "Name names. Coward.",
  },
  {
    id: "con-007",
    category: "Conspiracy",
    question: "COVID was made in a lab — accident or on purpose?",
    hook: "Virology group chat civil war.",
  },
  {
    id: "con-008",
    category: "Conspiracy",
    question: "Celebrities fake their deaths and live in hiding. Which one is alive and where?",
    hook: "Elvis left the building. Allegedly.",
  },
];

export function randomSpicy(count = 3, excludeIds = []) {
  const pool = SPICY_TOPICS.filter((t) => !excludeIds.includes(t.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
