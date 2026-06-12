/* ============================================================
   LLM FIELD MANUAL — capstone instruments
   C.1 THE FORGE  — design a frontier model end-to-end,
                    chaining every equation in the manual.
   C.2 TOKEN JOURNEY — walk one prompt through the pipeline.
   ============================================================ */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }

  function siFormat(x, digits) {
    digits = digits === undefined ? 1 : digits;
    var units = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
    for (var i = 0; i < units.length; i++) {
      if (Math.abs(x) >= units[i][0]) return (x / units[i][0]).toFixed(digits) + units[i][1];
    }
    return x.toFixed(digits);
  }
  function softmax(logits, T) {
    var m = -Infinity, i;
    for (i = 0; i < logits.length; i++) m = Math.max(m, logits[i] / T);
    var s = 0, out = [];
    for (i = 0; i < logits.length; i++) { out.push(Math.exp(logits[i] / T - m)); s += out[i]; }
    return out.map(function (v) { return v / s; });
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================
     C.1 — THE FORGE
     ============================================================ */
  (function forge() {
    var root = $("forge-demo");
    if (!root) return;

    /* corrected Chinchilla fit (Epoch AI) — same constants as CH 04 */
    var E = 1.82, A = 482.0, B = 2085.4, al = 0.3478, be = 0.3658;
    var KFAC = Math.pow((al * A) / (be * B), 1 / (al + be)); // N* prefactor
    var EXP = be / (al + be);

    var cCtl = $("forge-c"), otCtl = $("forge-ot");
    var cOut = $("forge-c-out"), otOut = $("forge-ot-out");
    var archBtns = root.querySelectorAll("[data-forge-arch]");
    var precBtns = root.querySelectorAll("[data-forge-prec]");
    var ctxSel = $("forge-ctx"), gpuSel = $("forge-gpu");
    var activeFrac = 1, precBytes = 1;

    var GPUS = {
      h100: { name: "H100", mem: 80e9, bw: 3.35e12 },
      b200: { name: "B200", mem: 192e9, bw: 8.0e12 },
      rtx4090: { name: "RTX 4090", mem: 24e9, bw: 1.01e12 },
      m4max: { name: "M4 Max 128GB", mem: 128e9, bw: 0.546e12 }
    };

    var ADJ = ["ONYX", "IRON", "HALO", "VECTOR", "CIPHER", "AURORA", "BASILISK", "MERIDIAN", "TUNDRA", "ZENITH"];
    var NOUN = ["LATTICE", "ORACLE", "SIGNAL", "MONOLITH", "GRADIENT", "HORIZON", "TENSOR", "CITADEL", "PRISM", "ECHO"];

    function layersFor(nAct) {
      if (nAct < 2e9) return 24;
      if (nAct < 8e9) return 32;
      if (nAct < 3e10) return 48;
      if (nAct < 9e10) return 80;
      return 96;
    }

    function render() {
      var Cexp = parseFloat(cCtl.value);
      var C = Math.pow(10, Cexp);
      var f = Math.pow(2, +otCtl.value);
      cOut.textContent = "10^" + Cexp.toFixed(1) + " FLOPs";
      otOut.textContent = f === 1 ? "1× (CHINCHILLA-OPTIMAL)" : f + "× TOKENS";

      /* compute-optimal split, then over-train: N ↓ √f, D ↑ √f at fixed C */
      var Nopt = KFAC * Math.pow(C / 6, EXP);
      var Nact = Nopt / Math.sqrt(f);
      var D = C / (6 * Nact);
      var Ntot = Nact / activeFrac;
      var loss = E + A / Math.pow(Nact, al) + B / Math.pow(D, be);

      /* training fleet for a 90-day run, H100 @ 45% MFU, $2/hr */
      var gpus = Math.max(8, Math.ceil(C / (0.45 * 989e12 * 90 * 86400) / 8) * 8);
      var cost = C / (0.45 * 989e12) / 3600 * 2; // $ = gpu-secs/3600 × $2 (fleet-size independent)

      /* deployment */
      var gpu = GPUS[gpuSel.value];
      var ctxT = +ctxSel.value;
      var weights = Ntot * precBytes;
      var L = layersFor(Nact);
      var kvPerTok = 2 * L * 8 * 128 * 2;            // GQA-8, fp16 KV
      var kvPerUser = kvPerTok * ctxT;
      var tokS = gpu.bw / (precBytes * Nact);
      var gpusServe = Math.ceil(weights / (gpu.mem * 0.9));
      var freeMem = gpu.mem * gpusServe * 0.9 - weights;
      var users = Math.max(0, Math.floor(freeMem / kvPerUser));

      /* codename */
      var ai = Math.floor((Cexp - 22) / 4.31 * ADJ.length) % ADJ.length;
      var ni = (Math.round(+otCtl.value) * 3 + (activeFrac < 1 ? 5 : 0) + ["8192", "131072", "1048576"].indexOf(ctxSel.value)) % NOUN.length;
      $("forge-name").textContent = ADJ[Math.max(0, ai)] + " " + NOUN[Math.max(0, ni)];
      $("forge-class").textContent = (activeFrac < 1 ? "MoE " + Math.round(1 / activeFrac) + ":1" : "DENSE") +
        " · " + (ctxT >= 1048576 ? "1M" : (ctxT / 1024) + "K") + " CTX · " + (precBytes === 2 ? "BF16" : precBytes === 1 ? "FP8" : "INT4");

      function set(id, v, cls) {
        var el = $(id); el.textContent = v;
        if (cls !== undefined) el.parentElement.className = "do-cell " + cls;
      }
      set("forge-ntotal", siFormat(Ntot, 0));
      set("forge-nactive", siFormat(Nact, 0));
      set("forge-d", siFormat(D, 1) + " tok");
      set("forge-ratio", (D / Nact).toFixed(0) + "×");
      set("forge-loss", loss.toFixed(3));
      set("forge-flops", C.toExponential(1));
      set("forge-gpus", gpus.toLocaleString() + " × H100");
      set("forge-traincost", cost >= 1e9 ? "$" + (cost / 1e9).toFixed(2) + "B" : cost >= 1e6 ? "$" + (cost / 1e6).toFixed(1) + "M" : "$" + Math.round(cost / 1e3) + "K");
      set("forge-weights", (weights / 1e9).toFixed(0) + " GB");
      set("forge-toks", tokS > 2000 ? ">2,000 tok/s" : tokS.toFixed(0) + " tok/s", tokS < 20 ? "bad" : "hot");
      set("forge-kv", kvPerUser / 1e9 >= 1 ? (kvPerUser / 1e9).toFixed(1) + " GB" : (kvPerUser / 1e6).toFixed(0) + " MB");
      set("forge-users", users.toLocaleString(), users === 0 ? "bad" : "hot");

      $("forge-note").innerHTML =
        "DEPLOY TARGET: " + gpu.name + (gpusServe > 1 ? " ×" + gpusServe + " (weights need sharding)" : "") +
        " &nbsp;·&nbsp; single-stream decode ceiling = BW ÷ (bytes × N_active) — EQ 7.1" +
        " &nbsp;·&nbsp; concurrency = spare HBM ÷ KV per user — EQ 3.5" +
        (users === 0 ? " &nbsp;·&nbsp; <span style='color:#ff4136'>ZERO concurrent users fit: shrink context, quantize, or add GPUs.</span>" : "");
    }

    cCtl.addEventListener("input", render);
    otCtl.addEventListener("input", render);
    ctxSel.addEventListener("input", render);
    gpuSel.addEventListener("input", render);
    archBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        activeFrac = parseFloat(b.getAttribute("data-forge-arch"));
        archBtns.forEach(function (x) { x.classList.toggle("on", x === b); });
        render();
      });
    });
    precBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        precBytes = parseFloat(b.getAttribute("data-forge-prec"));
        precBtns.forEach(function (x) { x.classList.toggle("on", x === b); });
        render();
      });
    });
    render();
  })();

  /* ============================================================
     C.2 — TOKEN JOURNEY
     A toy word-level LM with hand-built bigram preferences,
     animated through the pipeline stages.
     ============================================================ */
  (function journey() {
    var root = $("journey-demo");
    if (!root) return;

    var BI = {
      "the": [["robot", 2.8], ["model", 2.6], ["ball", 2.2], ["data", 2.0], ["gradient", 1.6], ["room", 1.4], ["answer", 1.3], ["future", 1.0]],
      "robot": [["picked", 2.6], ["slowly", 2.0], ["learned", 1.9], ["was", 1.6], ["attends", 1.2], ["dreams", 0.8]],
      "picked": [["up", 3.4], ["the", 1.2], ["a", 1.0]],
      "up": [["the", 3.0], ["a", 1.8], ["its", 1.4], ["speed", 0.9]],
      "ball": [["because", 2.2], ["and", 1.8], ["gently", 1.4], ["was", 1.3], [".", 1.2]],
      "because": [["it", 3.2], ["the", 1.6], ["gravity", 0.9]],
      "it": [["was", 3.0], ["learned", 1.6], ["attends", 1.1], ["fell", 1.0]],
      "was": [["heavy", 2.4], ["light", 1.7], ["learning", 1.5], ["red", 1.2], ["trained", 1.2]],
      "heavy": [[".", 2.8], ["and", 1.6], ["but", 1.3]],
      "model": [["predicts", 2.7], ["attends", 2.0], ["was", 1.7], ["learned", 1.5], ["samples", 1.2]],
      "predicts": [["the", 2.8], ["a", 1.7], ["tokens", 1.4]],
      "attends": [["to", 3.6]],
      "to": [["the", 3.0], ["every", 1.8], ["its", 1.3]],
      "every": [["token", 2.9], ["word", 1.7], ["position", 1.4]],
      "token": [["in", 2.2], ["was", 1.5], ["matters", 1.2], [".", 1.1]],
      "in": [["the", 3.2], ["context", 1.6], ["parallel", 1.2]],
      "data": [["was", 2.0], ["flows", 1.7], ["matters", 1.4], [".", 1.0]],
      "gradient": [["descends", 2.4], ["flows", 2.0], ["was", 1.2]],
      "learned": [["to", 2.8], ["the", 1.6], ["fast", 1.1]],
      "and": [["the", 2.6], ["it", 1.8], ["then", 1.3]],
      ".": [["The", 2.5], ["It", 1.8], ["Then", 1.2]],
      "_": [["the", 2.0], ["it", 1.6], ["and", 1.4], ["was", 1.2], ["model", 1.1], ["token", 1.0], [".", 0.9], ["data", 0.8]]
    };

    var STAGES = ["TOKENIZE", "EMBED", "ATTEND ×L", "MLP ×L", "LOGITS", "SAMPLE", "APPEND"];
    var stagesEl = $("jt-stages"), ctxEl = $("jt-context"), barsEl = $("jt-bars");
    var stepBtn = $("jt-step"), autoBtn = $("jt-auto"), resetBtn = $("jt-reset");
    var tCtl = $("jt-temp"), tOut = $("jt-temp-out");
    var input = $("jt-input");
    var rng = mulberry32(2026);

    var words = [], busy = false, auto = false, autoTimer = null;

    function buildStages() {
      stagesEl.innerHTML = "";
      STAGES.forEach(function (s) {
        var d = document.createElement("div");
        d.className = "stage";
        d.innerHTML = s + "<span class='st-sub'>" +
          ({ "TOKENIZE": "text → ids", "EMBED": "ids → vectors", "ATTEND ×L": "mix positions", "MLP ×L": "transform", "LOGITS": "z ∈ ℝ^|V|", "SAMPLE": "τ, top-k", "APPEND": "loop" }[s]) +
          "</span>";
        stagesEl.appendChild(d);
      });
    }

    function reset() {
      clearTimeout(autoTimer); auto = false; busy = false;
      autoBtn.textContent = "AUTO";
      words = input.value.trim().split(/\s+/).filter(Boolean).slice(0, 24);
      if (!words.length) words = ["The"];
      renderContext(-1);
      barsEl.innerHTML = "";
      buildStages();
    }

    function renderContext(attnFocus) {
      ctxEl.innerHTML = "";
      var n = words.length;
      words.forEach(function (w, i) {
        var chip = document.createElement("span");
        chip.className = "tok-chip " + (i < input.value.trim().split(/\s+/).filter(Boolean).length ? "tok-c2" : "tok-c0");
        chip.textContent = w;
        if (attnFocus >= 0 && i < n) {
          // toy attention from the final position: recency + bigram affinity
          var rec = Math.exp(-0.45 * (n - 1 - i));
          var a = Math.min(1, rec + (i === n - 1 ? 0.25 : 0));
          chip.style.borderColor = "rgba(166,242,204," + (0.15 + a * 0.8) + ")";
          chip.style.background = "rgba(166,242,204," + (a * 0.28) + ")";
        }
        ctxEl.appendChild(chip);
      });
    }

    function candidates() {
      var last = words[words.length - 1];
      var key = last.toLowerCase().replace(/[^a-z.]/g, "");
      var list = BI[key] || BI[last] || BI["_"];
      // pad with fallbacks to 8
      var have = {}, out = [];
      list.forEach(function (c) { if (!have[c[0]]) { have[c[0]] = 1; out.push(c); } });
      BI["_"].forEach(function (c) { if (out.length < 8 && !have[c[0]]) { have[c[0]] = 1; out.push([c[0], c[1] - 1.5]); } });
      return out.slice(0, 8);
    }

    function light(idx) {
      var kids = stagesEl.children;
      for (var i = 0; i < kids.length; i++) kids[i].classList.toggle("on", i === idx);
    }

    function step() {
      if (busy) return;
      busy = true;
      var DELAY = auto ? 130 : 220;
      var cands = candidates();
      var T = parseFloat(tCtl.value);
      var probs = softmax(cands.map(function (c) { return c[1]; }), T);

      var seq = 0;
      function phase(fn) { setTimeout(fn, DELAY * (seq++)); }

      phase(function () { light(0); renderContext(-1); });
      phase(function () { light(1); });
      phase(function () { light(2); renderContext(words.length - 1); });
      phase(function () { light(3); });
      phase(function () {
        light(4);
        barsEl.innerHTML = "";
        cands.forEach(function (c, i) {
          var row = document.createElement("div");
          row.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:4px;";
          row.innerHTML =
            "<span style='font-family:ui-monospace,Menlo,monospace;font-size:11px;width:84px;text-align:right;color:#e5e5e5;flex:none;'>" + c[0] + "</span>" +
            "<div style='flex:1;height:11px;background:rgba(47,50,52,.4);border-radius:2px;overflow:hidden;'><div data-bar='" + i + "' style='height:100%;width:" + (probs[i] * 100) + "%;background:rgba(166,242,204,.8);'></div></div>" +
            "<span style='font-family:ui-monospace,Menlo,monospace;font-size:10px;color:#9b9b9b;width:46px;flex:none;'>" + (probs[i] * 100).toFixed(1) + "%</span>";
          barsEl.appendChild(row);
        });
      });
      phase(function () {
        light(5);
        var u = rng(), cum = 0, pick = 0;
        for (var i = 0; i < cands.length; i++) { cum += probs[i]; if (u <= cum) { pick = i; break; } }
        var bar = barsEl.querySelector("[data-bar='" + pick + "']");
        if (bar) bar.style.background = "#a6f2cc";
        step.picked = cands[pick][0];
      });
      phase(function () {
        light(6);
        words.push(step.picked);
        if (words.length > 26) { words = words.slice(-26); }
        renderContext(-1);
        busy = false;
        if (auto) {
          if (step.picked !== "." && words.length < 30) {
            autoTimer = setTimeout(step, 300);
          } else {
            auto = false;
            autoBtn.textContent = "AUTO";
          }
        }
      });
    }

    stepBtn.addEventListener("click", function () { auto = false; clearTimeout(autoTimer); autoBtn.textContent = "AUTO"; step(); });
    autoBtn.addEventListener("click", function () {
      auto = !auto;
      autoBtn.textContent = auto ? "STOP" : "AUTO";
      if (auto) step(); else clearTimeout(autoTimer);
    });
    resetBtn.addEventListener("click", reset);
    input.addEventListener("change", reset);
    tCtl.addEventListener("input", function () { tOut.textContent = parseFloat(tCtl.value).toFixed(2); });

    tOut.textContent = parseFloat(tCtl.value).toFixed(2);
    reset();
  })();

})();
