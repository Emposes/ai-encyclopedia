/* ============================================================
   AI ENCYCLOPEDIA — THE STUDIO  (the paid-tier AI tools)
   Four tools: custom curriculum, explain a concept, enhance a
   prompt, explain with AI.

   Two power modes (user picks):
   - BYOK (free): the reader's own Anthropic key, kept in this tab
     (sessionStorage), called directly from the browser. Works today.
   - Pro ($20/mo, platform-funded): calls go to /api/ai, which uses
     the platform key and meters usage per account. Inert until the
     backend env (ANTHROPIC_API_KEY + KV) and auth are configured;
     until then the UI routes Pro requests to /api/ai and surfaces a
     clear "not yet configured" message.
   Wires up only if #studio exists (studio.html).
   ============================================================ */
(function () {
  "use strict";
  var root = document.getElementById("studio");
  if (!root) return;

  /* sign-in gate — active only when Supabase auth is configured */
  var gated = false;
  function applyGate() {
    var a = window.AIE_AUTH;
    gated = !!(a && a.enabled && !(a.user && a.user()));
    var banner = document.getElementById("st-gate");
    if (gated && !banner) {
      banner = document.createElement("div"); banner.id = "st-gate";
      banner.style.cssText = "margin:0 0 22px;padding:16px 18px;border:1px solid var(--accent);border-left-width:2px;border-radius:3px;background:var(--accent-05);color:var(--text);font-size:14px;";
      banner.innerHTML = "The Studio tools are for signed-in members. <a id='st-gate-in' style='color:var(--accent);cursor:pointer;text-decoration:underline;'>Sign in with Google</a> to use them. The encyclopedia and the Gym stay free and open.";
      root.insertBefore(banner, root.firstChild);
      var gi = document.getElementById("st-gate-in"); if (gi) gi.onclick = function () { window.AIE_AUTH.signInGoogle(); };
    } else if (!gated && banner) { banner.remove(); }
  }
  if (window.AIE_AUTH && window.AIE_AUTH.onChange) window.AIE_AUTH.onChange(applyGate); else setTimeout(applyGate, 600);

  var MODEL = "claude-sonnet-4-6";
  var FREE_MONTHLY = 5; // platform-funded free allowance (metered client-side as a demo)

  /* ---------- tiny helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ses(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- usage meter (demo; real metering is server-side) ---------- */
  function monthKey() { var d = (get("aie-studio-month") || ""); return d; }
  function usage() {
    var m = monthKey(); var u = parseInt(get("aie-studio-uses") || "0", 10);
    return { month: m, uses: isNaN(u) ? 0 : u };
  }
  function bumpUsage(stampMonth) {
    var st = usage();
    if (st.month !== stampMonth) { set("aie-studio-month", stampMonth); set("aie-studio-uses", "1"); return 1; }
    var n = st.uses + 1; set("aie-studio-uses", String(n)); return n;
  }

  /* ---------- the model call: BYOK direct, or Pro via /api/ai ---------- */
  function callBYOK(key, system, user, maxTokens) {
    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens || 1200, system: system, messages: [{ role: "user", content: user }] })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.error && j.error.message ? j.error.message : "HTTP " + r.status);
        return j.content.map(function (b) { return b.text || ""; }).join("");
      });
    });
  }
  function callPro(system, user, maxTokens) {
    return fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ system: system, user: user, max_tokens: maxTokens || 1200 })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.error || ("HTTP " + r.status));
        return j.text || "";
      });
    });
  }

  function mode() { return get("aie-studio-mode") || "byok"; } // "byok" | "pro"
  function call(system, user, maxTokens) {
    if (mode() === "pro") return callPro(system, user, maxTokens);
    var key = (ses("aie-lab-key") || "").trim();
    if (!key) return Promise.reject(new Error("Add your Anthropic API key above, or switch to the Pro tier."));
    return callBYOK(key, system, user, maxTokens);
  }

  /* ---------- catalog (for the curriculum tool) ---------- */
  var catalog = null;
  function loadCatalog() {
    if (catalog) return Promise.resolve(catalog);
    return fetch("/content.json").then(function (r) { return r.json(); }).then(function (d) {
      catalog = d.map(function (c) { return { title: c.title, track: c.track, level: c.level, file: c.file }; });
      return catalog;
    }).catch(function () { catalog = []; return catalog; });
  }

  /* ---------- the four tools ---------- */
  var TOOLS = {
    curriculum: {
      system: "You are a curriculum designer for The AI Encyclopedia, a reference site of ~103 interactive chapters across tracks (statistics, data, machine learning, model risk, deep learning, RL, game theory, time series, quant finance, LLMs, prompting, agents, multimodal, open models, frameworks). Given a learner's background and goal plus the chapter catalog, design a personalized path: select and ORDER the most relevant chapters into 3-5 phases. For each chapter give a one-line reason. Be selective, not exhaustive. Output plain structured text with phase headings and, for each item, the chapter title and its file path in brackets.",
      build: function (inputs) {
        return loadCatalog().then(function (cat) {
          var cz = cat.map(function (c) { return "- " + c.title + " [" + c.file + "] (" + c.track + "/" + c.level + ")"; }).join("\n");
          return "LEARNER BACKGROUND / PROFILE:\n" + inputs.profile + "\n\nGOAL:\n" + (inputs.goal || "(not specified)") +
            "\n\nDEPTH: " + inputs.level + "\n\nCHAPTER CATALOG:\n" + cz;
        });
      },
      max: 1600
    },
    explain: {
      system: "You explain technical material from The AI Encyclopedia's domain (AI/ML/quant). Explain the provided material clearly at the requested depth: intuition first, then the precise mechanism, then why it matters. Be accurate; flag anything contested. Use short paragraphs.",
      build: function (inputs) { return Promise.resolve("DEPTH: " + inputs.level + "\n\nMATERIAL TO EXPLAIN (a paper excerpt, post, or topic):\n" + inputs.text); },
      max: 1200
    },
    enhance: {
      system: "You are a prompt engineer. Improve the user's prompt for a modern LLM: clarify the task into one deliverable, add the missing scaffold (role, context, output format, constraints), and keep their intent. Return TWO sections: 1) the improved prompt, ready to copy; 2) a short bullet list of what you changed and why.",
      build: function (inputs) { return Promise.resolve("ORIGINAL PROMPT:\n" + inputs.text); },
      max: 1200
    },
    tutor: {
      system: "You are a tutor for The AI Encyclopedia. Answer the learner's question about an AI/ML/quant concept accurately and at the right level, connect it to adjacent ideas, and suggest which chapter/track to read next. Concise.",
      build: function (inputs) { return Promise.resolve("DEPTH: " + inputs.level + "\n\nQUESTION / CONCEPT:\n" + inputs.text); },
      max: 1000
    }
  };

  /* ---------- run a tool ---------- */
  function runTool(toolId, inputs, outEl, statusEl, btn) {
    var t = TOOLS[toolId];
    if (!t) return;
    if (gated) { statusEl.textContent = "Sign in with Google (above) to use the Studio."; return; }
    // free platform tier metering (demo)
    if (mode() === "pro") {
      var nowMonth = new Date && false; // Date.now disallowed in some envs; use a coarse stamp
    }
    btn.disabled = true; var label = btn.textContent; btn.textContent = "Working…";
    statusEl.textContent = mode() === "pro" ? "Calling the model (Pro, platform-funded)…" : "Calling the model directly from your browser…";
    outEl.textContent = "";
    t.build(inputs).then(function (user) {
      return call(t.system, user, t.max);
    }).then(function (text) {
      outEl.textContent = text;
      statusEl.textContent = "Done.";
    }).catch(function (e) {
      outEl.textContent = "";
      statusEl.textContent = "Error: " + e.message;
      statusEl.style.color = "var(--danger)";
      setTimeout(function () { statusEl.style.color = ""; }, 30);
    }).finally(function () {
      btn.disabled = false; btn.textContent = label;
    });
  }

  /* ---------- wire the page ---------- */
  // tier toggle
  var modeRadios = root.querySelectorAll("[name='studio-mode']");
  Array.prototype.forEach.call(modeRadios, function (r) {
    r.checked = r.value === mode();
    r.addEventListener("change", function () { if (r.checked) { set("aie-studio-mode", r.value); reflectMode(); } });
  });
  function reflectMode() {
    var byok = mode() === "byok";
    var keyRow = $("studio-keyrow"); if (keyRow) keyRow.style.display = byok ? "" : "none";
    var proNote = $("studio-pronote"); if (proNote) proNote.style.display = byok ? "none" : "";
  }
  var keyEl = $("studio-key");
  if (keyEl) {
    var sk = ses("aie-lab-key"); if (sk) keyEl.value = sk;
    keyEl.addEventListener("change", function () { ses("aie-lab-key", (keyEl.value || "").trim()); });
  }
  reflectMode();

  // bind each tool card
  root.querySelectorAll("[data-tool]").forEach(function (card) {
    var id = card.getAttribute("data-tool");
    var btn = card.querySelector(".st-run");
    var out = card.querySelector(".st-out");
    var status = card.querySelector(".st-status");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var inputs = {
        profile: (card.querySelector("[data-f='profile']") || {}).value || "",
        goal: (card.querySelector("[data-f='goal']") || {}).value || "",
        text: (card.querySelector("[data-f='text']") || {}).value || "",
        level: (card.querySelector("[data-f='level']") || {}).value || "practitioner"
      };
      var primary = inputs.text || inputs.profile;
      if (!primary.trim()) { status.textContent = "Add some input first."; return; }
      runTool(id, inputs, out, status, btn);
    });
  });
})();
