// Short human-readable room codes. Avoids confusing chars (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(input) {
  return (input || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidRoomCode(input) {
  const code = normalizeRoomCode(input);
  return code.length >= 4 && code.length <= 8;
}
