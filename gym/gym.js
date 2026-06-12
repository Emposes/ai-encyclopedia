/* ============================================================
   AI ENCYCLOPEDIA — THE GYM engine
   Fully client-side drill arena. No backend, no accounts.
   Decks register on window.AIE_DECKS (see decks/*.js).
   Best runs persist to localStorage "aie-gym".
   Katas run on Pyodide + numpy, lazy-loaded on first RUN.
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "aie-gym";
  var DECK_ORDER = ["ml", "llm", "prompting", "agents"];
  var PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
  var PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  var PASS_TOKEN = "ALL TESTS PASSED";
  var MONO = "ui-monospace, 'SF Mono', Menlo, 'Cascadia Mono', monospace";
  var SANS = "-apple-system, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";

  var homeEl = document.getElementById("gym-home");
  var grid = document.getElementById("gym-decks");
  var runEl = document.getElementById("gym-run");
  var resEl = document.getElementById("gym-results");
  if (!homeEl || !grid || !runEl || !resEl) return;

  var decks = window.AIE_DECKS || {};
  var run = null;
  var timerId = null;
  var pyodidePromise = null;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- helpers ---------------- */

  function loadBest() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveBest(map) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(map)); } catch (e) { /* private mode */ }
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmtTime(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + "M" + (s < 10 ? "0" : "") + s + "S";
  }
  function fmtClock(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function mathify(el) {
    if (typeof renderMathInElement === "function" && el) {
      renderMathInElement(el, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    }
  }
  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }
  function scrollToEl(el) {
    var y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
  }
  function enter(el) {
    if (typeof gsap !== "undefined" && !reduced) {
      gsap.from(el, { y: 18, opacity: 0, duration: 0.45, ease: "power2.out", clearProps: "all" });
    }
  }

  /* ---------------- deck grid ---------------- */

  function deckMix(deck) {
    var c = { mcq: 0, numeric: 0, kata: 0 };
    deck.items.forEach(function (it) { c[it.type] += 1; });
    var mix = [];
    if (c.mcq) mix.push(c.mcq + " MCQ");
    if (c.numeric) mix.push(c.numeric + " NUMERIC");
    if (c.kata) mix.push(c.kata + " KATA");
    return deck.items.length + " DRILLS · " + mix.join(" / ");
  }

  function renderDecks() {
    var best = loadBest();
    grid.innerHTML = "";
    DECK_ORDER.forEach(function (id) {
      var deck = decks[id];
      if (!deck) return;
      var b = best[id];
      var card = document.createElement("article");
      card.className = "deck-card";
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      card.innerHTML =
        '<div class="dk-vol">' + esc(deck.vol) + "</div>" +
        "<h3>" + esc(deck.title) + "</h3>" +
        "<p>" + esc(deck.desc) + "</p>" +
        '<div class="dk-meta">' + deckMix(deck) + "<br/>" +
        (b
          ? '<span class="dk-best">BEST ' + b.score + "/" + b.total + " · " + fmtTime(b.ms) + "</span>"
          : "UNCLEARED") +
        "</div>";
      var go = function () { startDeck(id); };
      card.addEventListener("click", go);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
      grid.appendChild(card);
    });
    if (typeof gsap !== "undefined" && !reduced && grid.children.length) {
      gsap.from(grid.children, { y: 22, opacity: 0, duration: 0.55, stagger: 0.07, ease: "power2.out", clearProps: "all" });
    }
  }

  /* ---------------- run lifecycle ---------------- */

  function startDeck(id) {
    var deck = decks[id];
    if (!deck) return;
    run = { deck: deck, idx: 0, score: 0, t0: Date.now(), answered: false };
    hide(homeEl); hide(resEl); show(runEl);
    startTimer();
    renderItem();
    scrollToEl(runEl);
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

  function abandon() {
    stopTimer();
    run = null;
    hide(runEl); hide(resEl); show(homeEl);
    renderDecks();
    scrollToEl(homeEl);
  }

  /* ---------------- item rendering ---------------- */

  function bodyFor(item) {
    if (item.type === "mcq") {
      return '<div class="dr-opts">' + item.opts.map(function (o, i) {
        return '<button class="dr-opt" type="button" data-i="' + i + '">' +
          '<span class="gx-key">' + "ABCD".charAt(i) + "</span> " + o + "</button>";
      }).join("") + "</div>";
    }
    if (item.type === "numeric") {
      return '<div class="dr-opts"><div class="gx-numrow">' +
        '<input class="gx-input" id="gx-num" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="0.0" />' +
        (item.unit ? '<span class="gx-unit">' + esc(item.unit) + "</span>" : "") +
        '<button class="w-btn" type="button" id="gx-check">CHECK</button>' +
        '</div><div class="gx-hint">ONE ATTEMPT · RELATIVE TOLERANCE ±' + Math.round(item.tol * 100) + "%</div></div>";
    }
    return '<div class="dr-opts">' +
      '<pre class="gx-code" id="gx-code" contenteditable="true" spellcheck="false"></pre>' +
      '<div class="gx-bar">' +
      '<button class="w-btn" type="button" id="gx-runpy">RUN &amp; GRADE ▶</button>' +
      '<button class="w-btn ghost" type="button" id="gx-giveup">GIVE UP</button>' +
      '<span class="gx-pystatus" id="gx-pystatus">EDIT THE CODE · TESTS APPENDED ON RUN</span>' +
      "</div>" +
      '<pre class="gx-out" id="gx-out" hidden></pre>' +
      "</div>";
  }

  function renderItem() {
    var deck = run.deck;
    var item = deck.items[run.idx];
    run.answered = false;
    runEl.innerHTML =
      '<div class="gx-runbar">' +
      '<span class="gx-decktitle">' + esc(deck.vol) + " · " + esc(deck.title).toUpperCase() + "</span>" +
      '<button class="w-btn ghost" type="button" id="gx-quit">✕ ABANDON RUN</button>' +
      "</div>" +
      '<div class="drill" id="gx-drill">' +
      '<div class="dr-head">' +
      "<span>DRILL " + (run.idx + 1) + "/" + deck.items.length + " · " + item.type.toUpperCase() + "</span>" +
      '<span><span id="gx-score">SCORE ' + run.score + '</span> · <span id="gx-clock">' + fmtClock(Date.now() - run.t0) + "</span></span>" +
      "</div>" +
      '<div class="dr-q">' + item.q + "</div>" +
      bodyFor(item) +
      '<div class="dr-exp" id="gx-exp">' + item.exp + "</div>" +
      '<div class="gx-foot">' +
      '<span class="gx-status" id="gx-status"></span>' +
      '<button class="w-btn" type="button" id="gx-next" hidden>' +
      (run.idx === deck.items.length - 1 ? "FINISH →" : "NEXT →") + "</button>" +
      "</div></div>";
    wireItem(item);
    mathify(runEl);
    enter(document.getElementById("gx-drill"));
  }

  function settle(ok) {
    if (ok) run.score += 1;
    var exp = document.getElementById("gx-exp");
    if (exp) exp.classList.add("show");
    var st = document.getElementById("gx-status");
    if (st) {
      st.textContent = ok ? "✓ CORRECT" : "✗ INCORRECT";
      st.className = "gx-status " + (ok ? "ok" : "bad");
    }
    var sc = document.getElementById("gx-score");
    if (sc) sc.textContent = "SCORE " + run.score;
    var nx = document.getElementById("gx-next");
    if (nx) show(nx);
  }

  function wireItem(item) {
    document.getElementById("gx-quit").addEventListener("click", abandon);
    document.getElementById("gx-next").addEventListener("click", function () {
      run.idx += 1;
      if (run.idx >= run.deck.items.length) finish();
      else renderItem();
    });

    if (item.type === "mcq") wireMcq(item);
    else if (item.type === "numeric") wireNumeric(item);
    else wireKata(item);
  }

  function wireMcq(item) {
    var opts = Array.prototype.slice.call(runEl.querySelectorAll(".dr-opt"));
    opts.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (run.answered) return;
        run.answered = true;
        var pick = parseInt(btn.getAttribute("data-i"), 10);
        var ok = pick === item.correct;
        if (ok) btn.classList.add("right");
        else { btn.classList.add("wrong"); opts[item.correct].classList.add("right"); }
        opts.forEach(function (b) { b.classList.add("lock"); });
        settle(ok);
      });
    });
  }

  function wireNumeric(item) {
    var input = document.getElementById("gx-num");
    var check = document.getElementById("gx-check");
    function grade() {
      if (run.answered) return;
      var v = parseFloat(String(input.value).replace(/,/g, "").trim());
      if (isNaN(v)) {
        var st = document.getElementById("gx-status");
        st.textContent = "ENTER A NUMBER";
        st.className = "gx-status bad";
        return;
      }
      run.answered = true;
      var ok = Math.abs(v - item.answer) <= item.tol * Math.abs(item.answer) + 1e-12;
      input.classList.add(ok ? "right" : "wrong");
      input.setAttribute("readonly", "readonly");
      settle(ok);
      var st2 = document.getElementById("gx-status");
      st2.textContent = (ok ? "✓ CORRECT — " : "✗ — expected ") + item.answer +
        (item.unit ? " " + item.unit : "") + " ±" + Math.round(item.tol * 100) + "%";
    }
    check.addEventListener("click", grade);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); grade(); } });
    input.focus();
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
    var giveUp = document.getElementById("gx-giveup");
    var outEl = document.getElementById("gx-out");
    var status = document.getElementById("gx-pystatus");
    editor.textContent = item.starter;

    editor.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "    ");
      }
    });

    giveUp.addEventListener("click", function () {
      if (run.answered) return;
      run.answered = true;
      status.textContent = "REVEALED — READ THE EXPLANATION, THEN MOVE ON";
      settle(false);
    });

    runBtn.addEventListener("click", function () {
      if (run.answered) return;
      runBtn.disabled = true;
      status.textContent = "RUNNING…";
      var code = editor.textContent + "\n\n" + item.tests;
      ensurePyodide(status)
        .then(function (py) {
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
          var full = stdout +
            (r.errs.length ? "\n" + r.errs.join("\n") : "") +
            (r.fatal ? "\n" + r.fatal : "");
          outEl.textContent = full.trim() || "(no output)";
          show(outEl);
          var ok = stdout.indexOf(PASS_TOKEN) !== -1;
          outEl.classList.toggle("pass", ok);
          outEl.classList.toggle("fail", !ok);
          if (ok) {
            run.answered = true;
            editor.setAttribute("contenteditable", "false");
            runBtn.disabled = true;
            giveUp.disabled = true;
            status.textContent = "ALL TESTS PASSED";
            settle(true);
          } else {
            status.textContent = "✗ TESTS FAILED — EDIT AND RUN AGAIN, OR GIVE UP";
          }
        })
        .catch(function () {
          pyodidePromise = null;
          runBtn.disabled = false;
          status.textContent = "RUNTIME FAILED TO LOAD — CHECK NETWORK, THEN RUN AGAIN";
        });
    });
  }

  /* ---------------- results & share card ---------------- */

  function finish() {
    stopTimer();
    var ms = Date.now() - run.t0;
    var deck = run.deck;
    var score = run.score;
    var total = deck.items.length;
    var best = loadBest();
    var prev = best[deck.id];
    var isBest = !prev || score > prev.score || (score === prev.score && ms < prev.ms);
    if (isBest) {
      best[deck.id] = { score: score, total: total, ms: ms };
      saveBest(best);
    }
    hide(runEl);
    show(resEl);
    renderResults(deck, score, total, ms, isBest, prev);
    run = null;
    scrollToEl(resEl);
  }

  function renderResults(deck, score, total, ms, isBest, prev) {
    var pct = Math.round((100 * score) / total);
    var verdict = pct === 100 ? "FLAWLESS" : pct >= 80 ? "CLEARED" : pct >= 50 ? "RUN IT BACK" : "BACK TO THE CHAPTERS";
    var bestRec = isBest ? { score: score, total: total, ms: ms } : prev;
    resEl.innerHTML =
      '<div class="widget">' +
      '<div class="w-head"><span class="w-dot"></span><span class="w-title">RESULT — ' + esc(deck.title).toUpperCase() +
      '</span><span class="w-sub">' + verdict + "</span></div>" +
      '<div class="w-body">' +
      '<div class="readout-strip" style="margin-top:0;">' +
      '<div class="readout acc"><div class="r-label">SCORE</div><div class="r-value">' + score + " / " + total + "</div></div>" +
      '<div class="readout"><div class="r-label">ACCURACY</div><div class="r-value">' + pct + "<small> %</small></div></div>" +
      '<div class="readout"><div class="r-label">TIME</div><div class="r-value">' + fmtTime(ms) + "</div></div>" +
      '<div class="readout' + (isBest ? " acc" : "") + '"><div class="r-label">BEST' + (isBest ? " · NEW" : "") + '</div><div class="r-value">' +
      bestRec.score + "/" + bestRec.total + " <small>" + fmtTime(bestRec.ms) + "</small></div></div>" +
      "</div>" +
      '<canvas id="gx-card" class="gx-card" width="1200" height="630"></canvas>' +
      '<div class="gx-resbar">' +
      '<button class="w-btn" type="button" id="gx-dl">DOWNLOAD PNG ↓</button>' +
      '<button class="w-btn ghost" type="button" id="gx-retry">RETRY DECK</button>' +
      '<button class="w-btn ghost" type="button" id="gx-back">ALL DECKS</button>' +
      "</div></div>" +
      '<div class="w-note">The share card renders entirely client-side — download it, post it. Best runs live in this browser\'s localStorage only.</div>' +
      "</div>";
    drawCard(document.getElementById("gx-card"), deck, score, total, ms);
    document.getElementById("gx-dl").addEventListener("click", function () {
      var cv = document.getElementById("gx-card");
      var a = document.createElement("a");
      a.download = "aie-gym-" + deck.id + "-" + score + "of" + total + ".png";
      a.href = cv.toDataURL("image/png");
      a.click();
    });
    document.getElementById("gx-retry").addEventListener("click", function () { startDeck(deck.id); });
    document.getElementById("gx-back").addEventListener("click", abandon);
    enter(resEl.firstChild);
  }

  function drawCard(cv, deck, score, total, ms) {
    if (!cv) return;
    var x = cv.getContext("2d");
    var W = 1200, H = 630;

    x.fillStyle = "#000000";
    x.fillRect(0, 0, W, H);
    x.strokeStyle = "#2f3234";
    x.lineWidth = 2;
    x.strokeRect(1, 1, W - 2, H - 2);

    /* wordmark tick — the 8px mint square */
    x.fillStyle = "#a6f2cc";
    x.fillRect(72, 82, 8, 8);

    function letter(v) { try { x.letterSpacing = v; } catch (e) { /* older engines */ } }

    letter("4px");
    x.fillStyle = "#9b9b9b";
    x.font = "500 22px " + MONO;
    x.fillText("AI // ENCYCLOPEDIA — THE GYM", 96, 96);

    letter("3px");
    x.fillStyle = "#a6f2cc";
    x.font = "500 20px " + MONO;
    x.fillText(deck.vol.toUpperCase(), 72, 240);

    letter("0px");
    x.fillStyle = "#ffffff";
    var size = 88;
    x.font = "700 " + size + "px " + SANS;
    while (x.measureText(deck.title).width > W - 144 && size > 40) {
      size -= 4;
      x.font = "700 " + size + "px " + SANS;
    }
    x.fillText(deck.title, 70, 340);

    letter("3px");
    x.fillStyle = "#a6f2cc";
    x.font = "600 34px " + MONO;
    x.fillText("SCORE " + score + "/" + total + " · " + fmtTime(ms), 72, 425);

    x.fillStyle = "#2f3234";
    x.fillRect(72, 528, W - 144, 1);

    letter("2px");
    x.fillStyle = "#636363";
    x.font = "500 20px " + MONO;
    x.fillText("llm-manual.vercel.app/gym", 72, 574);
    var stamp = "GRADED CLIENT-SIDE · NO ACCOUNT";
    x.fillText(stamp, W - 72 - x.measureText(stamp).width, 574);
    letter("0px");
  }

  /* ---------------- boot ---------------- */

  function init() { renderDecks(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
