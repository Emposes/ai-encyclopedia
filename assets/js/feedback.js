/* ============================================================
   AI ENCYCLOPEDIA — reader feedback widget.
   A small, understated control on every page. Writes
   {path, helpful, text, ua} into the Supabase `feedback` table
   (anonymous insert, RLS-protected) via the shared client
   (window.AIE_SB). If Supabase isn't ready it queues the note in
   localStorage and flushes it on the next visit, so nothing is
   lost. The daily feedback-triage routine reads the table (with
   the service-role key) and acts on it.
   Injected by shared.js on every page.
   ============================================================ */
(function () {
  "use strict";
  if (window.__AIE_FEEDBACK__) return;
  window.__AIE_FEEDBACK__ = true;
  if (document.getElementById("aie-fb")) return;

  var css = ""
    + "#aie-fb-btn{position:fixed;right:16px;bottom:16px;z-index:9000;font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-secondary,#9b9b9b);background:var(--panel,#1e2124);border:1px solid var(--hairline,#2f3234);border-radius:2px;padding:8px 12px;cursor:pointer}"
    + "#aie-fb-btn:hover{color:var(--text-bright,#fff);border-color:var(--text-muted,#636363)}"
    + "#aie-fb-panel{position:fixed;right:16px;bottom:56px;z-index:9000;width:300px;max-width:90vw;background:var(--panel,#1e2124);border:1px solid var(--hairline,#2f3234);border-radius:3px;padding:16px;display:none}"
    + "#aie-fb-panel.on{display:block}"
    + "#aie-fb-panel .fb-q{font-size:13px;color:var(--text,#e5e5e5);margin-bottom:10px}"
    + "#aie-fb-panel .fb-row{display:flex;gap:8px;margin-bottom:10px}"
    + "#aie-fb-panel button.fb-v{flex:1;font-size:13px;padding:7px;background:transparent;color:var(--text-secondary,#9b9b9b);border:1px solid var(--hairline,#2f3234);border-radius:2px;cursor:pointer}"
    + "#aie-fb-panel button.fb-v.on{border-color:var(--accent,#a6f2cc);color:var(--text-bright,#fff)}"
    + "#aie-fb-panel textarea{width:100%;height:64px;font-size:13px;padding:8px;background:var(--bg,#000);border:1px solid var(--hairline,#2f3234);border-radius:2px;color:var(--text,#e5e5e5);resize:vertical}"
    + "#aie-fb-panel .fb-send{margin-top:10px;width:100%;font-size:13px;padding:8px;background:transparent;border:1px solid var(--accent,#a6f2cc);color:var(--accent,#a6f2cc);border-radius:2px;cursor:pointer}"
    + "#aie-fb-panel .fb-send:hover{background:var(--accent-05,rgba(166,242,204,.05))}"
    + "#aie-fb-panel .fb-status{font-family:var(--font-mono,monospace);font-size:11px;color:var(--text-muted,#636363);margin-top:8px;min-height:14px}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var wrap = document.createElement("div"); wrap.id = "aie-fb";
  wrap.innerHTML =
    '<button id="aie-fb-btn" aria-label="Send feedback">Feedback</button>' +
    '<div id="aie-fb-panel" role="dialog" aria-label="Feedback">' +
    '<div class="fb-q">Was this page helpful?</div>' +
    '<div class="fb-row"><button class="fb-v" data-v="yes">Yes</button><button class="fb-v" data-v="no">No</button></div>' +
    '<textarea placeholder="Anything to fix or add? (optional)"></textarea>' +
    '<button class="fb-send">Send</button>' +
    '<div class="fb-status"></div></div>';
  document.body.appendChild(wrap);

  var btn = wrap.querySelector("#aie-fb-btn");
  var panel = wrap.querySelector("#aie-fb-panel");
  var status = wrap.querySelector(".fb-status");
  var helpful = null;
  btn.addEventListener("click", function () { panel.classList.toggle("on"); });
  wrap.querySelectorAll(".fb-v").forEach(function (b) {
    b.addEventListener("click", function () {
      helpful = b.getAttribute("data-v");
      wrap.querySelectorAll(".fb-v").forEach(function (x) { x.classList.toggle("on", x === b); });
    });
  });
  function queueLocal(rec) {
    try { var q = JSON.parse(localStorage.getItem("aie-fb-queue") || "[]"); q.push(rec); localStorage.setItem("aie-fb-queue", JSON.stringify(q.slice(-50))); } catch (e) {}
  }
  function toRow(rec) {
    var row = { path: rec.path, helpful: rec.helpful, text: rec.text, ua: rec.ua };
    try { var u = window.AIE_AUTH && window.AIE_AUTH.user && window.AIE_AUTH.user(); if (u && u.id) row.user_id = u.id; } catch (e) {}
    return row;
  }
  // Primary path: insert straight into the Supabase `feedback` table via the
  // shared anon client. Falls back to the /api/feedback endpoint, then to a
  // local queue, so a note is never lost.
  function send(rec) {
    var sb = window.AIE_SB;
    if (sb && sb.from) {
      return sb.from("feedback").insert(toRow(rec)).then(function (r) { if (r && r.error) throw r.error; return r; });
    }
    return fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(rec) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r; });
  }
  // On load, drain anything that was queued offline into Supabase.
  function flushLocal() {
    var sb = window.AIE_SB; if (!sb || !sb.from) return;
    var q; try { q = JSON.parse(localStorage.getItem("aie-fb-queue") || "[]"); } catch (e) { q = []; }
    if (!q.length) return;
    sb.from("feedback").insert(q.map(toRow)).then(function (r) {
      if (r && !r.error) { try { localStorage.removeItem("aie-fb-queue"); } catch (e) {} }
    });
  }
  setTimeout(flushLocal, 2500); // AIE_SB loads async; give it a moment

  wrap.querySelector(".fb-send").addEventListener("click", function () {
    var text = (panel.querySelector("textarea").value || "").trim();
    if (!helpful && !text) { status.textContent = "Pick yes/no or write a note first."; return; }
    var rec = { path: location.pathname, helpful: helpful, text: text, ua: navigator.userAgent.slice(0, 80) };
    status.textContent = "Sending…";
    send(rec)
      .then(function () { status.textContent = "Thanks."; })
      .catch(function () { queueLocal(rec); status.textContent = "Thanks (saved)."; })
      .finally(function () { setTimeout(function () { panel.classList.remove("on"); status.textContent = ""; panel.querySelector("textarea").value = ""; }, 1200); });
  });
})();
