/* ============================================================
   AI ENCYCLOPEDIA — THE STUDIO v2
   A hub of four AI tools, each with its own dedicated screen:
     - curriculum : a personalized path from your background
     - explain    : a paper excerpt, a post, or a topic
     - enhance    : sharpen a prompt
     - tutor      : ask about any concept
   Each screen lets you bring your own material: upload a PDF or a
   text file (parsed in the browser) or reference a public link
   (fetched by /api/fetch-url). Attached sources are folded into
   the model input.

   Power modes (per the reader):
     - BYOK (free): your Anthropic key, kept in this tab, called
       directly from the browser.
     - Pro ($20/mo): calls go to /api/ai (platform-funded, metered).
       Inert until the backend (ANTHROPIC_API_KEY) + auth are set.

   Routing is by hash: #home (hub), #curriculum, #explain, #enhance,
   #tutor. Wires up only on studio.html (where #studio exists).
   ============================================================ */
(function () {
  "use strict";
  var root = document.getElementById("studio");
  if (!root) return;
  var hub = document.getElementById("st-hub");
  var view = document.getElementById("st-view");

  var MODEL = "claude-sonnet-4-6";

  /* ---------- tiny helpers ---------- */
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ses(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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
  var LEVELS = [["new", "New to it"], ["practitioner", "Practitioner"], ["advanced", "Advanced"]];
  var DEPTHS = [["new", "Plain"], ["practitioner", "Practitioner"], ["advanced", "Rigorous"]];
  var TOOLS = {
    curriculum: {
      k: "01", title: "Custom curriculum",
      card: "A personalized path through the encyclopedia, ordered into phases from your background and goal.",
      sub: "Tell the model who you are and where you want to go — attach your CV if you like — and get a selected, ordered path through the chapters.",
      primary: { f: "profile", label: "Your background", rows: 6, placeholder: "Paste a LinkedIn summary, a CV blurb, or a few lines about yourself — or attach your CV below." },
      sources: true,
      extra: [
        { f: "goal", type: "input", label: "Your goal", placeholder: "e.g. 'move into quant risk' or 'ship LLM agents'" },
        { f: "level", type: "select", label: "Depth", options: LEVELS, def: "practitioner" }
      ],
      run: "Build my curriculum", max: 1600,
      system: "You are a curriculum designer for The AI Encyclopedia, a reference site of ~103 interactive chapters across tracks (statistics, data, machine learning, model risk, deep learning, RL, game theory, time series, quant finance, LLMs, prompting, agents, multimodal, open models, frameworks). Given a learner's background and goal plus the chapter catalog, design a personalized path: select and ORDER the most relevant chapters into 3-5 phases. For each chapter give a one-line reason. Be selective, not exhaustive. Output plain structured text with phase headings and, for each item, the chapter title and its file path in brackets.",
      build: function (inputs) {
        return loadCatalog().then(function (cat) {
          var cz = cat.map(function (c) { return "- " + c.title + " [" + c.file + "] (" + c.track + "/" + c.level + ")"; }).join("\n");
          return "LEARNER BACKGROUND / PROFILE:\n" + inputs.profile + "\n\nGOAL:\n" + (inputs.goal || "(not specified)") +
            "\n\nDEPTH: " + inputs.level + "\n\nCHAPTER CATALOG:\n" + cz;
        });
      }
    },
    explain: {
      k: "02", title: "Explain this",
      card: "Paste a paper excerpt or a post, or attach a PDF / link, and get it explained at the depth you choose.",
      sub: "Drop in a paper, an article, or a topic — by paste, upload, or link — and get intuition first, then the mechanism, then why it matters.",
      primary: { f: "text", label: "Material to explain", rows: 6, placeholder: "Paste a paper abstract, an article, or name a topic — or attach a PDF / reference a link below." },
      sources: true,
      extra: [{ f: "level", type: "select", label: "Depth", options: DEPTHS, def: "practitioner" }],
      run: "Explain it", max: 1300,
      system: "You explain technical material from The AI Encyclopedia's domain (AI/ML/quant). Explain the provided material clearly at the requested depth: intuition first, then the precise mechanism, then why it matters. Be accurate; flag anything contested. Use short paragraphs.",
      build: function (inputs) { return Promise.resolve("DEPTH: " + inputs.level + "\n\nMATERIAL TO EXPLAIN:\n" + inputs.text); }
    },
    enhance: {
      k: "03", title: "Enhance my prompt",
      card: "Turn a rough prompt into a clear, well-scaffolded one — and see exactly what changed and why.",
      sub: "Paste a prompt. You get an improved, copy-ready version plus a short list of what changed and why.",
      primary: { f: "text", label: "Your prompt", rows: 6, placeholder: "Paste the prompt you want to improve." },
      sources: false,
      extra: [],
      run: "Enhance it", max: 1200,
      system: "You are a prompt engineer. Improve the user's prompt for a modern LLM: clarify the task into one deliverable, add the missing scaffold (role, context, output format, constraints), and keep their intent. Return TWO sections: 1) the improved prompt, ready to copy; 2) a short bullet list of what you changed and why.",
      build: function (inputs) { return Promise.resolve("ORIGINAL PROMPT:\n" + inputs.text); }
    },
    tutor: {
      k: "04", title: "Explain with AI",
      card: "Ask a tutor about any concept in the encyclopedia and get pointed to the right chapter to read next.",
      sub: "Ask anything in the AI/ML/quant domain. You get an answer at your level, the adjacent ideas, and where to read next.",
      primary: { f: "text", label: "Your question", rows: 4, placeholder: "e.g. 'how does GRPO differ from PPO?'" },
      sources: true,
      extra: [{ f: "level", type: "select", label: "Depth", options: DEPTHS, def: "practitioner" }],
      run: "Ask", max: 1100,
      system: "You are a tutor for The AI Encyclopedia. Answer the learner's question about an AI/ML/quant concept accurately and at the right level, connect it to adjacent ideas, and suggest which chapter/track to read next. Concise.",
      build: function (inputs) { return Promise.resolve("DEPTH: " + (inputs.level || "practitioner") + "\n\nQUESTION / CONCEPT:\n" + inputs.text); }
    }
  };
  var ORDER = ["curriculum", "explain", "enhance", "tutor"];

  /* ---------- bring-your-own material: PDF (lazy pdf.js) + URL fetch ---------- */
  var pdfReady = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfReady) return pdfReady;
    pdfReady = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
      s.onload = function () {
        if (!window.pdfjsLib) return reject(new Error("pdf.js missing after load"));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      s.onerror = function () { reject(new Error("could not load the PDF reader")); };
      document.head.appendChild(s);
    });
    return pdfReady;
  }
  function extractPdf(buf) {
    return loadPdfJs().then(function (lib) {
      return lib.getDocument({ data: buf }).promise.then(function (pdf) {
        var pages = Math.min(pdf.numPages, 40), chain = Promise.resolve([]);
        for (var i = 1; i <= pages; i++) {
          (function (n) {
            chain = chain.then(function (acc) {
              return pdf.getPage(n).then(function (p) { return p.getTextContent(); }).then(function (tc) {
                acc.push(tc.items.map(function (it) { return it.str; }).join(" "));
                return acc;
              });
            });
          })(i);
        }
        return chain.then(function (acc) { return acc.join("\n\n").replace(/[ \t]+/g, " ").slice(0, 26000); });
      });
    });
  }
  function fetchUrl(url) {
    return fetch("/api/fetch-url?url=" + encodeURIComponent(url)).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || ("HTTP " + r.status)); return j; });
    });
  }

  /* ---------- sign-in gate (active only when Supabase auth is on) ---------- */
  function gated() { var a = window.AIE_AUTH; return !!(a && a.enabled && !(a.user && a.user())); }

  /* ---------- render: hub ---------- */
  function renderHub() {
    view.hidden = true; view.innerHTML = "";
    var cards = ORDER.map(function (id) {
      var t = TOOLS[id];
      return '<button class="st2-card" data-go="' + id + '">' +
        '<span class="st2-k">' + t.k + '</span>' +
        '<h3>' + esc(t.title) + '</h3>' +
        '<p>' + esc(t.card) + '</p>' +
        '<span class="st2-go">Open &rarr;</span>' +
        '</button>';
    }).join("");
    hub.innerHTML =
      '<div class="st2-hub-head"><span class="side-label">CHOOSE A TOOL</span></div>' +
      '<div class="st2-grid">' + cards + '</div>';
    hub.hidden = false;
    hub.querySelectorAll(".st2-card").forEach(function (c) {
      c.addEventListener("click", function () { location.hash = c.getAttribute("data-go"); });
    });
    document.title = "The Studio — AI Encyclopedia";
  }

  /* ---------- render: a single tool screen ---------- */
  function powerHtml() {
    var byok = mode() === "byok";
    return '' +
      '<div class="st2-power">' +
        '<label><input type="radio" name="st2-mode" value="byok"' + (byok ? " checked" : "") + ' /> Bring your own key (free)</label>' +
        '<label><input type="radio" name="st2-mode" value="pro"' + (!byok ? " checked" : "") + ' /> Pro, platform-funded ($20/mo)</label>' +
      '</div>' +
      '<div id="st2-keyrow" style="' + (byok ? "" : "display:none;") + '">' +
        '<label class="side-label" for="st2-key" style="display:block;margin-bottom:6px;">YOUR ANTHROPIC API KEY (kept only in this browser tab)</label>' +
        '<input class="st2-input" type="password" id="st2-key" placeholder="sk-ant-…" />' +
        '<p class="w-note" style="margin-top:8px;">Stored in sessionStorage and sent directly to the Anthropic API from your browser. Nothing passes through our servers.</p>' +
      '</div>' +
      '<div id="st2-pronote" style="' + (byok ? "display:none;" : "") + 'margin-bottom:18px;">' +
        '<p class="w-note">Pro routes requests to the platform, which funds the calls and meters usage against your account. It turns on once the backend key is configured and you are signed in; until then Pro requests return a setup message.</p>' +
      '</div>';
  }
  function fieldHtml(f) {
    if (f.type === "select") {
      var opts = f.options.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === f.def ? " selected" : "") + '>' + esc(o[1]) + '</option>'; }).join("");
      return '<div class="st2-field"><label class="side-label">' + esc(f.label) + '</label><select data-f="' + f.f + '">' + opts + '</select></div>';
    }
    return '<div class="st2-field"><label class="side-label">' + esc(f.label) + '</label><input class="st2-input" data-f="' + f.f + '" placeholder="' + esc(f.placeholder || "") + '" /></div>';
  }
  function sourcesHtml() {
    return '' +
      '<div class="st2-sources">' +
        '<span class="side-label">ADD YOUR MATERIAL (OPTIONAL)</span>' +
        '<div class="st2-srcrow">' +
          '<button type="button" class="st2-srcbtn" data-act="upload">Upload PDF or text</button>' +
          '<input type="file" class="st2-file" accept=".pdf,.txt,.md,text/plain,application/pdf" hidden />' +
          '<div class="st2-urlrow"><input class="st2-input" data-act="url" placeholder="Reference a public link (https://…)" /><button type="button" class="st2-srcbtn" data-act="fetch">Fetch</button></div>' +
        '</div>' +
        '<div class="st2-chips"></div>' +
      '</div>';
  }

  function renderTool(id) {
    var t = TOOLS[id];
    if (!t) return renderHub();
    hub.hidden = true; hub.innerHTML = "";
    var attached = []; // {label, text}

    var extra = (t.extra || []).map(fieldHtml).join("");
    view.innerHTML =
      '<div class="st2-screen">' +
        '<button class="st2-back" data-act="back">&larr; All tools</button>' +
        '<h2>' + esc(t.title) + '</h2>' +
        '<p class="st2-sub">' + esc(t.sub) + '</p>' +
        powerHtml() +
        (t.sources ? sourcesHtml() : "") +
        '<div class="st2-field"><label class="side-label">' + esc(t.primary.label) + '</label>' +
          '<textarea data-f="' + t.primary.f + '" rows="' + t.primary.rows + '" placeholder="' + esc(t.primary.placeholder) + '"></textarea></div>' +
        extra +
        '<div class="st2-row"><button class="w-btn st2-run">' + esc(t.run) + '</button></div>' +
        '<div class="st2-status"></div>' +
        '<pre class="st2-out"></pre>' +
      '</div>';
    view.hidden = false;
    document.title = t.title + " — The Studio";
    window.scrollTo(0, 0);

    var screen = view.querySelector(".st2-screen");
    var statusEl = view.querySelector(".st2-status");
    var outEl = view.querySelector(".st2-out");
    var runBtn = view.querySelector(".st2-run");
    var primaryEl = view.querySelector('[data-f="' + t.primary.f + '"]');

    view.querySelector('[data-act="back"]').addEventListener("click", function () { location.hash = "home"; });

    /* power toggle + key */
    view.querySelectorAll('[name="st2-mode"]').forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        set("aie-studio-mode", r.value);
        var kr = view.querySelector("#st2-keyrow"), pn = view.querySelector("#st2-pronote");
        if (kr) kr.style.display = r.value === "byok" ? "" : "none";
        if (pn) pn.style.display = r.value === "byok" ? "none" : "";
      });
    });
    var keyEl = view.querySelector("#st2-key");
    if (keyEl) {
      var sk = ses("aie-lab-key"); if (sk) keyEl.value = sk;
      keyEl.addEventListener("change", function () { ses("aie-lab-key", (keyEl.value || "").trim()); });
    }

    /* sources: upload + url */
    function renderChips() {
      var box = view.querySelector(".st2-chips"); if (!box) return;
      box.innerHTML = attached.map(function (a, i) {
        return '<div class="st2-chip"><span>' + esc(a.label) + '</span><span class="st2-chip-x" data-i="' + i + '">remove</span></div>';
      }).join("");
      box.querySelectorAll(".st2-chip-x").forEach(function (x) {
        x.addEventListener("click", function () { attached.splice(parseInt(x.getAttribute("data-i"), 10), 1); renderChips(); });
      });
    }
    if (t.sources) {
      var fileInput = view.querySelector(".st2-file");
      view.querySelector('[data-act="upload"]').addEventListener("click", function () { fileInput.click(); });
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0]; if (!file) return;
        statusEl.style.color = ""; statusEl.textContent = "Reading " + file.name + "…";
        var done = function (text) {
          attached.push({ label: file.name, text: text }); renderChips();
          statusEl.textContent = "Attached " + file.name + " (" + text.length + " chars).";
          fileInput.value = "";
        };
        var fail = function (e) { statusEl.style.color = "var(--danger)"; statusEl.textContent = "Could not read that file: " + e.message; fileInput.value = ""; };
        if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
          file.arrayBuffer().then(function (buf) { return extractPdf(buf); }).then(done).catch(fail);
        } else {
          file.text().then(function (txt) { done(txt.slice(0, 26000)); }).catch(fail);
        }
      });
      var urlInput = view.querySelector('[data-act="url"]');
      view.querySelector('[data-act="fetch"]').addEventListener("click", function () {
        var u = (urlInput.value || "").trim(); if (!u) return;
        statusEl.style.color = ""; statusEl.textContent = "Fetching the page…";
        fetchUrl(u).then(function (j) {
          if (!j.text) throw new Error("no readable text found");
          attached.push({ label: (j.title || u).slice(0, 80), text: j.text }); renderChips();
          statusEl.textContent = "Added link (" + j.text.length + " chars). Login-walled pages won't work — paste those.";
          urlInput.value = "";
        }).catch(function (e) { statusEl.style.color = "var(--danger)"; statusEl.textContent = "Couldn't fetch that link: " + e.message + " — try paste/upload."; });
      });
    }

    /* sign-in gate */
    function applyGate() {
      var g = gated(), banner = view.querySelector("#st2-gate");
      if (g && !banner) {
        banner = el("div", { id: "st2-gate" });
        banner.style.cssText = "margin:0 0 18px;padding:14px 16px;border:1px solid var(--accent);border-left-width:2px;border-radius:3px;background:var(--accent-05);color:var(--text);font-size:14px;";
        banner.innerHTML = "The Studio tools are for signed-in members. <a id='st2-gate-in' style='color:var(--accent);cursor:pointer;text-decoration:underline;'>Sign in with Google</a> to use them. The encyclopedia and the Gym stay free and open.";
        screen.insertBefore(banner, screen.firstChild.nextSibling);
        var gi = view.querySelector("#st2-gate-in"); if (gi) gi.onclick = function () { window.AIE_AUTH.signInGoogle(); };
      } else if (!g && banner) { banner.remove(); }
    }
    if (window.AIE_AUTH && window.AIE_AUTH.onChange) window.AIE_AUTH.onChange(applyGate); else applyGate();

    /* run */
    runBtn.addEventListener("click", function () {
      if (gated()) { statusEl.style.color = ""; statusEl.textContent = "Sign in with Google (above) to use the Studio."; return; }
      var inputs = {};
      view.querySelectorAll("[data-f]").forEach(function (n) { inputs[n.getAttribute("data-f")] = n.value || ""; });
      var primary = (inputs[t.primary.f] || "").trim();
      if (attached.length) {
        primary += "\n\n" + attached.map(function (a) { return "--- ATTACHED SOURCE: " + a.label + " ---\n" + a.text; }).join("\n\n");
      }
      if (!primary) { statusEl.style.color = ""; statusEl.textContent = "Add some input first (type, upload, or link)."; return; }
      inputs[t.primary.f] = primary;

      runBtn.disabled = true; var label = runBtn.textContent; runBtn.textContent = "Working…";
      statusEl.style.color = ""; statusEl.textContent = mode() === "pro" ? "Calling the model (Pro)…" : "Calling the model from your browser…";
      outEl.textContent = "";
      t.build(inputs).then(function (user) { return call(t.system, user, t.max); })
        .then(function (text) { outEl.textContent = text; statusEl.textContent = "Done."; })
        .catch(function (e) { statusEl.style.color = "var(--danger)"; statusEl.textContent = "Error: " + e.message; })
        .finally(function () { runBtn.disabled = false; runBtn.textContent = label; });
    });
  }

  /* ---------- router ---------- */
  function route() {
    var h = (location.hash || "").replace(/^#/, "");
    if (TOOLS[h]) renderTool(h); else renderHub();
  }
  window.addEventListener("hashchange", route);
  route();
})();
