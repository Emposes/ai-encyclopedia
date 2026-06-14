/* ============================================================
   AI ENCYCLOPEDIA — public-URL reader (Vercel serverless).
   Fetches a PUBLIC web page server-side and returns its readable
   text, so a Studio tool can reference an article by link. Login-
   walled sites (LinkedIn, X, most paywalls) will not work — paste
   or upload those instead.
   GET /api/fetch-url?url=https://example.com/post
   ============================================================ */
export default async function handler(req, res) {
  const url = (req.query && req.query.url) || "";
  if (!/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: "Provide a valid http(s) URL." });
    return;
  }
  // Basic SSRF guard: refuse localhost / private ranges.
  try {
    const host = new URL(url).hostname;
    if (/^(localhost$|127\.|0\.|10\.|192\.168\.|169\.254\.|::1$|\[::1\])/i.test(host)) {
      res.status(400).json({ error: "That host is not allowed." });
      return;
    }
  } catch (e) {
    res.status(400).json({ error: "Could not parse that URL." });
    return;
  }

  try {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; AIEncyclopediaBot/1.0; +https://ai-encyclopedia.com)" },
      redirect: "follow",
    });
    if (!r.ok) { res.status(502).json({ error: "Fetch failed (HTTP " + r.status + "). The page may require login." }); return; }
    const ct = r.headers.get("content-type") || "";
    let text = await r.text();

    let title = "";
    if (ct.includes("html") || /^\s*</.test(text)) {
      const tm = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (tm) title = tm[1].replace(/\s+/g, " ").trim();
      text = text
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<\/(p|div|section|article|h[1-6]|li|tr|br)\s*>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">").replace(/&#39;/gi, "'").replace(/&quot;/gi, '"')
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    text = text.slice(0, 20000); // keep the payload (and the model context) bounded
    res.setHeader("content-type", "application/json");
    res.status(200).json({ url, title, text });
  } catch (e) {
    res.status(502).json({ error: String((e && e.message) || e) });
  }
}
