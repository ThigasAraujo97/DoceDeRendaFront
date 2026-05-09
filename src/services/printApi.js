// Print service — routes through nginx (port 80) which handles auth at proxy level.
// The Swagger test confirmed: calling via nginx WITHOUT Authorization header = 200 OK.
// Sending an expired/invalid token causes 401, so we omit it entirely.

const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function sendPrint(ids, kitchen = false) {
  const endpoint = kitchen
    ? "/api/orders/print/kitchen"
    : "/api/orders/print";
  const url = `${API_BASE}${endpoint}?ids=${encodeURIComponent(ids)}`;

  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    throw new Error(`Erro ${res.status}`);
  }
}
