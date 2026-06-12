/* ============================================================
   AI ENCYCLOPEDIA — THE GYM engine v2
   Fully client-side drill arena. No backend, no accounts.
   Decks register on window.AIE_DECKS (decks/*.js — data format
   unchanged: mcq {opts, correct} · numeric {answer, tol, unit}
   · kata {starter, tests}).

   Views:  HOME (stats strip + deck cards)
         → DECK INTRO (breakdown, est. time, best, big START)
         → DRILL FLOW (progress bar, streak, skip, keyboard)
         → END SCREEN (score ring, share card, review mistakes)

   Persistence: localStorage "aie-gym" ONLY —
     { decks: { id: { best, completions, lastScore } }, bestStreak }
   Katas run on Pyodide + numpy, lazy-loaded on first RUN.
   ============================================================ */
(function () {
  "use strict";

  /* ------------------------ constants ------------------------ */
  var STORE_KEY = "aie-gym";
  var DECK_ORDER = ["ml", "llm", "prompting", "agents"];
  var PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
  var PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  var PASS_TOKEN = "ALL TESTS PASSED";
  var MONO = "ui-monospace, 'SF Mono', Menlo, 'Cascadia Mono', monospace";
  var SANS = "-apple-system, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  var EST_SEC = { mcq: 40, numeric: 75, kata: 300 };
  var TYPE_LABEL = { mcq: "CONCEPT", numeric: "NUMERIC", kata: "KATA" };

  /* ------------------------ dom handles ------------------------ */
  var homeEl = document.getElementById("gym-home");
  var statsEl = document.getElementById("gym-stats");
  var grid = document.getElementById("gym-decks");
  var introEl = document.getElementById("gym-intro");
  var runEl = document.getElementById("gym-run");
  var resEl = document.getElementById("gym-results");
  if (!homeEl || !grid || !introEl || !runEl || !resEl) return;

  var decks = window.AIE_DECKS || {};
  var run = null;          /* live run state */
  var lastResult = null;   /* kept for REVIEW MISTAKES re-runs */
  var timerId = null;
  var pyodidePromise = null;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------ storage ------------------------
     Shape: { decks: { id: { best, completions, lastScore } }, bestStreak }
     Migrates the v1 shape { id: { score, total, ms } } on read. */
  function loadStore() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch (e) { raw = {}; }
    if (raw && raw.decks) { raw.bestStreak = raw.bestStreak || 0; return raw; }
    var store = { decks: {}, bestStreak: 0 };
    Object.keys(raw || {}).forEach(function (k) {
      if (raw[k] && typeof raw[k].score === "number") {
        store.decks[k] = { best: raw[k].score, completions: 1, lastScore: raw[k].score };
      }
    });
    return store;
  }
  function saveStore(store) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* private mode */ }
  }

  /* ------------------------ helpers ------------------------ */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function fmtTime(ms) {
    var s = Math.max(0, Math.round(ms / 1000)), m = Math.floor(s / 60);
    s = s % 60;
    return m + "M" + (s < 10 ? "0" : "") + s + "S";
  }
  function fmtClock(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function mathify(el) {
    if (typeof renderMathInElement !== "function" || !el) return;
    renderMathInElement(el, {
      delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }],
      throwOnError: false
    });
  }
  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }
  function switchView(el) {
    [homeEl, introEl, runEl, resEl].forEach(function (v) { v === el ? show(v) : hide(v); });
    var y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
  }
  /* Entrance flourish: GSAP when available, inline-style setTimeout otherwise. */
  function fxIn(nodes, stagger) {
    nodes = (nodes || []).filter(Boolean);
    if (!nodes.length || reduced) return;
    if (typeof gsap !== "undefined") {
      gsap.from(nodes, { y: 16, opacity: 0, duration: 0.5, stagger: stagger || 0, ease: "power2.out", clearProps: "all" });
      return;
    }
    nodes.forEach(function (el, i) {
      el.style.transition = "none";
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      setTimeout(function () {
        el.style.transition = "opacity 0.5s cubic-bezier(0.19,1,0.22,1), transform 0.5s cubic-bezier(0.19,1,0.22,1)";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        setTimeout(function () { el.style.transition = ""; el.style.opacity = ""; el.style.transform = ""; }, 560);
      }, 30 + i * Math.round((stagger || 0) * 1000));
    });
  }
  function deckCounts(deck) {
    var c = { mcq: 0, numeric: 0, kata: 0 };
    deck.items.forEach(function (it) { c[it.type] += 1; });
    return c;
  }
  function deckEstMin(deck) {
    var s = 0;
    deck.items.forEach(function (it) { s += EST_SEC[it.type] || 60; });
    return Math.max(1, Math.round(s / 60));
  }
  function mixLine(deck) {
    var c = deckCounts(deck), parts = [];
    ["mcq", "numeric", "kata"].forEach(function (t) { if (c[t]) parts.push(c[t] + " " + TYPE_LABEL[t]); });
    return parts.join(" · ");
  }

  /* ======================== HOME ======================== */

  function renderHome() {
    var store = loadStore();
    var totalDrills = 0, cleared = 0, decksCleared = 0, deckCount = 0;
    DECK_ORDER.forEach(function (id) {
      var deck = decks[id];
      if (!deck) return;
      deckCount += 1;
      totalDrills += deck.items.length;
      var rec = store.decks[id];
      if (rec) {
        cleared += Math.min(rec.best, deck.items.length);
        if (rec.best >= deck.items.length) decksCleared += 1;
      }
    });

    if (statsEl) {
      statsEl.innerHTML =
        '<div class="gxv2-stat' + (cleared > 0 ? " acc" : "") + '"><div class="s-label">Drills cleared</div><div class="s-value">' + cleared + "<small> / " + totalDrills + "</small></div></div>" +
        '<div class="gxv2-stat' + (decksCleared > 0 ? " acc" : "") + '"><div class="s-label">Decks cleared</div><div class="s-value">' + decksCleared + "<small> / " + deckCount + "</small></div></div>" +
        '<div class="gxv2-stat' + (store.bestStreak > 0 ? " acc" : "") + '"><div class="s-label">Best streak</div><div class="s-value">' + store.bestStreak + "<small> in a row</small></div></div>";
    }

    grid.innerHTML = "";
    DECK_ORDER.forEach(function (id) {
      var deck = decks[id];
      if (!deck) return;
      var rec = store.decks[id];
      var full = rec && rec.best >= deck.items.length;
      var cta = !rec ? "START →" : (full ? "RUN IT BACK →" : "RESUME TRAINING →");
      var card = document.createElement("article");
      card.className = "deck-card gxv2-deck";
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      card.innerHTML =
        (full ? '<span class="gxv2-badge">✓ CLEARED</span>' : "") +
        '<div class="dk-vol">' + esc(deck.vol) + "</div>" +
        "<h3>" + esc(deck.title) + "</h3><p>" + esc(deck.desc) + "</p>" +
        '<div class="dk-meta">' + deck.items.length + " DRILLS · " + mixLine(deck) + "<br/>" +
        (rec
          ? '<span class="dk-best">BEST ' + rec.best + "/" + deck.items.length + "</span> · " + rec.completions + (rec.completions === 1 ? " RUN" : " RUNS")
          : "UNCLEARED") + "</div>" +
        '<div class="gxv2-cta"><span>≈ ' + deckEstMin(deck) + ' MIN</span><span class="go">' + cta + "</span></div>";
      var go = function () { openIntro(id); };
      card.addEventListener("click", go);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
      grid.appendChild(card);
    });

    fxIn([statsEl].concat(Array.prototype.slice.call(grid.children)), 0.06);
  }

  function goHome() {
    stopTimer();
    run = null;
    switchView(homeEl);
    renderHome();
  }

  /* ======================== DECK INTRO ======================== */

  function openIntro(id) {
    var deck = decks[id];
    if (!deck) return;
    var rec = loadStore().decks[id];
    var c = deckCounts(deck), mix = "";
    ["mcq", "numeric", "kata"].forEach(function (t) {
      if (c[t]) mix += "<span><b>" + c[t] + "</b> " + TYPE_LABEL[t] + (c[t] > 1 && t === "kata" ? "S" : "") + "</span>";
    });
    introEl.innerHTML =
      '<div class="gxv2-intro" id="gx-introbox">' +
      '<div class="gi-head"><span>DECK BRIEFING</span><span>' + deck.items.length + " DRILLS · ONE ATTEMPT EACH</span></div>" +
      '<div class="gi-body">' +
      '<div class="gi-vol">' + esc(deck.vol) + "</div>" +
      "<h2>" + esc(deck.title) + "</h2>" +
      '<p class="gi-desc">' + esc(deck.desc) + "</p>" +
      '<div class="gxv2-mix">' + mix + "</div>" +
      '<div class="readout-strip">' +
      '<div class="readout"><div class="r-label">DRILLS</div><div class="r-value">' + deck.items.length + "</div></div>" +
      '<div class="readout"><div class="r-label">EST. TIME</div><div class="r-value">≈ ' + deckEstMin(deck) + "<small> MIN</small></div></div>" +
      '<div class="readout' + (rec ? " acc" : "") + '"><div class="r-label">BEST</div><div class="r-value">' + (rec ? rec.best + "<small> / " + deck.items.length + "</small>" : "—") + "</div></div>" +
      '<div class="readout"><div class="r-label">RUNS</div><div class="r-value">' + (rec ? rec.completions : 0) + "</div></div></div>" +
      '<div class="gxv2-introbar">' +
      '<button class="gxv2-bigbtn" type="button" id="gx-start">START ▶</button>' +
      '<button class="w-btn ghost" type="button" id="gx-introback">← ALL DECKS</button></div>' +
      '<div class="gxv2-kbd">ENTER STARTS · KEYS 1–4 ANSWER · ENTER ADVANCES · SKIP COUNTS AS A MISS</div>' +
      "</div></div>";
    document.getElementById("gx-start").addEventListener("click", function () { startRun(id, null); });
    document.getElementById("gx-introback").addEventListener("click", goHome);
    switchView(introEl);
    fxIn([document.getElementById("gx-introbox")], 0);
  }

  /* ======================== DRILL FLOW ======================== */

  function startRun(deckId, idxList) {
    var deck = decks[deckId];
    if (!deck) return;
    var srcIdx = idxList || deck.items.map(function (_, i) { return i; });
    run = {
      deckId: deckId, deck: deck,
      items: srcIdx.map(function (i) { return deck.items[i]; }),
      srcIdx: srcIdx, review: !!idxList,
      idx: 0, score: 0, streak: 0, maxStreak: 0, missed: [],
      t0: Date.now(), answered: false
    };
    switchView(runEl);
    startTimer();
    renderItem();
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(function () {
      var el = document.getElementById("gx-clock");
      if (el && run) el.textContent = fmtClock(Date.now() - run.t0);
    }, 1000);
  }
  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function streakHtml() {
    return '<span class="gxv2-streak' + (run.streak >= 2 ? " hot" : "") + '" id="gx-streak"><span class="tk"></span>STREAK ' + run.streak + "</span>";
  }

  function bodyFor(item) {
    if (item.type === "mcq") {
      return '<div class="dr-opts">' + item.opts.map(function (o, i) {
        return '<button class="dr-opt" type="button" data-i="' + i + '"><span class="gx-key">' + (i + 1) + "</span> " + o + "</button>";
      }).join("") + "</div>";
    }
    if (item.type === "numeric") {
      return '<div class="dr-opts"><div class="gx-numrow">' +
        '<input class="gx-input" id="gx-num" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="0.0" />' +
        (item.unit ? '<span class="gx-unit">' + esc(item.unit) + "</span>" : "") +
        '<button class="w-btn" type="button" id="gx-check">CHECK</button></div>' +
        '<div class="gx-hint">ONE ATTEMPT · RELATIVE TOLERANCE ±' + Math.round(item.tol * 100) + "% · ENTER CHECKS</div></div>";
    }
    return '<div class="dr-opts">' +
      '<pre class="gx-code" id="gx-code" contenteditable="true" spellcheck="false"></pre>' +
      '<div class="gx-bar"><button class="w-btn" type="button" id="gx-runpy">RUN &amp; GRADE ▶</button>' +
      '<span class="gx-pystatus" id="gx-pystatus">EDIT THE CODE · TESTS APPENDED ON RUN · UNLIMITED RUNS</span></div>' +
      '<pre class="gx-out" id="gx-out" hidden></pre></div>';
  }

  function renderItem() {
    var deck = run.deck;
    var item = run.items[run.idx];
    var n = run.items.length;
    run.answered = false;
    var prompt = item.type === "mcq" ? "PICK AN ANSWER — 1–4 OR CLICK"
      : item.type === "numeric" ? "TYPE A NUMBER, THEN CHECK"
        : "EDIT, THEN RUN &amp; GRADE — OR SKIP";
    runEl.innerHTML =
      '<div class="gx-runbar"><span class="gx-decktitle">' + esc(deck.vol) + " · " + esc(deck.title) + (run.review ? " · REVIEW" : "") + "</span>" +
      '<button class="w-btn ghost" type="button" id="gx-quit">✕ QUIT</button></div>' +
      '<div class="gxv2-prog"><div class="fill" id="gx-fill" style="width:' + (100 * run.idx / n) + '%"></div></div>' +
      '<div class="drill" id="gx-drill">' +
      '<div class="dr-head"><span>QUESTION ' + (run.idx + 1) + "/" + n + " · " + TYPE_LABEL[item.type] + "</span>" +
      "<span>" + streakHtml() + ' · <span id="gx-score">SCORE ' + run.score + '</span> · <span id="gx-clock">' + fmtClock(Date.now() - run.t0) + "</span></span></div>" +
      '<div class="dr-q">' + item.q + "</div>" + bodyFor(item) +
      '<div class="dr-exp" id="gx-exp">' + item.exp + "</div>" +
      '<div class="gx-foot"><span class="gx-status" id="gx-status">' + prompt + "</span>" +
      '<span class="gx-actions"><button class="w-btn ghost" type="button" id="gx-skip">SKIP →</button>' +
      '<button class="w-btn" type="button" id="gx-next" hidden>' + (run.idx === n - 1 ? "FINISH →" : "NEXT →") + "</button></span></div></div>";
    wireItem(item);
    mathify(runEl);
    fxIn([document.getElementById("gx-drill")], 0);
  }

  /* Marks the current item answered, updates score/streak/progress,
     reveals the explanation, and surfaces the NEXT button. */
  function settle(ok, statusText) {
    if (run.answered) return;
    run.answered = true;
    if (ok) {
      run.score += 1;
      run.streak += 1;
      if (run.streak > run.maxStreak) run.maxStreak = run.streak;
    } else {
      run.missed.push(run.srcIdx[run.idx]);
      run.streak = 0;
    }
    document.getElementById("gx-exp").classList.add("show");
    var st = document.getElementById("gx-status");
    st.textContent = statusText || (ok ? "✓ CORRECT" : "✗ INCORRECT");
    st.className = "gx-status " + (ok ? "ok" : "bad");
    document.getElementById("gx-score").textContent = "SCORE " + run.score;
    var stk = document.getElementById("gx-streak");
    if (stk) {
      stk.outerHTML = streakHtml();
      stk = document.getElementById("gx-streak");
      if (ok && stk) stk.classList.add("pop");
    }
    document.getElementById("gx-fill").style.width = (100 * (run.idx + 1) / run.items.length) + "%";
    hide(document.getElementById("gx-skip"));
    var nx = document.getElementById("gx-next");
    show(nx);
    try { nx.focus({ preventScroll: true }); } catch (e) { /* older engines */ }
    fxIn([nx], 0);
  }

  function advance() {
    run.idx += 1;
    if (run.idx >= run.items.length) finish();
    else renderItem();
  }
  function advanceIfReady() {
    var nx = document.getElementById("gx-next");
    if (nx && !nx.hidden) nx.click();
  }

  function wireItem(item) {
    var quit = document.getElementById("gx-quit");
    quit.addEventListener("click", function () {
      if (quit.dataset.armed) { goHome(); return; }
      quit.dataset.armed = "1";
      quit.textContent = "SURE? CLICK AGAIN";
      setTimeout(function () {
        if (quit && quit.isConnected) { delete quit.dataset.armed; quit.textContent = "✕ QUIT"; }
      }, 2400);
    });
    document.getElementById("gx-next").addEventListener("click", advance);

    var reveal = item.type === "mcq" ? wireMcq(item) : item.type === "numeric" ? wireNumeric(item) : wireKata(item);

    document.getElementById("gx-skip").addEventListener("click", function () {
      if (run.answered) return;
      reveal();
      settle(false, "SKIPPED — COUNTS AS A MISS. READ THE EXPLANATION");
    });
  }

  /* Each wire* returns a reveal() used by SKIP to expose the answer. */
  function wireMcq(item) {
    var opts = Array.prototype.slice.call(runEl.querySelectorAll(".dr-opt"));
    function lockAll() { opts.forEach(function (b) { b.classList.add("lock"); }); }
    opts.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (run.answered) return;
        var ok = parseInt(btn.getAttribute("data-i"), 10) === item.correct;
        if (ok) btn.classList.add("right");
        else { btn.classList.add("wrong"); opts[item.correct].classList.add("right"); }
        lockAll();
        settle(ok);
      });
    });
    return function () { opts[item.correct].classList.add("right"); lockAll(); };
  }

  function wireNumeric(item) {
    var input = document.getElementById("gx-num");
    var expected = item.answer + (item.unit ? " " + item.unit : "") + " ±" + Math.round(item.tol * 100) + "%";
    function grade() {
      if (run.answered) return;
      var v = parseFloat(String(input.value).replace(/,/g, "").trim());
      if (isNaN(v)) {
        var st = document.getElementById("gx-status");
        st.textContent = "ENTER A NUMBER FIRST";
        st.className = "gx-status bad";
        return;
      }
      var ok = Math.abs(v - item.answer) <= item.tol * Math.abs(item.answer) + 1e-12;
      input.classList.add(ok ? "right" : "wrong");
      input.setAttribute("readonly", "readonly");
      settle(ok, (ok ? "✓ CORRECT — " : "✗ — EXPECTED ") + expected);
    }
    document.getElementById("gx-check").addEventListener("click", grade);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); run.answered ? advanceIfReady() : grade(); }
    });
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    return function () {
      input.value = String(item.answer);
      input.classList.add("wrong");
      input.setAttribute("readonly", "readonly");
    };
  }

  /* ---------------- kata: pyodide ---------------- */

  function ensurePyodide(statusEl) {
    if (pyodidePromise) return pyodidePromise;
    statusEl.textContent = "LOADING PYTHON RUNTIME (FIRST RUN ONLY, ~10 MB)…";
    pyodidePromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = PYODIDE_URL;
      s.onload = function () {
        window.loadPyodide({ indexURL: PYODIDE_INDEX })
          .then(function (py) {
            statusEl.textContent = "LOADING NUMPY…";
            return py.loadPackage("numpy").then(function () { return py; });
          })
          .then(resolve, reject);
      };
      s.onerror = function () { reject(new Error("pyodide script failed to load")); };
      document.head.appendChild(s);
    });
    return pyodidePromise;
  }

  function wireKata(item) {
    var editor = document.getElementById("gx-code");
    var runBtn = document.getElementById("gx-runpy");
    var outEl = document.getElementById("gx-out");
    var status = document.getElementById("gx-pystatus");
    editor.textContent = item.starter;

    editor.addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); document.execCommand("insertText", false, "    "); }
    });
    function freeze() {
      editor.setAttribute("contenteditable", "false");
      runBtn.disabled = true;
    }

    runBtn.addEventListener("click", function () {
      if (run.answered) return;
      runBtn.disabled = true;
      status.textContent = "RUNNING…";
      var code = editor.textContent + "\n\n" + item.tests;
      ensurePyodide(status)
        .then(function (py) {
          status.textContent = "RUNNING YOUR CODE + TESTS…";
          var out = [], errs = [];
          py.setStdout({ batched: function (l) { out.push(l); } });
          py.setStderr({ batched: function (l) { errs.push(l); } });
          return py.runPythonAsync(code).then(
            function () { return { out: out, errs: errs, fatal: null }; },
            function (e) { return { out: out, errs: errs, fatal: String(e && e.message ? e.message : e) }; }
          );
        })
        .then(function (r) {
          runBtn.disabled = false;
          var stdout = r.out.join("\n");
          var full = stdout + (r.errs.length ? "\n" + r.errs.join("\n") : "") + (r.fatal ? "\n" + r.fatal : "");
          outEl.textContent = full.trim() || "(no output)";
          show(outEl);
          var ok = stdout.indexOf(PASS_TOKEN) !== -1;
          outEl.classList.toggle("pass", ok);
          outEl.classList.toggle("fail", !ok);
          if (ok) {
            freeze();
            status.textContent = "ALL TESTS PASSED";
            settle(true, "✓ ALL TESTS PASSED");
          } else {
            status.textContent = "✗ TESTS FAILED — EDIT AND RUN AGAIN, OR SKIP";
          }
        })
        .catch(function () {
          pyodidePromise = null;
          runBtn.disabled = false;
          status.textContent = "RUNTIME FAILED TO LOAD — CHECK NETWORK, THEN RUN AGAIN";
        });
    });

    return function () {
      freeze();
      status.textContent = "SKIPPED — THE EXPLANATION HAS THE SOLUTION";
    };
  }

  /* ======================== END SCREEN ======================== */

  function finish() {
    stopTimer();
    var ms = Date.now() - run.t0;
    var store = loadStore();
    var prev = store.decks[run.deckId];
    var isBest = false;

    if (!run.review) {
      var rec = prev || { best: 0, completions: 0, lastScore: 0 };
      isBest = run.score > rec.best || (!prev && run.score > 0);
      if (run.score > rec.best) rec.best = run.score;
      rec.completions += 1;
      rec.lastScore = run.score;
      store.decks[run.deckId] = rec;
    }
    if (run.maxStreak > store.bestStreak) store.bestStreak = run.maxStreak;
    saveStore(store);

    lastResult = {
      deckId: run.deckId, missed: run.missed.slice(), review: run.review,
      score: run.score, total: run.items.length, ms: ms, isBest: isBest
    };
    run = null;
    renderResults(lastResult);
    switchView(resEl);
  }

  function renderResults(res) {
    var deck = decks[res.deckId];
    var pct = Math.round((100 * res.score) / res.total);
    var verdict = res.review
      ? (res.missed.length === 0 ? "ALL PATCHED" : "STILL LEAKING")
      : pct === 100 ? "FLAWLESS" : pct >= 80 ? "CLEARED" : pct >= 50 ? "RUN IT BACK" : "BACK TO THE CHAPTERS";
    var rec = loadStore().decks[res.deckId];

    var buttons = "";
    if (!res.review) buttons += '<button class="w-btn" type="button" id="gx-dl">DOWNLOAD SHARE CARD ↓</button>';
    if (res.missed.length) {
      buttons += '<button class="w-btn' + (res.review ? "" : " ghost") + '" type="button" id="gx-review">REVIEW ' +
        res.missed.length + (res.missed.length === 1 ? " MISTAKE" : " MISTAKES") + " →</button>";
    }
    buttons += '<button class="w-btn ghost" type="button" id="gx-retry">' + (res.review ? "RETRY FULL DECK" : "RETRY DECK") + "</button>" +
      '<button class="w-btn ghost" type="button" id="gx-back">ALL DECKS</button>';

    resEl.innerHTML =
      '<div class="widget" id="gx-resbox">' +
      '<div class="w-head"><span class="w-dot"></span><span class="w-title">' +
      (res.review ? "REVIEW RESULT — " : "RESULT — ") + esc(deck.title).toUpperCase() +
      '</span><span class="w-sub">' + verdict + "</span></div>" +
      '<div class="w-body"><div class="gxv2-resgrid">' +
      '<div class="gxv2-ringwrap"><canvas id="gx-ring" width="168" height="168"></canvas></div>' +
      '<div class="readout-strip">' +
      '<div class="readout acc"><div class="r-label">SCORE' + (res.isBest ? ' <span class="gxv2-newbest">NEW BEST</span>' : "") + '</div><div class="r-value">' + res.score + " / " + res.total + "</div></div>" +
      '<div class="readout"><div class="r-label">ACCURACY</div><div class="r-value">' + pct + "<small> %</small></div></div>" +
      '<div class="readout"><div class="r-label">TIME</div><div class="r-value">' + fmtTime(res.ms) + "</div></div>" +
      (rec ? '<div class="readout"><div class="r-label">DECK BEST</div><div class="r-value">' + rec.best + "<small> / " + deck.items.length + "</small></div></div>" : "") +
      "</div></div>" +
      (res.review ? "" : '<canvas id="gx-card" class="gx-card" width="1200" height="630"></canvas>') +
      '<div class="gx-resbar">' + buttons + "</div></div>" +
      '<div class="w-note">' +
      (res.review
        ? "Review runs don't touch your saved best — they exist to close the gaps before the next full attempt."
        : "The share card renders entirely client-side — download it, post it. Best runs live in this browser's localStorage only.") +
      "</div></div>";

    drawRing(document.getElementById("gx-ring"), pct, res.score + "/" + res.total);
    if (!res.review) {
      drawCard(document.getElementById("gx-card"), deck, res.score, res.total, res.ms, res.isBest);
      document.getElementById("gx-dl").addEventListener("click", function () {
        var a = document.createElement("a");
        a.download = "aie-gym-" + deck.id + "-" + res.score + "of" + res.total + ".png";
        a.href = document.getElementById("gx-card").toDataURL("image/png");
        a.click();
      });
    }
    var rv = document.getElementById("gx-review");
    if (rv) rv.addEventListener("click", function () { startRun(res.deckId, res.missed.slice()); });
    document.getElementById("gx-retry").addEventListener("click", function () { startRun(res.deckId, null); });
    document.getElementById("gx-back").addEventListener("click", goHome);
    fxIn([document.getElementById("gx-resbox")], 0);
  }

  /* Animated score ring — canvas, mint arc, setTimeout-driven. */
  function drawRing(cv, pct, label) {
    if (!cv) return;
    var S = 168, dpr = Math.max(1, window.devicePixelRatio || 1);
    cv.width = S * dpr; cv.height = S * dpr;
    cv.style.width = S + "px"; cv.style.height = S + "px";
    var x = cv.getContext("2d");
    x.scale(dpr, dpr);
    function frame(p) {
      x.clearRect(0, 0, S, S);
      x.lineWidth = 10;
      x.strokeStyle = "#2f3234";
      x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 12, 0, Math.PI * 2); x.stroke();
      if (p > 0.2) {
        x.strokeStyle = "#a6f2cc";
        x.lineCap = "round";
        x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 12, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (p / 100)); x.stroke();
      }
      x.textAlign = "center";
      x.fillStyle = "#ffffff";
      x.font = "700 34px " + SANS;
      x.fillText(Math.round(p) + "%", S / 2, S / 2 + 8);
      x.fillStyle = "#9b9b9b";
      x.font = "500 11px " + MONO;
      x.fillText(label, S / 2, S / 2 + 30);
    }
    if (reduced) { frame(pct); return; }
    var DUR = 1100, STEP = 16, elapsed = 0;
    (function tick() {
      elapsed += STEP;
      var t = Math.min(1, elapsed / DUR);
      frame(pct * (1 - Math.pow(1 - t, 3)));            /* ease-out cubic */
      if (t < 1) setTimeout(tick, STEP);                /* background-tab safe */
    })();
  }

  /* 1200×630 share card — v1 layout family, retuned spacing, plus a
     static score ring on the right. Palette colors only. */
  function drawCard(cv, deck, score, total, ms, isBest) {
    if (!cv) return;
    var x = cv.getContext("2d");
    var W = 1200, H = 630, M = 80;
    var pct = Math.round((100 * score) / total);
    function letter(v) { try { x.letterSpacing = v; } catch (e) { /* older engines */ } }

    x.fillStyle = "#000000"; x.fillRect(0, 0, W, H);
    x.strokeStyle = "#2f3234"; x.lineWidth = 2; x.strokeRect(1, 1, W - 2, H - 2);

    /* brand row: mint tick + wordmark */
    x.fillStyle = "#a6f2cc"; x.fillRect(M, 92, 8, 8);
    letter("4px");
    x.fillStyle = "#9b9b9b"; x.font = "500 22px " + MONO;
    x.fillText("AI // ENCYCLOPEDIA — THE GYM", M + 24, 106);

    /* score ring, right side */
    var cx = W - M - 128, cy = 312, r = 118;
    x.lineWidth = 16;
    x.strokeStyle = "#2f3234";
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
    if (pct > 0) {
      x.strokeStyle = "#a6f2cc"; x.lineCap = "round";
      x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (pct / 100)); x.stroke();
      x.lineCap = "butt";
    }
    letter("0px");
    x.textAlign = "center";
    x.fillStyle = "#ffffff"; x.font = "700 64px " + SANS; x.fillText(pct + "%", cx, cy + 14);
    letter("2px");
    x.fillStyle = "#9b9b9b"; x.font = "500 20px " + MONO; x.fillText(score + "/" + total, cx, cy + 56);
    x.textAlign = "left";

    /* deck block, left column */
    var maxW = cx - r - 48 - M;
    letter("3px");
    x.fillStyle = "#a6f2cc"; x.font = "500 20px " + MONO; x.fillText(deck.vol.toUpperCase(), M, 232);
    letter("0px");
    x.fillStyle = "#ffffff";
    var size = 76;
    x.font = "700 " + size + "px " + SANS;
    while (x.measureText(deck.title).width > maxW && size > 36) {
      size -= 4;
      x.font = "700 " + size + "px " + SANS;
    }
    x.fillText(deck.title, M - 2, 318);
    letter("3px");
    x.fillStyle = "#a6f2cc"; x.font = "600 28px " + MONO;
    x.fillText("SCORE " + score + "/" + total + " · " + fmtTime(ms) + (isBest ? " · NEW BEST" : ""), M, 392);

    /* footer */
    x.fillStyle = "#2f3234"; x.fillRect(M, 520, W - 2 * M, 1);
    letter("2px");
    x.fillStyle = "#636363"; x.font = "500 20px " + MONO;
    x.fillText("llm-manual.vercel.app/gym", M, 568);
    var stamp = "GRADED CLIENT-SIDE · NO ACCOUNT";
    x.fillText(stamp, W - M - x.measureText(stamp).width, 568);
    letter("0px");
  }

  /* ======================== KEYBOARD ======================== */

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (typing) return; /* gx-input handles its own Enter; the kata editor needs every key */
    var onBtn = t && t.tagName === "BUTTON"; /* let focused buttons handle Enter natively */

    if (!introEl.hidden && e.key === "Enter" && !onBtn) {
      var sb = document.getElementById("gx-start");
      if (sb) { e.preventDefault(); sb.click(); }
      return;
    }
    if (runEl.hidden || !run) return;
    if (e.key === "Enter" && !onBtn) {
      var nx = document.getElementById("gx-next");
      if (nx && !nx.hidden) { e.preventDefault(); nx.click(); }
      return;
    }
    if (!run.answered && "1234".indexOf(e.key) !== -1) {
      var btn = runEl.querySelector('.dr-opt[data-i="' + (parseInt(e.key, 10) - 1) + '"]');
      if (btn) { e.preventDefault(); btn.click(); }
    }
  });

  /* ======================== BOOT ======================== */

  function init() { renderHome(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
