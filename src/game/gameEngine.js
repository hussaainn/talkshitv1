// Pure game rules. No Supabase, no React, no UI here.
// The UI calls these functions; database + realtime layers live elsewhere.

export const GAME_PHASES = {
  LOBBY: "LOBBY",
  PICK: "PICK",
  DEFEND: "DEFEND",
  ATTACK: "ATTACK",
  CURVEBALL: "CURVEBALL",
  FINAL: "FINAL",
  RESULTS: "RESULTS",
};

export const PHASE_ORDER = [
  GAME_PHASES.PICK,
  GAME_PHASES.DEFEND,
  GAME_PHASES.ATTACK,
  GAME_PHASES.CURVEBALL,
  GAME_PHASES.FINAL,
  GAME_PHASES.RESULTS,
];

export function nextPhase(phase) {
  const i = PHASE_ORDER.indexOf(phase);
  if (i === -1) return GAME_PHASES.PICK;
  return PHASE_ORDER[Math.min(i + 1, PHASE_ORDER.length - 1)];
}

export function createInitialRoomState({ roomId, roomCode, hostId }) {
  return {
    roomId,
    roomCode,
    hostId,
    status: "lobby",
    currentRound: 0,
    currentPhase: GAME_PHASES.LOBBY,
    players: [],
    currentTopic: null,
    usedTopicIds: [],
    choices: {}, // { playerId: sideIndex }
    arguments: {}, // { playerId: text }
    challenges: [], // [{ id, challengerId, targetId, counter }]
    curveball: null,
    finalVotes: {}, // { playerId: sideIndex }
  };
}

export function startGame(state) {
  return { ...state, status: "playing", currentRound: 0, currentPhase: GAME_PHASES.PICK };
}

export function startRound(state, topic) {
  if (!topic) throw new Error("startRound requires a topic");
  return {
    ...state,
    status: "playing",
    currentRound: state.currentRound + 1,
    currentPhase: GAME_PHASES.PICK,
    currentTopic: topic,
    usedTopicIds: [...state.usedTopicIds, topic.id],
    choices: {},
    arguments: {},
    challenges: [],
    curveball: topic.curveballs?.[0] ?? null,
    finalVotes: {},
  };
}

export function submitChoice(state, playerId, sideIndex) {
  validateSide(state, sideIndex);
  if (state.currentPhase !== GAME_PHASES.PICK) {
    throw new Error("Choices can only be submitted during PICK phase");
  }
  if (state.choices[playerId] !== undefined) {
    throw new Error("You already picked a side");
  }
  return { ...state, choices: { ...state.choices, [playerId]: sideIndex } };
}

export function submitArgument(state, playerId, text) {
  const clean = (text || "").trim();
  if (!clean) throw new Error("Argument cannot be empty");
  if (clean.length > 500) throw new Error("Argument must be 500 characters or less");
  if (state.currentPhase !== GAME_PHASES.DEFEND) {
    throw new Error("Arguments can only be submitted during DEFEND phase");
  }
  if (state.arguments[playerId]) {
    throw new Error("You already submitted your argument");
  }
  return { ...state, arguments: { ...state.arguments, [playerId]: clean } };
}

export function challengePlayer(state, challengerId, targetId, counter) {
  const clean = (counter || "").trim();
  if (!clean) throw new Error("Counter cannot be empty");
  if (clean.length > 500) throw new Error("Counter must be 500 characters or less");
  if (state.currentPhase !== GAME_PHASES.ATTACK) {
    throw new Error("Challenges can only happen during ATTACK phase");
  }
  if (challengerId === targetId) throw new Error("You cannot challenge yourself");
  if (!state.arguments[targetId]) throw new Error("That player has no argument to attack");
  return {
    ...state,
    challenges: [
      ...state.challenges,
      { id: `c-${Date.now()}-${challengerId}`, challengerId, targetId, counter: clean },
    ],
  };
}

export function applyCurveball(state, curveballText) {
  if (state.currentPhase !== GAME_PHASES.CURVEBALL) {
    throw new Error("Curveball can only be applied during CURVEBALL phase");
  }
  return { ...state, curveball: curveballText || state.curveball };
}

export function submitFinalChoice(state, playerId, sideIndex) {
  validateSide(state, sideIndex);
  if (state.currentPhase !== GAME_PHASES.FINAL) {
    throw new Error("Final votes can only be submitted during FINAL phase");
  }
  return { ...state, finalVotes: { ...state.finalVotes, [playerId]: sideIndex } };
}

export function calculateResults(state) {
  const counts = [0, 0];
  let switched = 0;
  let stayed = 0;

  for (const [pid, finalSide] of Object.entries(state.finalVotes)) {
    counts[finalSide] = (counts[finalSide] || 0) + 1;
    const initial = state.choices[pid];
    if (initial !== undefined) {
      if (initial !== finalSide) switched += 1;
      else stayed += 1;
    }
  }

  const [a, b] = counts;
  let winner = null;
  if (a > b) winner = 0;
  else if (b > a) winner = 1;

  return { counts, switched, stayed, winner };
}

function validateSide(state, sideIndex) {
  const sides = state.currentTopic?.sides?.length || 2;
  if (sideIndex !== 0 && sideIndex !== 1 && !(sideIndex >= 0 && sideIndex < sides)) {
    throw new Error("Invalid side");
  }
}
