/* ============================================================
   AI ENCYCLOPEDIA — THE PROMPT LAB (bring-your-own-key)
   Client-side calls to the Anthropic API. The key lives only in
   this browser tab (sessionStorage), requests go directly from
   the reader's machine to api.anthropic.com — no middleman.
   Wires up if #prompt-lab exists (Volume III, chapter 07).
   Expected ids: lab-key, lab-model, lab-system, lab-prompt-a,
   lab-prompt-b, lab-run, lab-out-a, lab-out-b, lab-status.
   ============================================================ */
(function () {
  "use strict";

  var root = document.getElementById("prompt-lab");
  if (!root) return;

  var keyEl = document.getElementById("lab-key");
  var modelEl = document.getElementById("lab-model");
  var sysEl = document.getElementById("lab-system");
  var aEl = document.getElementById("lab-prompt-a");
  var bEl = document.getElementById("lab-prompt-b");
  var runBtn = document.getElementById("lab-run");
  var outA = document.getElementById("lab-out-a");
  var outB = document.getElementById("lab-out-b");
  var statusEl = document.getElementById("lab-status");

  try {
    var saved = sessionStorage.getItem("aie-lab-key");
    if (saved && keyEl) keyEl.value = saved;
  } catch (e) {}

  function callAnthropic(key, model, system, user) {
    var body = {
      model: model,
      max_tokens: 1024,
      messages: [{ role: "user", content: user }]
    };
    if (system && system.trim()) body.system = system.trim();
    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.error && j.error.message ? j.error.message : "HTTP " + r.status);
        return j.content.map(function (blk) { return blk.text || ""; }).join("");
      });
    });
  }

  function setOut(el, text, isErr) {
    el.textContent = text;
    el.style.color = isErr ? "#ff4136" : "";
  }

  var busy = false;
  runBtn.addEventListener("click", function () {
    if (busy) return;
    var key = (keyEl.value || "").trim();
    if (!key) { statusEl.textContent = "PASTE AN ANTHROPIC API KEY FIRST — console.anthropic.com → API keys"; return; }
    try { sessionStorage.setItem("aie-lab-key", key); } catch (e) {}

    var model = modelEl.value;
    var system = sysEl ? sysEl.value : "";
    var pa = (aEl.value || "").trim();
    var pb = bEl ? (bEl.value || "").trim() : "";
    if (!pa) { statusEl.textContent = "PROMPT A IS EMPTY"; return; }

    busy = true;
    runBtn.textContent = "RUNNING…";
    statusEl.textContent = "CALLING " + model + " — DIRECT FROM YOUR BROWSER";
    setOut(outA, "…", false);
    if (outB) setOut(outB, pb ? "…" : "(prompt B empty — single run)", false);

    var jobs = [callAnthropic(key, model, system, pa).then(
      function (t) { setOut(outA, t, false); },
      function (e) { setOut(outA, "ERROR: " + e.message, true); }
    )];
    if (pb && outB) {
      jobs.push(callAnthropic(key, model, system, pb).then(
        function (t) { setOut(outB, t, false); },
        function (e) { setOut(outB, "ERROR: " + e.message, true); }
      ));
    }
    Promise.all(jobs).finally(function () {
      busy = false;
      runBtn.textContent = "RUN A/B ▶";
      statusEl.textContent = "DONE — COMPARE THE TWO OUTPUTS AGAINST THE TECHNIQUE'S CLAIM";
    });
  });
})();
