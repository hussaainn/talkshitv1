// Client wrapper for the server-side referee. The AI key never leaves the server.
export async function refCall(action, payload = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 70000);
  try {
    const res = await fetch("/api/referee", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) throw new Error("Referee unavailable. Try again.");
    return res.json();
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Ref took too long. Try again.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
