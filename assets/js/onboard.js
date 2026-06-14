/* ============================================================
   AI ENCYCLOPEDIA — onboarding (intent x depth router).
   - Inline chooser in #onboard (the landing "Find your path").
   - First-run full-screen flow on the home page.
   - Depth now sets WHERE you start: New = chapter 1, Some = first
     core chapter, Practitioner = first advanced chapter.
   - Persists to localStorage; syncs to the signed-in profile.
   ============================================================ */
(function () {
  "use strict";

  var INTENTS = [
    { id: "prompting", label: "Write better prompts", tracks: ["prompting"], blurb: "Every prompting technique that survives modern models." },
    { id: "agents", label: "Build AI agents", tracks: ["agents", "prompting"], blurb: "Context, tools, harness, loops, evals." },
    { id: "ml", label: "Learn ML from scratch", tracks: ["stats", "data", "ml", "mlops"], blurb: "Statistics and data through models and validation." },
    { id: "dl", label: "Deep learning", tracks: ["dl", "ml"], blurb: "CNNs, RNNs, transformers, autoencoders, GANs." },
    { id: "quant", label: "Quant & finance", tracks: ["timeseries", "quant", "stats"], blurb: "Time series, stochastic models, option pricing, risk." },
    { id: "mlrisk", label: "Model risk & validation", tracks: ["mlops", "data", "stats"], blurb: "Cross-validation, metrics, drift, explainability, governance." },
    { id: "llm", label: "LLMs end-to-end", tracks: ["chapters", "prompting", "agents"], blurb: "Architecture to alignment to deployment to agents." },
    { id: "all", label: "Everything", tracks: [], blurb: "The whole map, first principles to frontier." }
  ];
  var DEPTHS = [{ id: "new", label: "New to it" }, { id: "some", label: "Some background" }, { id: "pro", label: "Practitioner" }];
  var TRACK_NAME = { stats: "Mathematics & Statistics", data: "Data & Feature Engineering", ml: "Machine Learning", mlops: "Model Validation & Risk", dl: "Deep Learning", rl: "Reinforcement Learning", "game-theory": "Game Theory", timeseries: "Time Series & Econometrics", quant: "Quantitative Finance", chapters: "The LLM Field Manual", prompting: "Prompting", agents: "Agent Engineering", multimodal: "Multimodal & World Models", openmodels: "Open Models & Practice", frameworks: "Frameworks" };
  var ALL_ORDER = ["stats", "data", "ml", "mlops", "dl", "rl", "game-theory", "timeseries", "quant", "chapters", "prompting", "agents", "multimodal", "openmodels", "frameworks"];
  var LEVEL_RANK = { intro: 0, core: 1, advanced: 2 };

  function rank(c) { var r = LEVEL_RANK[(c.level || "").toLowerCase()]; return r == null ? 0 : r; }
  function byFile(a, b) { return a.file.localeCompare(b.file); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var manifest = null;
  function load(cb) {
    if (manifest) return cb();
    fetch("/content.json").then(function (r) { return r.json(); }).then(function (d) { manifest = d; cb(); }).catch(function () { manifest = []; cb(); });
  }
  function tracksOf(intent) { return intent.tracks.length ? intent.tracks : ALL_ORDER; }
  function primaryList(intent) {
    var tr = tracksOf(intent), l = manifest.filter(function (c) { return c.dir === tr[0]; }).sort(byFile);
    if (l.length) return l;
    for (var i = 1; i < tr.length; i++) { var x = manifest.filter(function (c) { return c.dir === tr[i]; }).sort(byFile); if (x.length) return x; }
    return [];
  }
  /* depth -> starting index in the primary track */
  function startIdx(list, depth) {
    var len = list.length; if (!len) return 0;
    if (depth === "new") return 0;
    var fc = list.findIndex(function (c) { return rank(c) >= 1; });
    var fa = list.findIndex(function (c) { return rank(c) >= 2; });
    if (depth === "some") return Math.min(fc > 0 ? fc : 1, len - 1);
    return Math.min(fa > 0 ? fa : (fc > 0 ? fc + 1 : 2), len - 1);
  }
  function firstChapter(intent, depth) { if (!manifest || !manifest.length) return null; var l = primaryList(intent); return l.length ? l[startIdx(l, depth)] : null; }
  function countFor(intent, depth) { if (!manifest) return 0; var tr = tracksOf(intent); var total = manifest.filter(function (c) { return tr.indexOf(c.dir) >= 0; }).length; return Math.max(1, total - startIdx(primaryList(intent), depth)); }

  var selIntent = get("aie-intent") || null;
  var selDepth = get("aie-depth") || "some";

  function persist() {
    set("aie-intent", selIntent || ""); set("aie-depth", selDepth);
    try { if (window.AIE_AUTH && window.AIE_AUTH.user && window.AIE_AUTH.user()) window.AIE_AUTH.saveProfile({ intent: selIntent, depth: selDepth }); } catch (e) {}
  }

  function chipsHtml() { return INTENTS.map(function (x) { return '<button class="ob-chip' + (x.id === selIntent ? " on" : "") + '" data-intent="' + x.id + '">' + x.label + "</button>"; }).join(""); }
  function depthsHtml() { return DEPTHS.map(function (d) { return '<button class="ob-depth' + (d.id === selDepth ? " on" : "") + '" data-depth="' + d.id + '">' + d.label + "</button>"; }).join(""); }
  function resultHtml() {
    var io = INTENTS.filter(function (x) { return x.id === selIntent; })[0];
    if (!io) return "";
    var fc = firstChapter(io, selDepth), n = countFor(io, selDepth);
    var tl = (io.tracks.length ? io.tracks : Object.keys(TRACK_NAME)).map(function (t) { return TRACK_NAME[t]; }).filter(Boolean).join(" · ");
    if (!fc) return "";
    var depthLabel = (DEPTHS.filter(function (d) { return d.id === selDepth; })[0] || {}).label || "";
    return '<div class="ob-result" data-reveal><div class="ob-result-l"><div class="ob-kicker">' + n + "-CHAPTER PATH · " + depthLabel.toUpperCase() +
      "</div><h3>" + io.label + "</h3><p>" + io.blurb + '</p><p class="ob-tracks">' + tl + "</p></div>" +
      '<div class="ob-result-r"><a class="ob-start" href="' + fc.file.replace(/^\//, "") + '">Start: ' + fc.title + "</a>" +
      '<a class="ob-map" href="#toc">Browse the full map</a></div></div>';
  }
  function wire(scope) {
    scope.querySelectorAll(".ob-chip").forEach(function (b) { b.addEventListener("click", function () { selIntent = b.getAttribute("data-intent"); persist(); renderAll(); }); });
    scope.querySelectorAll(".ob-depth").forEach(function (b) { b.addEventListener("click", function () { selDepth = b.getAttribute("data-depth"); persist(); renderAll(); }); });
  }

  /* inline chooser on the landing */
  var inlineRoot = document.getElementById("onboard");
  function renderInline() {
    if (!inlineRoot) return;
    inlineRoot.innerHTML = '<div class="ob-q">I want to…</div><div class="ob-chips">' + chipsHtml() + '</div><div class="ob-q ob-q2">How deep?</div><div class="ob-depths">' + depthsHtml() + "</div>" + resultHtml();
    wire(inlineRoot);
  }

  /* first-run full-screen flow */
  var overlay = null;
  function buildOverlay() {
    var css = "#aie-ob-ov{position:fixed;inset:0;z-index:9600;background:var(--bg,#000);display:none;overflow:auto;padding:7vh 6vw}#aie-ob-ov.on{display:block}#aie-ob-ov .ob-wrap{max-width:760px;margin:0 auto}#aie-ob-ov .ob-eye{font-family:var(--font-mono,monospace);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent,#a6f2cc);margin-bottom:14px}#aie-ob-ov h2{font-family:var(--font-display,inherit);font-size:clamp(28px,5vw,44px);color:var(--text-bright,#fff);margin:0 0 10px}#aie-ob-ov .ob-lede{color:var(--text-secondary,#9b9b9b);margin:0 0 28px;font-size:16px}#aie-ob-ov .ob-actions{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:26px}#aie-ob-ov .ob-skip{background:transparent;border:0;color:var(--text-muted,#636363);cursor:pointer;font-size:14px;text-decoration:underline}#aie-ob-ov .ob-signin{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border:1px solid var(--hairline,#2f3234);border-radius:2px;background:transparent;color:var(--text,#e5e5e5);cursor:pointer;font-size:14px}#aie-ob-ov .ob-signin:hover{border-color:var(--text-muted,#636363)}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    overlay = document.createElement("div"); overlay.id = "aie-ob-ov";
    overlay.innerHTML = '<div class="ob-wrap"><div class="ob-eye">Find your path</div><h2>What do you want to learn?</h2>' +
      '<p class="ob-lede">Pick a goal and how deep you are. We will point you at the right first chapter. You can change this anytime; nothing is locked.</p>' +
      '<div id="aie-ob-body"></div>' +
      '<div class="ob-actions"><span id="aie-ob-auth"></span><button class="ob-skip" id="aie-ob-skip">Skip — just browse everything</button></div></div>';
    document.body.appendChild(overlay);
  }
  function renderOverlay() {
    if (!overlay) return;
    var body = overlay.querySelector("#aie-ob-body");
    body.innerHTML = '<div class="ob-q">I want to…</div><div class="ob-chips">' + chipsHtml() + '</div><div class="ob-q ob-q2">How deep?</div><div class="ob-depths">' + depthsHtml() + "</div>" + resultHtml();
    wire(body);
    var auth = overlay.querySelector("#aie-ob-auth");
    if (window.AIE_AUTH && window.AIE_AUTH.enabled && !(window.AIE_AUTH.user && window.AIE_AUTH.user())) {
      auth.innerHTML = '<button class="ob-signin" id="aie-ob-google">Save my path — sign in with Google</button>';
      auth.querySelector("#aie-ob-google").addEventListener("click", function () { persist(); window.AIE_AUTH.signInGoogle(); });
    } else { auth.innerHTML = ""; }
  }
  function closeOverlay() { if (overlay) overlay.classList.remove("on"); set("aie-onboarded", "1"); }

  function renderAll() { renderInline(); renderOverlay(); }

  load(function () {
    renderInline();
    // first-run: only on the home page, only once
    var isHome = location.pathname === "/" || /\/index\.html$/.test(location.pathname);
    if (isHome && !get("aie-onboarded") && !selIntent) {
      buildOverlay(); renderOverlay(); overlay.classList.add("on");
      overlay.querySelector("#aie-ob-skip").addEventListener("click", closeOverlay);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) closeOverlay(); });
      // proceeding via a Start link also counts as onboarded
      overlay.addEventListener("click", function (e) { if (e.target.classList && e.target.classList.contains("ob-start")) set("aie-onboarded", "1"); });
    }
  });

  // prefill from a signed-in profile when it arrives
  if (window.AIE_AUTH && window.AIE_AUTH.onChange) {
    window.AIE_AUTH.onChange(function (user) {
      if (!user || !window.AIE_AUTH.getProfile) return;
      window.AIE_AUTH.getProfile().then(function (p) {
        if (p && (p.intent || p.depth)) { if (p.intent) selIntent = p.intent; if (p.depth) selDepth = p.depth; set("aie-intent", selIntent || ""); set("aie-depth", selDepth); renderAll(); }
      });
    });
  }
})();
