/* ============================================================
   AI ENCYCLOPEDIA — Pro tier model proxy (Vercel serverless).
   Funds and meters the Studio's AI calls so paid users need no key.

   Goes live when these are configured on the deployment:
     - ANTHROPIC_API_KEY                (the platform key)
     - (recommended) Vercel KV          (per-account usage metering)
     - (recommended) an auth layer       (to identify the account)
   Until ANTHROPIC_API_KEY is set, it returns a clear 503 so the
   client can fall back to bring-your-own-key.

   TODO when keys exist:
     - verify the caller's session / entitlement (auth)
     - read+increment monthly usage in KV; enforce the allowance
   ============================================================ */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({
      error: "The Pro tier is not configured on this deployment yet. Use the free bring-your-own-key mode, or set ANTHROPIC_API_KEY (and wire billing) to enable it.",
    });
    return;
  }

  // --- entitlement + metering would go here (auth + Vercel KV) ---

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { system, user, max_tokens } = body || {};
  if (!user) { res.status(400).json({ error: "missing 'user'" }); return; }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: Math.min(max_tokens || 1200, 2000),
        system: system || "",
        messages: [{ role: "user", content: user }],
      }),
    });
    const j = await r.json();
    if (!r.ok) { res.status(r.status).json({ error: (j.error && j.error.message) || ("HTTP " + r.status) }); return; }
    const text = (j.content || []).map((b) => b.text || "").join("");
    res.status(200).json({ text });
  } catch (e) {
    res.status(502).json({ error: String(e && e.message || e) });
  }
}
