// Client wrapper for the server-side referee. The AI key never leaves the server.
export async function refCall(action, payload = {}) {
  const res = await fetch("/api/referee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error("Referee unavailable. Try again.");
  return res.json();
}
