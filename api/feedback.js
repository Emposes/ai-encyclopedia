/* ============================================================
   AI ENCYCLOPEDIA — feedback intake (Vercel serverless).
   Appends reader feedback to a store for the daily triage routine.

   Uses Vercel KV when configured (env KV_REST_API_URL +
   KV_REST_API_TOKEN). Until then it returns 503 so the client
   keeps the note in its local queue (nothing is lost).
   ============================================================ */
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const rec = {
    path: (body && body.path) || "",
    helpful: (body && body.helpful) || null,
    text: ((body && body.text) || "").slice(0, 2000),
    ua: ((body && body.ua) || "").slice(0, 120),
    at: new Date().toISOString(),
  };
  if (!rec.path && !rec.text) { res.status(400).json({ error: "empty" }); return; }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    // Backend not configured yet — client will keep it in its local queue.
    res.status(503).json({ error: "feedback store not configured" });
    return;
  }
  try {
    // Append to a Redis list via the Upstash/Vercel KV REST API.
    const r = await fetch(url + "/rpush/aie-feedback/" + encodeURIComponent(JSON.stringify(rec)), {
      headers: { Authorization: "Bearer " + token },
    });
    if (!r.ok) throw new Error("kv " + r.status);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: String(e && e.message || e) });
  }
}
