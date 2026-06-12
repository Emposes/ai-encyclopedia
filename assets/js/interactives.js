/* ============================================================
   LLM FIELD MANUAL — interactive instruments
   Every widget is self-contained and only boots if its root
   element exists on the page. Pure client-side, no deps
   beyond the DOM (GSAP optional for flourishes).
   ============================================================ */
(function () {
  "use strict";

  /* ================= helpers ================= */
  function $(id) { return document.getElementById(id); }

  function softmax(logits, T) {
    T = T || 1;
    var m = -Infinity, i;
    for (i = 0; i < logits.length; i++) m = Math.max(m, logits[i] / T);
    var sum = 0, out = new Array(logits.length);
    for (i = 0; i < logits.length; i++) { out[i] = Math.exp(logits[i] / T - m); sum += out[i]; }
    for (i = 0; i < logits.length; i++) out[i] /= sum;
    return out;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function siFormat(x, digits) {
    digits = digits === undefined ? 1 : digits;
    var units = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
    for (var i = 0; i < units.length; i++) {
      if (Math.abs(x) >= units[i][0]) return (x / units[i][0]).toFixed(digits) + units[i][1];
    }
    return x.toFixed(digits);
  }

  function setupCanvas(canvas, cssH) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || canvas.parentElement.clientWidth;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = cssH + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: cssH };
  }

  var MINT = "#a6f2cc", DEEP = "#2b5945", BLUE = "#4e8af7", RED = "#ff4136",
      HAIR = "#2f3234", MUT = "#636363", SEC = "#9b9b9b", BRIGHT = "#ffffff";
  var MONO = "10px ui-monospace, SF Mono, Menlo, monospace";

  /* ============================================================
     01 — TOKENIZER  (#tok-demo)
     Greedy longest-match over a toy BPE-style vocabulary.
     ============================================================ */
  (function tokenizer() {
    var root = $("tok-demo");
    if (!root) return;
    var input = $("tok-input"), out = $("tok-out");
    var rTok = $("tok-count"), rChr = $("tok-chars"), rRatio = $("tok-ratio");

    // toy merge vocabulary: longest-match-first imitates trained BPE merges
    var VOCAB = [
      "transformer", "attention", "language", " language", " models", " model",
      "token", " token", "izer", "ization", "ing", "tion", "ment", "ness", "able",
      " the", " The", " and", " of", " to", " is", " are", " in", " a", " with",
      " pre", " train", "train", "ed", "er", "est", "ly", "un", "re", " self",
      " neural", " network", "qu", "th", "ch", "sh", "ou", "ea", " ", ".", ",", "!", "?"
    ].sort(function (a, b) { return b.length - a.length; });

    function tokenize(text) {
      var toks = [], i = 0;
      while (i < text.length) {
        var matched = null;
        for (var v = 0; v < VOCAB.length; v++) {
          if (text.startsWith(VOCAB[v], i)) { matched = VOCAB[v]; break; }
        }
        if (!matched) matched = text[i];
        toks.push(matched);
        i += matched.length;
      }
      return toks;
    }

    function render() {
      var text = input.value;
      var toks = tokenize(text);
      out.innerHTML = "";
      toks.forEach(function (t, i) {
        var chip = document.createElement("span");
        chip.className = "tok-chip tok-c" + (i % 4);
        chip.textContent = t.replace(/ /g, "␣"); // visible space
        out.appendChild(chip);
      });
      rTok.textContent = toks.length;
      rChr.textContent = text.length;
      rRatio.textContent = toks.length ? (text.length / toks.length).toFixed(2) : "—";
    }
    input.addEventListener("input", render);
    render();
  })();

  /* ============================================================
     03 — ATTENTION HEATMAP  (#attn-demo)
     Hand-crafted score matrix for one sentence; softmax with
     adjustable temperature; hover a token to inspect its row.
     ============================================================ */
  (function attention() {
    var root = $("attn-demo");
    if (!root) return;
    var TOK = ["The", "robot", "picked", "up", "the", "ball", "because", "it", "was", "heavy", "."];
    var n = TOK.length;

    // raw (pre-softmax) scores — crafted to mirror real head behavior
    var S = [];
    for (var i = 0; i < n; i++) {
      S.push([]);
      for (var j = 0; j < n; j++) {
        if (j > i) { S[i].push(-Infinity); continue; }   // causal mask
        var s = -1.2;
        if (j === i) s = 0.3;          // self
        if (j === i - 1) s = 0.9;      // previous token
        if (j === 0) s = Math.max(s, 0.1); // BOS sink
        S[i].push(s);
      }
    }
    function bump(qi, kj, v) { S[qi][kj] = v; }
    bump(2, 1, 2.0);  // picked -> robot
    bump(3, 2, 2.6);  // up -> picked
    bump(5, 2, 1.5);  // ball -> picked
    bump(5, 4, 1.2);  // ball -> the
    bump(7, 5, 3.4);  // it -> ball   (coreference)
    bump(7, 1, 1.6);  // it -> robot
    bump(8, 7, 1.9);  // was -> it
    bump(9, 7, 2.0);  // heavy -> it
    bump(9, 5, 2.8);  // heavy -> ball
    bump(10, 9, 1.4); // . -> heavy

    var canvas = $("attn-canvas"), tempCtl = $("attn-temp"), tempOut = $("attn-temp-out");
    var sentence = $("attn-sentence");
    var queryRow = 7; // default: "it"

    // build clickable sentence
    var chips = [];
    TOK.forEach(function (t, i) {
      var el = document.createElement("span");
      el.className = "attn-tok";
      el.innerHTML = "<span class='w-pct'></span>" + t;
      el.addEventListener("mouseenter", function () { queryRow = i; render(); });
      sentence.appendChild(el);
      chips.push(el);
    });

    function weights() {
      var T = parseFloat(tempCtl.value);
      var W = [];
      for (var i = 0; i < n; i++) {
        var row = S[i].map(function (s) { return s === -Infinity ? -1e9 : s; });
        W.push(softmax(row.slice(0, i + 1).concat([]), T).concat(new Array(n - i - 1).fill(0)));
      }
      return W;
    }

    function render() {
      var T = parseFloat(tempCtl.value);
      tempOut.textContent = T.toFixed(2);
      var W = weights();

      // sentence chip highlights for current query row
      chips.forEach(function (el, j) {
        el.classList.toggle("q", j === queryRow);
        var w = W[queryRow][j];
        var pct = el.querySelector(".w-pct");
        if (j <= queryRow && j !== queryRow && w > 0.04) {
          el.classList.add("show-w");
          pct.textContent = (w * 100).toFixed(0) + "%";
          el.style.borderColor = "rgba(166,242,204," + Math.min(1, 0.15 + w * 1.6) + ")";
          el.style.background = "rgba(166,242,204," + (w * 0.45) + ")";
          el.style.color = w > 0.18 ? MINT : "#e5e5e5";
        } else if (j !== queryRow) {
          el.classList.remove("show-w");
          el.style.borderColor = ""; el.style.background = ""; el.style.color = "";
          pct.textContent = "";
        } else {
          el.classList.remove("show-w");
          el.style.borderColor = ""; el.style.background = ""; el.style.color = "";
        }
      });

      // heatmap
      var sc = setupCanvas(canvas, 360);
      var ctx = sc.ctx, pad = 64, cw = (sc.w - pad - 12) / n, chh = (360 - pad - 12) / n;
      ctx.clearRect(0, 0, sc.w, 360);
      ctx.font = MONO;
      for (var i = 0; i < n; i++) {
        // labels
        ctx.fillStyle = i === queryRow ? MINT : MUT;
        ctx.textAlign = "right";
        ctx.fillText(TOK[i], pad - 8, pad + i * chh + chh / 2 + 3);
        ctx.save();
        ctx.translate(pad + i * cw + cw / 2 + 3, pad - 8);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = "left";
        ctx.fillStyle = MUT;
        ctx.fillText(TOK[i], 0, 0);
        ctx.restore();

        for (var j = 0; j < n; j++) {
          var x = pad + j * cw, y = pad + i * chh;
          if (j > i) {
            ctx.fillStyle = "rgba(47,50,52,0.25)"; // masked
            ctx.fillRect(x + 1, y + 1, cw - 2, chh - 2);
            continue;
          }
          var w = W[i][j];
          ctx.fillStyle = "rgba(166,242,204," + Math.pow(w, 0.75) + ")";
          ctx.fillRect(x + 1, y + 1, cw - 2, chh - 2);
          if (i === queryRow) {
            ctx.strokeStyle = "rgba(166,242,204,0.5)";
            ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, chh - 1);
          }
        }
      }
      // query row marker
      ctx.strokeStyle = MINT;
      ctx.lineWidth = 1;
      ctx.strokeRect(pad - 2, pad + queryRow * chh, sc.w - pad - 8, chh);
    }

    tempCtl.addEventListener("input", render);
    window.addEventListener("resize", render);
    render();
  })();

  /* ============================================================
     03 — KV-CACHE CALCULATOR  (#kv-calc)
     ============================================================ */
  (function kvcalc() {
    var root = $("kv-calc");
    if (!root) return;
    var L = $("kv-layers"), H = $("kv-heads"), D = $("kv-dim"), Sq = $("kv-seq"), B = $("kv-batch"), P = $("kv-prec");
    var outs = { L: $("kv-layers-out"), H: $("kv-heads-out"), D: $("kv-dim-out"), S: $("kv-seq-out"), B: $("kv-batch-out") };
    var rTot = $("kv-total"), rPer = $("kv-per-tok"), rNote = $("kv-compare");

    function render() {
      var l = +L.value, h = +H.value, d = +D.value, s = Math.pow(2, +Sq.value), b = +B.value;
      var bytes = +P.value;
      outs.L.textContent = l; outs.H.textContent = h; outs.D.textContent = d;
      outs.S.textContent = s >= 1024 ? (s / 1024) + "K" : s; outs.B.textContent = b;
      var perTok = 2 * l * h * d * bytes;          // K and V
      var total = perTok * s * b;
      rPer.textContent = siFormat(perTok, 1) + "B";
      rTot.textContent = (total / 1e9).toFixed(2) + " GB";
      var h100 = 80e9;
      rNote.textContent = (total / h100 * 100).toFixed(1) + "% of one H100 (80 GB)";
    }
    [L, H, D, Sq, B, P].forEach(function (el) { el.addEventListener("input", render); });
    render();
  })();

  /* ============================================================
     04 — CHINCHILLA SCALING EXPLORER  (#scaling-demo)
     L(N,D) = E + A/N^a + B/D^b  with  D = C / 6N
     ============================================================ */
  (function scaling() {
    var root = $("scaling-demo");
    if (!root) return;
    /* corrected Chinchilla fit (Epoch AI replication, 2024) —
       reproduces the 70B/1.4T optimum at the paper's own budget */
    var E = 1.82, A = 482.0, Bc = 2085.4, al = 0.3478, be = 0.3658;
    var ctl = $("scale-c"), cOut = $("scale-c-out"), canvas = $("scale-canvas");
    var rN = $("scale-n"), rD = $("scale-d"), rR = $("scale-ratio"), rL = $("scale-loss");

    function lossCurve(C) {
      // sweep N, derive D from the budget, return curve + minimum
      var pts = [], best = { L: Infinity };
      for (var k = 0; k <= 240; k++) {
        var logN = 7 + (13 - 7) * (k / 240); // N from 1e7 to 1e13
        var N = Math.pow(10, logN);
        var D = C / (6 * N);
        if (D < 1e6) continue;
        var L = E + A / Math.pow(N, al) + Bc / Math.pow(D, be);
        pts.push({ N: N, L: L });
        if (L < best.L) best = { N: N, D: D, L: L };
      }
      return { pts: pts, best: best };
    }

    function render() {
      var exp = parseFloat(ctl.value);
      var C = Math.pow(10, exp);
      cOut.textContent = "10^" + exp.toFixed(1) + " FLOPs";

      var cur = lossCurve(C), ref = lossCurve(C / 100);
      rN.textContent = siFormat(cur.best.N, 0);
      rD.textContent = siFormat(cur.best.D, 1);
      rR.textContent = (cur.best.D / cur.best.N).toFixed(0) + "×";
      rL.textContent = cur.best.L.toFixed(3);

      var sc = setupCanvas(canvas, 300);
      var ctx = sc.ctx, padL = 56, padB = 36, padT = 18, padR = 18;
      var W = sc.w - padL - padR, H = 300 - padT - padB;
      ctx.clearRect(0, 0, sc.w, 300);

      var all = cur.pts.concat(ref.pts);
      var Lmin = Infinity, Lmax = -Infinity;
      all.forEach(function (p) { Lmin = Math.min(Lmin, p.L); Lmax = Math.max(Lmax, p.L); });
      Lmax = Math.min(Lmax, Lmin + 1.6);

      function X(N) { return padL + (Math.log10(N) - 7) / (13 - 7) * W; }
      function Y(L) { return padT + (1 - (L - Lmin) / (Lmax - Lmin)) * H; }

      // grid + axis labels
      ctx.strokeStyle = HAIR; ctx.fillStyle = MUT; ctx.font = MONO; ctx.lineWidth = 1;
      for (var e = 7; e <= 13; e++) {
        var x = X(Math.pow(10, e));
        ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + H); ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.fillText("1e" + e, x, padT + H + 18);
      }
      ctx.save();
      ctx.translate(14, padT + H / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center"; ctx.fillStyle = MUT;
      ctx.fillText("LOSS L(N, D)", 0, 0);
      ctx.restore();
      ctx.textAlign = "center"; ctx.fillStyle = MUT;
      ctx.fillText("PARAMETERS N (log)", padL + W / 2, padT + H + 32);

      function drawCurve(data, color, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.setLineDash(dash || []);
        ctx.beginPath();
        var started = false;
        data.pts.forEach(function (p) {
          if (p.L > Lmax) { return; }
          var x = X(p.N), y = Y(p.L);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
      drawCurve(ref, MUT, [4, 4]);
      drawCurve(cur, MINT);

      // optimum marker
      var bx = X(cur.best.N), by = Y(cur.best.L);
      ctx.fillStyle = MINT;
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(166,242,204,0.4)";
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, padT + H); ctx.stroke();
      ctx.fillStyle = MINT; ctx.textAlign = "left";
      ctx.fillText("N* = " + siFormat(cur.best.N, 0), Math.min(bx + 10, sc.w - 90), by - 8);

      ctx.fillStyle = MUT; ctx.textAlign = "right";
      ctx.fillText("C / 100 (dashed)", sc.w - padR, padT + 12);
    }
    ctl.addEventListener("input", render);
    window.addEventListener("resize", render);
    render();
  })();

  /* ============================================================
     06 — LORA PARAMETER COUNTER  (#lora-demo)
     ============================================================ */
  (function lora() {
    var root = $("lora-demo");
    if (!root) return;
    var dCtl = $("lora-d"), rCtl = $("lora-r");
    var dOut = $("lora-d-out"), rOut = $("lora-r-out");
    var rFull = $("lora-full"), rLora = $("lora-params"), rPct = $("lora-pct");
    var bar = $("lora-bar");

    function render() {
      var d = Math.pow(2, +dCtl.value);
      var r = Math.pow(2, +rCtl.value);
      dOut.textContent = d.toLocaleString();
      rOut.textContent = r;
      var full = d * d, lor = 2 * d * r;
      rFull.textContent = siFormat(full, 1);
      rLora.textContent = siFormat(lor, 1);
      var pct = lor / full * 100;
      rPct.textContent = pct < 0.01 ? pct.toExponential(1) + "%" : pct.toFixed(2) + "%";
      bar.style.width = Math.max(0.5, Math.min(100, pct)) + "%";
    }
    [dCtl, rCtl].forEach(function (el) { el.addEventListener("input", render); });
    render();
  })();

  /* ============================================================
     07 — QUANTIZER  (#quant-demo)
     Symmetric absmax quantization of a synthetic weight tensor,
     optional group-wise scales. Histogram + RMSE + model memory.
     ============================================================ */
  (function quant() {
    var root = $("quant-demo");
    if (!root) return;
    var canvas = $("quant-canvas"), bitsCtl = $("quant-bits"), bitsOut = $("quant-bits-out");
    var groupBtn = $("quant-group");
    var rLv = $("quant-levels"), rErr = $("quant-rmse"), rMem = $("quant-mem"), rFmt = $("quant-fmt");
    var BITS = [2, 3, 4, 6, 8, 16];
    var FMT = { 2: "INT2", 3: "INT3", 4: "INT4 / NF4", 6: "INT6", 8: "INT8 / FP8", 16: "FP16 / BF16" };
    var grouped = false;

    // synthetic weights: gaussian bulk + a few outliers (like real LLM layers)
    var rng = mulberry32(42);
    var Wgt = [];
    for (var i = 0; i < 8192; i++) {
      var u1 = Math.max(rng(), 1e-9), u2 = rng();
      var g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      if (rng() < 0.004) g *= 6; // outliers
      Wgt.push(g * 0.02);
    }

    function quantize(bits, useGroups) {
      if (bits >= 16) return { q: Wgt.slice(), rmse: 0 };
      var qmax = Math.pow(2, bits - 1) - 1;
      var out = new Array(Wgt.length), se = 0;
      var G = useGroups ? 64 : Wgt.length;
      for (var g0 = 0; g0 < Wgt.length; g0 += G) {
        var end = Math.min(g0 + G, Wgt.length), amax = 0;
        for (var i = g0; i < end; i++) amax = Math.max(amax, Math.abs(Wgt[i]));
        var s = amax / qmax || 1;
        for (var i = g0; i < end; i++) {
          var q = Math.max(-qmax - 1, Math.min(qmax, Math.round(Wgt[i] / s)));
          out[i] = q * s;
          se += (out[i] - Wgt[i]) * (out[i] - Wgt[i]);
        }
      }
      return { q: out, rmse: Math.sqrt(se / Wgt.length) };
    }

    function hist(data, bins, lo, hi) {
      var h = new Array(bins).fill(0);
      data.forEach(function (v) {
        var b = Math.floor((v - lo) / (hi - lo) * bins);
        if (b >= 0 && b < bins) h[b]++;
      });
      return h;
    }

    function render() {
      var bits = BITS[+bitsCtl.value];
      bitsOut.textContent = bits + "-bit";
      var res = quantize(bits, grouped);
      var lo = -0.09, hi = 0.09, bins = 121;
      var h0 = hist(Wgt, bins, lo, hi), h1 = hist(res.q, bins, lo, hi);
      var max = Math.max.apply(null, h0) * 1.1;

      var sc = setupCanvas(canvas, 280);
      var ctx = sc.ctx, padB = 26, H = 280 - padB, bw = sc.w / bins;
      ctx.clearRect(0, 0, sc.w, 280);

      // original distribution (ghost)
      ctx.fillStyle = "rgba(155,155,155,0.22)";
      h0.forEach(function (c, b) {
        var bh = c / max * H;
        ctx.fillRect(b * bw, H - bh, Math.max(1, bw - 1), bh);
      });
      // quantized (mint)
      ctx.fillStyle = "rgba(166,242,204,0.8)";
      h1.forEach(function (c, b) {
        var bh = Math.min(c / max * H, H);
        ctx.fillRect(b * bw, H - bh, Math.max(1, bw - 1), bh);
      });
      ctx.font = MONO; ctx.fillStyle = MUT; ctx.textAlign = "center";
      [-0.08, -0.04, 0, 0.04, 0.08].forEach(function (v) {
        var x = (v - lo) / (hi - lo) * sc.w;
        ctx.fillText(v.toFixed(2), x, 280 - 8);
      });

      var levels = bits >= 16 ? "65,536+" : Math.pow(2, bits).toLocaleString();
      rLv.textContent = levels;
      rErr.textContent = bits >= 16 ? "≈ 0" : res.rmse.toExponential(2);
      rMem.textContent = (70e9 * bits / 8 / 1e9).toFixed(0) + " GB";
      rFmt.textContent = FMT[bits];
    }

    bitsCtl.addEventListener("input", render);
    if (groupBtn) groupBtn.addEventListener("click", function () {
      grouped = !grouped;
      groupBtn.classList.toggle("on", grouped);
      groupBtn.textContent = grouped ? "group-wise scales: ON (g=64)" : "group-wise scales: OFF";
      render();
    });
    window.addEventListener("resize", render);
    render();
  })();

  /* ============================================================
     08 — SAMPLING PLAYGROUND  (#samp-demo)
     ============================================================ */
  (function sampling() {
    var root = $("samp-demo");
    if (!root) return;
    var CAND = [
      ["Paris", 8.4], ["the", 5.6], ["located", 4.9], ["a", 4.5], ["known", 4.1],
      ["France", 3.6], ["home", 3.3], ["one", 3.1], ["Lyon", 2.3], ["beautiful", 2.0],
      ["…", 1.5], ["Berlin", 0.7]
    ];
    var tCtl = $("samp-temp"), pCtl = $("samp-topp"), kCtl = $("samp-topk");
    var tOut = $("samp-temp-out"), pOut = $("samp-topp-out"), kOut = $("samp-topk-out");
    var bars = $("samp-bars"), btn = $("samp-btn"), outStream = $("samp-out"), rEnt = $("samp-entropy");
    var rng = mulberry32(1337);

    function distribution() {
      var T = parseFloat(tCtl.value), topP = parseFloat(pCtl.value), topK = parseInt(kCtl.value, 10);
      var probs = softmax(CAND.map(function (c) { return c[1]; }), T);
      var idx = probs.map(function (p, i) { return i; }).sort(function (a, b) { return probs[b] - probs[a]; });
      var kept = {}, cum = 0;
      for (var r = 0; r < idx.length; r++) {
        var i = idx[r];
        if (r >= topK) break;
        kept[i] = true;
        cum += probs[i];
        if (cum >= topP) break;
      }
      var Z = 0;
      Object.keys(kept).forEach(function (i) { Z += probs[i]; });
      var fin = CAND.map(function (_, i) { return kept[i] ? probs[i] / Z : 0; });
      return { raw: probs, fin: fin, kept: kept };
    }

    function render() {
      tOut.textContent = parseFloat(tCtl.value).toFixed(2);
      pOut.textContent = parseFloat(pCtl.value).toFixed(2);
      kOut.textContent = kCtl.value;
      var d = distribution();
      bars.innerHTML = "";
      var H = 0;
      CAND.forEach(function (c, i) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:6px;";
        var kept = !!d.kept[i];
        var label = document.createElement("span");
        label.style.cssText = "font-family:ui-monospace,Menlo,monospace;font-size:11.5px;width:88px;text-align:right;flex:none;" +
          (kept ? "color:#e5e5e5;" : "color:#636363;text-decoration:line-through;");
        label.textContent = c[0];
        var rail = document.createElement("div");
        rail.style.cssText = "flex:1;height:14px;background:rgba(47,50,52,0.4);position:relative;border-radius:2px;overflow:hidden;";
        var ghost = document.createElement("div");
        ghost.style.cssText = "position:absolute;inset:0;width:" + (d.raw[i] * 100) + "%;background:rgba(155,155,155,0.25);";
        var fillEl = document.createElement("div");
        fillEl.style.cssText = "position:absolute;inset:0;width:" + (d.fin[i] * 100) + "%;background:" + (kept ? "rgba(166,242,204,0.85)" : "transparent") + ";transition:width .25s ease-in-out;";
        var pct = document.createElement("span");
        pct.style.cssText = "font-family:ui-monospace,Menlo,monospace;font-size:10.5px;width:52px;flex:none;" + (kept ? "color:#a6f2cc;" : "color:#636363;");
        pct.textContent = kept ? (d.fin[i] * 100).toFixed(1) + "%" : "cut";
        rail.appendChild(ghost); rail.appendChild(fillEl);
        row.appendChild(label); row.appendChild(rail); row.appendChild(pct);
        bars.appendChild(row);
        if (d.fin[i] > 0) H -= d.fin[i] * Math.log2(d.fin[i]);
      });
      rEnt.textContent = H.toFixed(2) + " bits";
    }

    btn.addEventListener("click", function () {
      var d = distribution();
      var u = rng(), cum = 0, pick = 0;
      for (var i = 0; i < CAND.length; i++) { cum += d.fin[i]; if (u <= cum) { pick = i; break; } }
      var chip = document.createElement("span");
      chip.className = "tok-chip tok-c0";
      chip.textContent = CAND[pick][0];
      outStream.appendChild(chip);
      if (outStream.children.length > 14) outStream.removeChild(outStream.firstChild);
      if (typeof gsap !== "undefined") gsap.from(chip, { y: -10, opacity: 0, duration: 0.3, ease: "power2.out" });
    });

    [tCtl, pCtl, kCtl].forEach(function (el) { el.addEventListener("input", render); });
    render();
  })();

  /* ============================================================
     08 — SPECULATIVE DECODING  (#spec-demo)
     ============================================================ */
  (function speculative() {
    var root = $("spec-demo");
    if (!root) return;
    var TARGET = ("speculative decoding lets a small draft model propose tokens " +
      "and the large model verify them in a single parallel pass").split(" ");
    // per-position acceptance probability (drafter struggles on rare words)
    var HARD = { 0: 0.6, 4: 0.55, 7: 0.6, 12: 0.5, 16: 0.55 };
    var out = $("spec-out"), btn = $("spec-play");
    var rDraft = $("spec-drafted"), rAcc = $("spec-accepted"), rRate = $("spec-rate"), rSpd = $("spec-speed");
    var running = false, timer = null, rng = mulberry32(7);

    function chip(word, cls) {
      var el = document.createElement("span");
      el.className = "tok-chip " + cls;
      el.textContent = word;
      out.appendChild(el);
      return el;
    }

    function reset() {
      out.innerHTML = "";
      rDraft.textContent = "0"; rAcc.textContent = "0"; rRate.textContent = "—"; rSpd.textContent = "—";
    }

    function run() {
      if (running) return;
      running = true; reset();
      btn.textContent = "RUNNING…";
      var pos = 0, drafted = 0, accepted = 0, steps = 0;
      var K = 4; // draft length

      function step() {
        if (pos >= TARGET.length) {
          running = false;
          btn.textContent = "REPLAY";
          return;
        }
        steps++;
        var chunk = [];
        var kEnd = Math.min(pos + K, TARGET.length);
        for (var i = pos; i < kEnd; i++) {
          chunk.push(chip(TARGET[i], "tok-c2")); // gray = drafted
          drafted++;
        }
        rDraft.textContent = drafted;

        // verify sequentially after a beat
        var vi = 0;
        function verify() {
          if (vi >= chunk.length) {
            rRate.textContent = ((accepted / drafted) * 100).toFixed(0) + "%";
            rSpd.textContent = (pos / steps).toFixed(2) + " tok/step";
            timer = setTimeout(step, 420);
            return;
          }
          var pAcc = HARD[pos] !== undefined ? HARD[pos] : 0.92;
          var ok = rng() < pAcc;
          var el = chunk[vi];
          if (ok) {
            el.className = "tok-chip tok-c0"; // mint = accepted
            accepted++; pos++;
            rAcc.textContent = accepted;
            vi++;
            timer = setTimeout(verify, 130);
          } else {
            el.className = "tok-chip";
            el.style.cssText = "background:rgba(255,65,54,.15);border:1px solid rgba(255,65,54,.5);color:#ff4136;";
            // discard the rest of the chunk
            for (var d = vi + 1; d < chunk.length; d++) { drafted = drafted; out.removeChild(chunk[d]); }
            timer = setTimeout(function () {
              out.removeChild(el);
              // target model emits the corrected token itself
              chip(TARGET[pos], "tok-c3");
              pos++;
              rRate.textContent = ((accepted / drafted) * 100).toFixed(0) + "%";
              rSpd.textContent = (pos / steps).toFixed(2) + " tok/step";
              timer = setTimeout(step, 420);
            }, 380);
            vi = chunk.length + 1; // exit verify loop
          }
        }
        timer = setTimeout(verify, 320);
      }
      step();
    }
    btn.addEventListener("click", run);
  })();

  /* ============================================================
     09 — MoE ROUTER  (#moe-demo)
     ============================================================ */
  (function moe() {
    var root = $("moe-demo");
    if (!root) return;
    var TOKENS = ["The", "enzyme", "catalyzes", "matrix", "multiplication", "while",
      "the", "violin", "plays", "in", "Python", "syntax", "under", "quantum", "moonlight"];
    var NE = 8;
    var expertsEl = $("moe-experts"), tokEl = $("moe-token"), gatesEl = $("moe-gates"), btn = $("moe-play");
    var loads = new Array(NE).fill(0);
    var idx = 0, timer = null, playing = false;

    function hash(s) {
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    }

    // build expert boxes
    var boxes = [];
    for (var e = 0; e < NE; e++) {
      var box = document.createElement("div");
      box.style.cssText = "border:1px solid #2f3234;border-radius:4px;padding:10px 8px;text-align:center;transition:border-color .2s,background .2s;";
      box.innerHTML = "<div style='font-family:ui-monospace,Menlo,monospace;font-size:9px;letter-spacing:.16em;color:#636363;margin-bottom:8px;'>E" + e +
        "</div><div class='moe-load' style='height:48px;display:flex;align-items:flex-end;justify-content:center;'>" +
        "<div style='width:14px;background:#2b5945;height:0%;transition:height .3s ease-in-out;'></div></div>" +
        "<div class='moe-count' style='font-family:ui-monospace,Menlo,monospace;font-size:10px;color:#9b9b9b;margin-top:8px;'>0</div>";
      expertsEl.appendChild(box);
      boxes.push(box);
    }

    function stepTok() {
      var t = TOKENS[idx % TOKENS.length];
      idx++;
      tokEl.textContent = "“" + t + "”";
      var rng = mulberry32(hash(t));
      var logits = [];
      for (var e = 0; e < NE; e++) logits.push(rng() * 4 - 2);
      var p = softmax(logits, 0.7);
      var order = p.map(function (v, i) { return i; }).sort(function (a, b) { return p[b] - p[a]; });
      var top = {}; top[order[0]] = true; top[order[1]] = true;

      gatesEl.innerHTML = "";
      for (var e = 0; e < NE; e++) {
        var g = document.createElement("div");
        var on = !!top[e];
        g.style.cssText = "flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;";
        g.innerHTML = "<div style='width:100%;height:40px;display:flex;align-items:flex-end;'><div style='width:100%;height:" +
          (p[e] * 100).toFixed(0) + "%;background:" + (on ? "#a6f2cc" : "rgba(155,155,155,.3)") + ";transition:height .25s;'></div></div>" +
          "<span style='font-family:ui-monospace,Menlo,monospace;font-size:9px;color:" + (on ? "#a6f2cc" : "#636363") + ";'>" + (p[e] * 100).toFixed(0) + "</span>";
        gatesEl.appendChild(g);
      }

      var maxLoad = 1;
      for (var e = 0; e < NE; e++) {
        if (top[e]) loads[e]++;
        maxLoad = Math.max(maxLoad, loads[e]);
      }
      boxes.forEach(function (box, e) {
        var on = !!top[e];
        box.style.borderColor = on ? "#a6f2cc" : "#2f3234";
        box.style.background = on ? "rgba(166,242,204,0.06)" : "transparent";
        box.querySelector(".moe-load > div").style.height = (loads[e] / maxLoad * 100).toFixed(0) + "%";
        box.querySelector(".moe-count").textContent = loads[e];
      });
    }

    btn.addEventListener("click", function () {
      playing = !playing;
      btn.textContent = playing ? "PAUSE" : "ROUTE TOKENS";
      if (playing) { stepTok(); timer = setInterval(stepTok, 1000); }
      else clearInterval(timer);
    });
  })();

  /* ============================================================
     01 — PERPLEXITY DIAL  (#ppl-demo)
     ============================================================ */
  (function ppl() {
    var root = $("ppl-demo");
    if (!root) return;
    var ctl = $("ppl-loss"), out = $("ppl-loss-out"), rP = $("ppl-val"), rB = $("ppl-bits"), rNote = $("ppl-note");
    var MARKS = [
      [11.8, "uniform guessing over a 128K vocabulary"],
      [4.5, "small character-level RNN, 2015"],
      [3.0, "GPT-2 on held-out web text"],
      [2.0, "strong 2023-era 70B model"],
      [1.7, "frontier models — approaching text's entropy floor"]
    ];
    function render() {
      var L = parseFloat(ctl.value);
      out.textContent = L.toFixed(2) + " nats";
      rP.textContent = Math.exp(L) < 1000 ? Math.exp(L).toFixed(1) : Math.round(Math.exp(L)).toLocaleString();
      rB.textContent = (L * 1.4427).toFixed(2) + " bits";
      var best = MARKS[0];
      for (var i = 0; i < MARKS.length; i++) if (L <= MARKS[i][0] + 0.45) best = MARKS[i];
      rNote.textContent = "≈ " + best[1];
    }
    ctl.addEventListener("input", render);
    render();
  })();

  /* ============================================================
     02 — RoPE DIALS  (#rope-demo)
     8 frequency bands as rotating dials; position slider.
     ============================================================ */
  (function rope() {
    var root = $("rope-demo");
    if (!root) return;
    var canvas = $("rope-canvas"), mCtl = $("rope-m"), mOut = $("rope-m-out");
    var baseBtns = root.querySelectorAll("[data-rope-base]");
    var base = 10000;

    function render() {
      var m = Math.round(Math.pow(2, parseFloat(mCtl.value))) - 1;
      mOut.textContent = "m = " + m.toLocaleString();
      var K = 8;
      var sc = setupCanvas(canvas, 190);
      var ctx = sc.ctx;
      ctx.clearRect(0, 0, sc.w, 190);
      var cell = sc.w / K, R = Math.min(cell * 0.32, 52);
      for (var k = 0; k < K; k++) {
        var freq = Math.pow(base, -k / (K - 1));   // θ_i spectrum
        var ang = (m * freq) % (Math.PI * 2);
        var cx = cell * k + cell / 2, cy = 78;
        ctx.strokeStyle = HAIR; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        // trail
        ctx.strokeStyle = "rgba(166,242,204,0.25)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, ang - Math.PI / 2, false); ctx.stroke();
        // needle
        ctx.strokeStyle = MINT; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(ang - Math.PI / 2), cy + R * Math.sin(ang - Math.PI / 2));
        ctx.stroke();
        ctx.fillStyle = MINT;
        ctx.beginPath(); ctx.arc(cx + R * Math.cos(ang - Math.PI / 2), cy + R * Math.sin(ang - Math.PI / 2), 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = MONO; ctx.fillStyle = MUT; ctx.textAlign = "center";
        ctx.fillText("pair " + k, cx, 160);
        ctx.fillStyle = SEC;
        ctx.fillText("θ=" + freq.toExponential(1), cx, 175);
      }
    }
    mCtl.addEventListener("input", render);
    baseBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        base = parseInt(b.getAttribute("data-rope-base"), 10);
        baseBtns.forEach(function (x) { x.classList.toggle("on", x === b); });
        render();
      });
    });
    window.addEventListener("resize", render);
    render();
  })();

  /* ============================================================
     02 — PARAMETER BUDGET  (#param-demo)
     ============================================================ */
  (function params() {
    var root = $("param-demo");
    if (!root) return;
    var LCtl = $("param-l"), dCtl = $("param-d"), vCtl = $("param-v");
    var LOut = $("param-l-out"), dOut = $("param-d-out");
    var rTot = $("param-total"), rBar = $("param-bars");

    function render() {
      var L = +LCtl.value, d = Math.pow(2, +dCtl.value), V = +vCtl.value;
      LOut.textContent = L; dOut.textContent = d.toLocaleString();
      var attn = 4 * L * d * d, mlp = 8 * L * d * d, emb = 2 * V * d;
      var tot = attn + mlp + emb;
      rTot.textContent = siFormat(tot, 1);
      var parts = [
        ["MLP", mlp, "rgba(166,242,204,0.85)"],
        ["ATTENTION", attn, "rgba(43,89,69,0.9)"],
        ["EMBED + UNEMBED", emb, "rgba(78,138,247,0.6)"]
      ];
      rBar.innerHTML = "";
      parts.forEach(function (p) {
        var pct = p[1] / tot * 100;
        var row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:8px;";
        row.innerHTML =
          "<span style='font-family:ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.12em;color:#9b9b9b;width:130px;flex:none;'>" + p[0] + "</span>" +
          "<div style='flex:1;height:14px;background:rgba(47,50,52,.35);border-radius:2px;overflow:hidden;'><div style='height:100%;width:" + pct + "%;background:" + p[2] + ";transition:width .25s;'></div></div>" +
          "<span style='font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#a6f2cc;width:110px;flex:none;text-align:right;'>" + siFormat(p[1], 1) + " · " + pct.toFixed(0) + "%</span>";
        rBar.appendChild(row);
      });
    }
    [LCtl, dCtl, vCtl].forEach(function (el) { el.addEventListener("input", render); });
    render();
  })();

  /* ============================================================
     03 — GQA HEAD-SHARING  (#gqa-demo)
     ============================================================ */
  (function gqa() {
    var root = $("gqa-demo");
    if (!root) return;
    var ctl = $("gqa-kv"), out = $("gqa-kv-out");
    var qRow = $("gqa-q"), kRow = $("gqa-k");
    var rMode = $("gqa-mode"), rRed = $("gqa-reduction"), rGb = $("gqa-gb");
    var H = 32;
    var KV_OPTS = [32, 16, 8, 4, 2, 1];

    function render() {
      var kv = KV_OPTS[+ctl.value];
      out.textContent = kv;
      var group = H / kv;
      qRow.innerHTML = ""; kRow.innerHTML = "";
      for (var i = 0; i < H; i++) {
        var g = Math.floor(i / group);
        var q = document.createElement("div");
        var hue = g % 2 === 0 ? "rgba(166,242,204," : "rgba(78,138,247,";
        q.style.cssText = "flex:1;height:22px;border-radius:2px;background:" + hue + (0.25 + 0.5 * ((g % 4) / 4)) + ");";
        q.title = "Q head " + i + " → KV " + g;
        qRow.appendChild(q);
      }
      for (var k = 0; k < kv; k++) {
        var hue2 = k % 2 === 0 ? "rgba(166,242,204," : "rgba(78,138,247,";
        var kd = document.createElement("div");
        kd.style.cssText = "flex:1;height:22px;border-radius:2px;border:1px solid #565656;background:" + hue2 + (0.25 + 0.5 * ((k % 4) / 4)) + ");";
        kRow.appendChild(kd);
      }
      rMode.textContent = kv === H ? "MHA" : kv === 1 ? "MQA" : "GQA-" + kv;
      rRed.textContent = (H / kv) + "×";
      // 70B-ish: 80 layers, kv heads × 128 dim, 8K ctx, fp16
      var gb = 2 * 80 * kv * 128 * 8192 * 2 / 1e9;
      rGb.textContent = gb.toFixed(1) + " GB";
    }
    ctl.addEventListener("input", render);
    render();
  })();

  /* ============================================================
     04 — LR SCHEDULE  (#lr-demo)
     ============================================================ */
  (function lrsched() {
    var root = $("lr-demo");
    if (!root) return;
    var wCtl = $("lr-warm"), mCtl = $("lr-min"), canvas = $("lr-canvas");
    var wOut = $("lr-warm-out"), mOut = $("lr-min-out");
    var btns = root.querySelectorAll("[data-lr-mode]");
    var mode = "cosine";

    function lr(t, warm, minF) { // t in [0,1]
      if (t < warm) return t / warm;
      var u = (t - warm) / (1 - warm);
      if (mode === "cosine") return minF + 0.5 * (1 - minF) * (1 + Math.cos(Math.PI * u));
      if (mode === "wsd") return u < 0.8 ? 1 : (1 - (u - 0.8) / 0.2 * (1 - minF));
      return 1 - (1 - minF) * u; // linear
    }

    function render() {
      var warm = +wCtl.value / 100, minF = +mCtl.value / 100;
      wOut.textContent = (warm * 100).toFixed(0) + "%";
      mOut.textContent = (minF * 100).toFixed(0) + "%";
      var sc = setupCanvas(canvas, 220);
      var ctx = sc.ctx, padL = 40, padB = 28, W = sc.w - padL - 16, Hh = 220 - padB - 14;
      ctx.clearRect(0, 0, sc.w, 220);
      ctx.strokeStyle = HAIR;
      ctx.strokeRect(padL, 14, W, Hh);
      ctx.font = MONO; ctx.fillStyle = MUT;
      ctx.textAlign = "center"; ctx.fillText("TRAINING PROGRESS →", padL + W / 2, 212);
      ctx.save(); ctx.translate(12, 14 + Hh / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center";
      ctx.fillText("η / η_max", 0, 0); ctx.restore();
      ctx.strokeStyle = MINT; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var i = 0; i <= 300; i++) {
        var t = i / 300, y = lr(t, Math.max(warm, 0.001), minF);
        var px = padL + t * W, py = 14 + (1 - y) * Hh;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // warmup marker
      ctx.strokeStyle = "rgba(78,138,247,0.5)"; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(padL + warm * W, 14); ctx.lineTo(padL + warm * W, 14 + Hh); ctx.stroke();
      ctx.setLineDash([]);
    }
    [wCtl, mCtl].forEach(function (el) { el.addEventListener("input", render); });
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-lr-mode");
        btns.forEach(function (x) { x.classList.toggle("on", x === b); });
        render();
      });
    });
    window.addEventListener("resize", render);
    render();
  })();

  /* ============================================================
     04 — THE BILL  (#bill-demo)   EQ 4.5 live
     ============================================================ */
  (function bill() {
    var root = $("bill-demo");
    if (!root) return;
    var nCtl = $("bill-n"), dCtl = $("bill-d"), gCtl = $("bill-g"), uCtl = $("bill-mfu"), cCtl = $("bill-usd");
    var outs = { n: $("bill-n-out"), d: $("bill-d-out"), g: $("bill-g-out"), u: $("bill-mfu-out"), c: $("bill-usd-out") };
    var rC = $("bill-flops"), rDays = $("bill-days"), rCost = $("bill-cost");

    function render() {
      var N = Math.pow(10, +nCtl.value), D = Math.pow(10, +dCtl.value);
      var G = Math.pow(2, +gCtl.value), mfu = +uCtl.value / 100, usd = +cCtl.value;
      outs.n.textContent = siFormat(N, 0); outs.d.textContent = siFormat(D, 1);
      outs.g.textContent = G.toLocaleString(); outs.u.textContent = (mfu * 100).toFixed(0) + "%";
      outs.c.textContent = "$" + usd.toFixed(2) + "/hr";
      var C = 6 * N * D;
      var secs = C / (G * 989e12 * mfu);          // H100 BF16 dense peak
      var days = secs / 86400;
      var cost = G * (secs / 3600) * usd;
      rC.textContent = C.toExponential(2);
      rDays.textContent = days < 1 ? (days * 24).toFixed(1) + " hrs" : days.toFixed(0) + " days";
      rCost.textContent = cost >= 1e9 ? "$" + (cost / 1e9).toFixed(2) + "B" : cost >= 1e6 ? "$" + (cost / 1e6).toFixed(1) + "M" : "$" + (cost / 1e3).toFixed(0) + "K";
    }
    [nCtl, dCtl, gCtl, uCtl, cCtl].forEach(function (el) { el.addEventListener("input", render); });
    render();
  })();

  /* ============================================================
     05 — BRADLEY–TERRY MARGIN  (#bt-demo)
     ============================================================ */
  (function bt() {
    var root = $("bt-demo");
    if (!root) return;
    var ctl = $("bt-delta"), out = $("bt-delta-out"), canvas = $("bt-canvas"), rP = $("bt-p");

    function render() {
      var d = parseFloat(ctl.value);
      out.textContent = d.toFixed(1);
      var p = 1 / (1 + Math.exp(-d));
      rP.textContent = (p * 100).toFixed(1) + "%";
      var sc = setupCanvas(canvas, 200);
      var ctx = sc.ctx, padL = 40, W = sc.w - padL - 16, Hh = 150, top = 14;
      ctx.clearRect(0, 0, sc.w, 200);
      ctx.strokeStyle = HAIR; ctx.strokeRect(padL, top, W, Hh);
      ctx.font = MONO; ctx.fillStyle = MUT; ctx.textAlign = "center";
      ctx.fillText("REWARD MARGIN  r(y_w) − r(y_l)", padL + W / 2, 192);
      function X(v) { return padL + (v + 6) / 12 * W; }
      function Y(p2) { return top + (1 - p2) * Hh; }
      ctx.strokeStyle = "rgba(155,155,155,0.35)"; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(0), top); ctx.lineTo(X(0), top + Hh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, Y(0.5)); ctx.lineTo(padL + W, Y(0.5)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = MINT; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var i = 0; i <= 240; i++) {
        var v = -6 + 12 * i / 240, pp = 1 / (1 + Math.exp(-v));
        if (i === 0) ctx.moveTo(X(v), Y(pp)); else ctx.lineTo(X(v), Y(pp));
      }
      ctx.stroke();
      ctx.fillStyle = MINT;
      ctx.beginPath(); ctx.arc(X(d), Y(p), 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = SEC; ctx.textAlign = "left";
      ctx.fillText("σ(Δ) = " + p.toFixed(3), Math.min(X(d) + 10, sc.w - 110), Y(p) - 8);
    }
    ctl.addEventListener("input", render);
    window.addEventListener("resize", render);
    render();
  })();

  /* ============================================================
     05 — GRPO GROUP ADVANTAGE  (#grpo-demo)
     ============================================================ */
  (function grpo() {
    var root = $("grpo-demo");
    if (!root) return;
    var btn = $("grpo-roll"), wrap = $("grpo-bars"), rMean = $("grpo-mean"), rStd = $("grpo-std"), rNote = $("grpo-note");
    var seed = 11, G = 8;

    function roll() {
      seed += 7;
      var rng = mulberry32(seed);
      var pSolve = 0.25 + rng() * 0.55;            // problem difficulty varies
      var rewards = [];
      for (var i = 0; i < G; i++) rewards.push(rng() < pSolve ? 1 : 0);
      var mean = rewards.reduce(function (a, b) { return a + b; }, 0) / G;
      var sd = Math.sqrt(rewards.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / G) || 0;
      rMean.textContent = mean.toFixed(2);
      rStd.textContent = sd.toFixed(2);
      wrap.innerHTML = "";
      rewards.forEach(function (r, i) {
        var adv = sd > 0 ? (r - mean) / sd : 0;
        var col = document.createElement("div");
        col.style.cssText = "flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;";
        var h = Math.min(46, Math.abs(adv) * 30);
        col.innerHTML =
          "<div style='height:100px;display:flex;flex-direction:column;justify-content:center;align-items:center;width:100%;'>" +
            "<div style='width:60%;max-width:34px;height:" + (adv > 0 ? h : 0) + "px;background:#a6f2cc;'></div>" +
            "<div style='width:100%;height:1px;background:#2f3234;'></div>" +
            "<div style='width:60%;max-width:34px;height:" + (adv < 0 ? h : 0) + "px;background:rgba(255,65,54,.8);'></div>" +
          "</div>" +
          "<span style='font-family:ui-monospace,Menlo,monospace;font-size:10px;color:" + (r ? "#a6f2cc" : "#636363") + ";'>r=" + r + "</span>" +
          "<span style='font-family:ui-monospace,Menlo,monospace;font-size:9px;color:#9b9b9b;'>Â=" + (sd > 0 ? adv.toFixed(2) : "0") + "</span>";
        wrap.appendChild(col);
      });
      rNote.textContent = sd === 0
        ? "Degenerate group — all " + (mean === 1 ? "solved" : "failed") + ": zero advantage everywhere, zero gradient. GRPO learns nothing from problems that are too easy or too hard."
        : "Above-average samples (mint) have every token reinforced; below-average (red) suppressed.";
    }
    btn.addEventListener("click", roll);
    roll();
  })();

  /* ============================================================
     06 — FINE-TUNING VRAM  (#vram-demo)
     ============================================================ */
  (function vram() {
    var root = $("vram-demo");
    if (!root) return;
    var nCtl = $("vram-n"), nOut = $("vram-n-out"), wrap = $("vram-bars");
    var btns = root.querySelectorAll("[data-vram-mode]");
    var mode = "qlora";
    var GPUS = [["RTX 4090", 24], ["A100 / L40S", 48], ["H100 / A100-80", 80], ["2× H100", 160]];

    function estimate(Nb) { // Nb in billions → GB
      if (mode === "full")  return 16 * Nb + 4;       // bf16 weights+grad+Adam fp32 + activations
      if (mode === "lora")  return 2 * Nb + 2 + 0.04 * Nb; // frozen bf16 + adapters/opt + activations
      return 0.6 * Nb + 2 + 0.04 * Nb;                // NF4 base + adapters + activations
    }

    function render() {
      var Nb = Math.round(Math.pow(2, +nCtl.value));
      nOut.textContent = Nb + "B params";
      var gb = estimate(Nb);
      wrap.innerHTML = "";
      var maxScale = 320;
      var bar = document.createElement("div");
      bar.style.cssText = "position:relative;height:48px;background:rgba(47,50,52,.3);border-radius:4px;overflow:hidden;margin-bottom:10px;";
      var fillPct = Math.min(100, gb / maxScale * 100);
      bar.innerHTML = "<div style='position:absolute;inset:0;width:" + fillPct + "%;background:" + (gb > 160 ? "rgba(255,65,54,.55)" : "rgba(166,242,204,.5)") + ";transition:width .25s;'></div>" +
        "<span style='position:absolute;left:12px;top:14px;font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#fff;'>≈ " + gb.toFixed(0) + " GB</span>";
      GPUS.forEach(function (g) {
        var x = g[1] / maxScale * 100;
        bar.innerHTML += "<div style='position:absolute;left:" + x + "%;top:0;bottom:0;width:1px;background:#565656;'></div>" +
          "<span style='position:absolute;left:calc(" + x + "% + 4px);bottom:2px;font-family:ui-monospace,Menlo,monospace;font-size:8.5px;color:#9b9b9b;'>" + g[0] + "</span>";
      });
      wrap.appendChild(bar);
      var fits = GPUS.filter(function (g) { return gb <= g[1]; });
      var note = document.createElement("div");
      note.style.cssText = "font-family:ui-monospace,Menlo,monospace;font-size:11px;color:" + (fits.length ? "#a6f2cc" : "#ff4136") + ";";
      note.textContent = fits.length ? "FITS ON: " + fits.map(function (g) { return g[0]; }).join(" · ") : "DOES NOT FIT single-node consumer/datacenter cards — shard or shrink.";
      wrap.appendChild(note);
    }
    nCtl.addEventListener("input", render);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-vram-mode");
        btns.forEach(function (x) { x.classList.toggle("on", x === b); });
        render();
      });
    });
    render();
  })();

  /* ============================================================
     07 — DARK KNOWLEDGE  (#distill-demo)
     ============================================================ */
  (function distill() {
    var root = $("distill-demo");
    if (!root) return;
    var CLASSES = [["cat", 9.2], ["kitten", 7.4], ["lynx", 5.1], ["dog", 3.8], ["fox", 3.2], ["loaf of bread", 1.9], ["car", -1.5], ["carburetor", -3.0]];
    var ctl = $("distill-t"), out = $("distill-t-out"), wrap = $("distill-bars"), rH = $("distill-h");

    function render() {
      var T = parseFloat(ctl.value);
      out.textContent = "τ = " + T.toFixed(1);
      var p = softmax(CLASSES.map(function (c) { return c[1]; }), T);
      wrap.innerHTML = "";
      var H = 0;
      CLASSES.forEach(function (c, i) {
        if (p[i] > 0) H -= p[i] * Math.log2(p[i]);
        var row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:6px;";
        row.innerHTML =
          "<span style='font-family:ui-monospace,Menlo,monospace;font-size:11.5px;width:104px;text-align:right;flex:none;color:#e5e5e5;'>" + c[0] + "</span>" +
          "<div style='flex:1;height:13px;background:rgba(47,50,52,.4);border-radius:2px;overflow:hidden;'><div style='height:100%;width:" + (p[i] * 100) + "%;background:rgba(166,242,204,.8);transition:width .2s;'></div></div>" +
          "<span style='font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:#9b9b9b;width:56px;flex:none;'>" + (p[i] * 100).toFixed(p[i] < 0.01 ? 2 : 1) + "%</span>";
        wrap.appendChild(row);
      });
      rH.textContent = H.toFixed(2) + " bits";
    }
    ctl.addEventListener("input", render);
    render();
  })();

  /* ============================================================
     08 — DECODE ROOFLINE  (#roofline-demo)
     ============================================================ */
  (function roofline() {
    var root = $("roofline-demo");
    if (!root) return;
    var ctl = $("roof-b"), out = $("roof-b-out"), canvas = $("roof-canvas");
    var rReg = $("roof-regime"), rAgg = $("roof-agg"), rTpot = $("roof-tpot");
    var BW = 3.35e12, PEAK = 989e12, NPARAMS = 70e9, BYTES = 2; // 70B bf16 on H100

    function render() {
      var b = Math.pow(2, +ctl.value);
      out.textContent = "batch = " + b;
      var I = b / BYTES * 2;                        // ≈ 2b FLOPs per 2 bytes → I ≈ b
      var attain = Math.min(PEAK, BW * I);
      var flopsPerTok = 2 * NPARAMS;
      var aggTok = attain / flopsPerTok;
      var perStream = aggTok / b;
      rReg.textContent = attain >= PEAK ? "COMPUTE-BOUND" : "BANDWIDTH-BOUND";
      rReg.style.color = attain >= PEAK ? "#4e8af7" : "#a6f2cc";
      rAgg.textContent = siFormat(aggTok, 0) + " tok/s";
      rTpot.textContent = (1000 / perStream).toFixed(1) + " ms";

      var sc = setupCanvas(canvas, 240);
      var ctx = sc.ctx, padL = 52, padB = 30, W = sc.w - padL - 16, Hh = 240 - padB - 16;
      ctx.clearRect(0, 0, sc.w, 240);
      // log-log: x = I in [0.5, 2048], y = TFLOP/s in [1, 2000]
      function X(i) { return padL + (Math.log2(i) - Math.log2(0.5)) / (Math.log2(2048) - Math.log2(0.5)) * W; }
      function Y(f) { return 16 + (1 - (Math.log10(f) - 0) / (Math.log10(2000) - 0)) * Hh; }
      ctx.strokeStyle = HAIR; ctx.strokeRect(padL, 16, W, Hh);
      ctx.font = MONO; ctx.fillStyle = MUT; ctx.textAlign = "center";
      ctx.fillText("ARITHMETIC INTENSITY (FLOPs / BYTE, log)", padL + W / 2, 234);
      ctx.save(); ctx.translate(14, 16 + Hh / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.fillText("TFLOP/s (log)", 0, 0); ctx.restore();
      // roofline
      ctx.strokeStyle = SEC; ctx.lineWidth = 1.5; ctx.beginPath();
      var first = true;
      for (var e = -1; e <= 11; e += 0.1) {
        var i = Math.pow(2, e), f = Math.min(PEAK, BW * i) / 1e12;
        if (first) { ctx.moveTo(X(i), Y(f)); first = false; } else ctx.lineTo(X(i), Y(f));
      }
      ctx.stroke();
      var crit = PEAK / BW;
      ctx.strokeStyle = "rgba(155,155,155,0.3)"; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(crit), 16); ctx.lineTo(X(crit), 16 + Hh); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = MUT; ctx.textAlign = "left";
      ctx.fillText("I* = " + crit.toFixed(0), X(crit) + 6, 30);
      // operating point
      var fNow = Math.min(PEAK, BW * I) / 1e12;
      ctx.fillStyle = MINT;
      ctx.beginPath(); ctx.arc(X(I), Y(fNow), 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText("you", X(I) + 8, Y(fNow) - 6);
    }
    ctl.addEventListener("input", render);
    window.addEventListener("resize", render);
    render();
  })();

  /* ============================================================
     09 — CONTEXT COST  (#ctx-demo)
     ============================================================ */
  (function ctxcost() {
    var root = $("ctx-demo");
    if (!root) return;
    var ctl = $("ctx-t"), out = $("ctx-t-out");
    var rKv = $("ctx-kv"), rAttn = $("ctx-attn"), rShare = $("ctx-share");
    // Llama-3-70B-ish: 80 layers, 8 KV heads × 128, d=8192, N=70B, fp16 KV
    var L = 80, KVH = 8, DK = 128, D = 8192, N = 70e9;

    function render() {
      var T = Math.pow(2, +ctl.value);
      out.textContent = T >= 1048576 ? "1M" : T >= 1024 ? (T / 1024) + "K" : T;
      var kvGB = 2 * L * KVH * DK * T * 2 / 1e9;
      var linFlops = 2 * N * T;                  // weight matmuls
      var attnFlops = 4 * L * D * T * T;          // QK^T + AV (causal ≈ half, keep order-of-magnitude)
      var share = attnFlops / (attnFlops + linFlops) * 100;
      rKv.textContent = kvGB >= 1 ? kvGB.toFixed(1) + " GB" : (kvGB * 1000).toFixed(0) + " MB";
      rAttn.textContent = ((attnFlops + linFlops) / 1e15).toFixed(1) + " PFLOPs";
      rShare.textContent = share.toFixed(0) + "%";
      rShare.style.color = share > 50 ? "#ff4136" : "#a6f2cc";
    }
    ctl.addEventListener("input", render);
    render();
  })();

  /* ============================================================
     10 — DIFFUSION SANDBOX  (#diff-demo)
     Analytic-score reverse diffusion on a 2-D Gaussian-mixture
     ring — real denoising, no neural net required.
     ============================================================ */
  (function diffusion() {
    var root = $("diff-demo");
    if (!root) return;
    var canvas = $("diff-canvas"), tCtl = $("diff-t"), tOut = $("diff-t-out");
    var btn = $("diff-sample"), stepOut = $("diff-step");
    var NPTS = 520, SIG_D = 0.16;
    var MEANS = [];
    for (var k = 0; k < 6; k++) {
      var a = k / 6 * Math.PI * 2;
      MEANS.push([Math.cos(a) * 1.05, Math.sin(a) * 1.05]);
    }
    var rng = mulberry32(99);
    function gauss() {
      var u1 = Math.max(rng(), 1e-9), u2 = rng();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    // clean data sample
    var data = [];
    for (var i = 0; i < NPTS; i++) {
      var mu = MEANS[i % 6];
      data.push([mu[0] + gauss() * SIG_D, mu[1] + gauss() * SIG_D]);
    }
    var noise = data.map(function () { return [gauss(), gauss()]; });

    var pts = null, animating = false, raf = null;

    function score(x, y, sig2) { // ∇ log p for GMM with isotropic σ_d²+σ² components
      var s = SIG_D * SIG_D + sig2;
      var wsum = 0, gx = 0, gy = 0, resp = [];
      for (var k2 = 0; k2 < 6; k2++) {
        var dx = x - MEANS[k2][0], dy = y - MEANS[k2][1];
        var w = Math.exp(-(dx * dx + dy * dy) / (2 * s));
        resp.push(w); wsum += w;
      }
      if (wsum < 1e-12) wsum = 1e-12;
      for (var k3 = 0; k3 < 6; k3++) {
        var r = resp[k3] / wsum;
        gx += r * (MEANS[k3][0] - x) / s;
        gy += r * (MEANS[k3][1] - y) / s;
      }
      return [gx, gy];
    }

    function draw(cloud, label) {
      var sc = setupCanvas(canvas, 340);
      var ctx = sc.ctx, cx = sc.w / 2, cy = 170, R = 78;
      ctx.clearRect(0, 0, sc.w, 340);
      ctx.strokeStyle = "rgba(47,50,52,0.6)";
      ctx.strokeRect(cx - 2.2 * R, cy - 2 * R + 10, 4.4 * R, 4 * R - 20);
      ctx.fillStyle = MINT;
      cloud.forEach(function (p) {
        var a = 0.75;
        ctx.globalAlpha = a;
        ctx.fillRect(cx + p[0] * R - 1.2, cy + p[1] * R - 1.2, 2.4, 2.4);
      });
      ctx.globalAlpha = 1;
      ctx.font = MONO; ctx.fillStyle = MUT; ctx.textAlign = "left";
      ctx.fillText(label, 16, 326);
    }

    function renderForward() {
      if (animating) return;
      var t = parseFloat(tCtl.value);
      tOut.textContent = "t = " + t.toFixed(2);
      var ab = Math.pow(1 - t, 2);                   // ᾱ(t): 1 → 0
      var cloud = data.map(function (p, i2) {
        return [Math.sqrt(ab) * p[0] + Math.sqrt(1 - ab) * noise[i2][0],
                Math.sqrt(ab) * p[1] + Math.sqrt(1 - ab) * noise[i2][1]];
      });
      draw(cloud, t < 0.02 ? "q(x₀) — DATA" : t > 0.98 ? "q(x_T) ≈ N(0, I) — PURE NOISE" : "q(x_t | x₀) — FORWARD NOISING");
      stepOut.textContent = "—";
    }

    function sample() {
      if (animating) return;
      animating = true;
      btn.textContent = "DENOISING…";
      var SIGMAS = [], NLEV = 60;
      for (var l = 0; l < NLEV; l++) SIGMAS.push(2.0 * Math.pow(0.025 / 2.0, l / (NLEV - 1)));
      pts = [];
      for (var i3 = 0; i3 < NPTS; i3++) pts.push([gauss() * 2.0, gauss() * 2.0]);
      var lev = 0;
      function step() {
        var sig = SIGMAS[lev], sig2 = sig * sig, eps = 0.22 * sig2;
        for (var it = 0; it < 3; it++) {
          pts.forEach(function (p) {
            var g = score(p[0], p[1], sig2);
            p[0] += eps * g[0] + Math.sqrt(2 * eps) * gauss() * 0.55;
            p[1] += eps * g[1] + Math.sqrt(2 * eps) * gauss() * 0.55;
          });
        }
        draw(pts, "REVERSE DIFFUSION — ANNEALED LANGEVIN ON THE TRUE SCORE");
        stepOut.textContent = "step " + (lev + 1) + "/" + NLEV + " · σ = " + sig.toFixed(3);
        lev++;
        /* setTimeout, not rAF: keeps running in throttled/background tabs */
        if (lev < NLEV) raf = setTimeout(step, 30);
        else { animating = false; btn.textContent = "SAMPLE FROM NOISE"; }
      }
      raf = setTimeout(step, 30);
    }

    tCtl.addEventListener("input", renderForward);
    btn.addEventListener("click", sample);
    window.addEventListener("resize", renderForward);
    renderForward();
  })();

  /* ============================================================
     10 — MASKED TEXT DIFFUSION  (#mask-demo)
     ============================================================ */
  (function maskdiff() {
    var root = $("mask-demo");
    if (!root) return;
    var WORDS = "a diffusion language model fills in every masked position in parallel refining the whole sequence over a few steps".split(" ");
    var n = WORDS.length;
    // fixed "confidence" order: structural words resolve first
    var ORDER = [0, 2, 3, 4, 13, 12, 1, 5, 9, 10, 11, 6, 7, 8, 14, 15, 16, 17, 18, 19].slice(0, n);
    var kCtl = $("mask-k"), kOut = $("mask-k-out"), btn = $("mask-play"), out = $("mask-out");
    var rNfe = $("mask-nfe");
    var timer = null;

    function build(maskedSet) {
      out.innerHTML = "";
      WORDS.forEach(function (w, i) {
        var chip = document.createElement("span");
        if (maskedSet[i]) {
          chip.className = "tok-chip tok-c2";
          chip.style.color = "#636363";
          chip.textContent = "▒▒▒";
        } else {
          chip.className = "tok-chip tok-c0";
          chip.textContent = w;
        }
        out.appendChild(chip);
      });
    }

    function play() {
      clearInterval(timer);
      var K = parseInt(kCtl.value, 10);
      var masked = {};
      for (var i = 0; i < n; i++) masked[i] = true;
      build(masked);
      rNfe.textContent = K + " vs " + n;
      var per = Math.ceil(n / K), idx = 0, stepN = 0;
      timer = setInterval(function () {
        for (var j = 0; j < per && idx < n; j++, idx++) masked[ORDER[idx % ORDER.length]] = false;
        stepN++;
        build(masked);
        if (idx >= n) { clearInterval(timer); btn.textContent = "REPLAY"; }
      }, 600);
      btn.textContent = "RUNNING…";
    }

    kCtl.addEventListener("input", function () { kOut.textContent = kCtl.value + " steps"; });
    btn.addEventListener("click", play);
    kOut.textContent = kCtl.value + " steps";
    var init = {}; for (var i4 = 0; i4 < n; i4++) init[i4] = true;
    build(init);
  })();

})();
