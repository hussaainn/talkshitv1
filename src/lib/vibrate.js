// Tiny haptic tap for game actions (mobile delight, no-op where unsupported).
export function buzz(pattern = 15) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}
