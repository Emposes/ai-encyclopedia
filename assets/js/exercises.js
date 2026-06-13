/* ============================================================
   AI ENCYCLOPEDIA — write-the-value exercises
   Authoring contract (additions-only in chapter HTML):

     <div class="exercise" data-answer="3" data-tol="0.001"
          data-unit="" data-hint="apply the update rule">
       <div class="ex-q">One step: \(w=4\), \(\nabla=2\), \(\eta=0.5\). New \(w\)?</div>
       <div class="ex-reveal-src">\(w' = w-\eta\nabla = 4-0.5\cdot2 = \) <b>3</b>.</div>
     </div>

   data-answer: a number (graded with relative tolerance data-tol, default
     0.02) OR a non-numeric string (graded case/space-insensitive) OR a
     pipe-list of acceptable strings ("paris|paris, france").
   The engine builds the input row, CHECK / HINT / SOLUTION controls,
   grades on Enter or CHECK, and records cleared exercises in localStorage
   ("aie-ex") so the Gym/progress can read them. Self-boots; also exposes
   window.__exercisesScan() for re-scan after DOM moves.
   ============================================================ */
(function () {
  "use strict";

  function store(id, ok) {
    try {
      var s = JSON.parse(localStorage.getItem("aie-ex") || "{}");
      var key = location.pathname.replace(/\.html$/, "") + "#" + id;
      if (ok) { s[key] = 1; localStorage.setItem("aie-ex", JSON.stringify(s)); }
    } catch (e) {}
  }

  function gradeNumeric(val, ans, tol) {
    var x = parseFloat(String(val).replace(/[, ]+/g, "").replace(/[^0-9eE.+-]/g, ""));
    if (!isFinite(x)) return false;
    var t = isFinite(tol) ? tol : 0.02;
    return Math.abs(x - ans) <= Math.max(t * Math.abs(ans), t, 1e-9);
  }
  function gradeString(val, accepted) {
    var norm = function (s) { return String(s).toLowerCase().replace(/\s+/g, " ").replace(/[.,;]+$/, "").trim(); };
    var v = norm(val);
    return accepted.some(function (a) { return norm(a) === v; });
  }

  var counter = 0;
  function wire(ex) {
    if (ex.__wired) return;
    ex.__wired = true;
    var id = ex.id || ("ex" + (counter++));
    ex.id = id;

    var rawAns = ex.getAttribute("data-answer") || "";
    var numAns = parseFloat(rawAns);
    var isNum = rawAns !== "" && isFinite(numAns) && /^[\s$£€]*[-+]?[0-9.,eE+-]+[\s%a-zA-Z/]*$/.test(rawAns.trim()) && !isNaN(numAns);
    var accepted = rawAns.split("|");
    var tol = parseFloat(ex.getAttribute("data-tol"));
    var unit = ex.getAttribute("data-unit") || "";
    var hint = ex.getAttribute("data-hint") || "";

    var q = ex.querySelector(".ex-q");
    var revealSrc = ex.querySelector(".ex-reveal-src");

    var head = document.createElement("div");
    head.className = "ex-head";
    head.innerHTML = "<span style='color:var(--accent)'>✎</span> Exercise · write the value<span class='ex-tag'>" +
      (isNum ? "tol ±" + (isFinite(tol) ? (tol * 100).toFixed(tol < 0.01 ? 1 : 0) + "%" : "2%") : "text") + "</span>";

    var body = document.createElement("div");
    body.className = "ex-body";
    if (q) body.appendChild(q);

    var row = document.createElement("div");
    row.className = "ex-row";
    row.innerHTML =
      "<input class='ex-input' type='text' inputmode='" + (isNum ? "decimal" : "text") + "' placeholder='your answer' autocomplete='off' spellcheck='false'/>" +
      (unit ? "<span class='ex-unit'>" + unit + "</span>" : "") +
      "<div class='ex-actions'>" +
      "<button class='w-btn ex-check' type='button'>CHECK</button>" +
      (hint ? "<button class='ex-link ex-hint' type='button'>HINT</button>" : "") +
      (revealSrc ? "<button class='ex-link ex-sol' type='button'>SOLUTION</button>" : "") +
      "</div>";
    body.appendChild(row);

    var fb = document.createElement("div");
    fb.className = "ex-feedback";
    body.appendChild(fb);

    var reveal = null;
    if (revealSrc) {
      reveal = document.createElement("div");
      reveal.className = "ex-reveal";
      reveal.innerHTML = revealSrc.innerHTML;
      revealSrc.parentNode.removeChild(revealSrc);
      body.appendChild(reveal);
    }

    ex.innerHTML = "";
    ex.appendChild(head);
    ex.appendChild(body);

    var input = row.querySelector(".ex-input");
    var tries = 0;

    function check() {
      var val = input.value.trim();
      if (!val) { return; }
      tries++;
      var ok = isNum ? gradeNumeric(val, numAns, tol) : gradeString(val, accepted);
      input.classList.toggle("right", ok);
      input.classList.toggle("wrong", !ok);
      fb.className = "ex-feedback show " + (ok ? "ok" : "no");
      if (ok) {
        fb.textContent = "✓ Correct" + (tries === 1 ? " — first try." : ".");
        store(id, true);
        if (window.AIEProgress && window.AIEProgress.exerciseCleared) window.AIEProgress.exerciseCleared(id);
      } else {
        fb.textContent = tries >= 2 && reveal ? "Not quite — open the solution to see the working." : "Not quite — try again.";
        if (tries >= 3 && reveal) { reveal.classList.add("show"); }
      }
    }
    row.querySelector(".ex-check").addEventListener("click", check);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
    var hintBtn = row.querySelector(".ex-hint");
    if (hintBtn) hintBtn.addEventListener("click", function () {
      fb.className = "ex-feedback show"; fb.style.color = "var(--text-secondary)"; fb.textContent = "Hint: " + hint;
    });
    var solBtn = row.querySelector(".ex-sol");
    if (solBtn && reveal) solBtn.addEventListener("click", function () { reveal.classList.toggle("show"); });

    if (window.renderMathInElement) {
      try { window.renderMathInElement(ex, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false }); } catch (e) {}
    }
  }

  function scan() { document.querySelectorAll(".exercise").forEach(wire); }
  window.__exercisesScan = scan;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();
})();
