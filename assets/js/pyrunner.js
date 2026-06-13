/* ============================================================
   AI ENCYCLOPEDIA — in-browser Python, v2 ("The Lab")
   Desktop: every .pycell docks into a right-side Lab panel
   (tabs per cell); the prose keeps a compact chip that opens
   the Lab at that cell — code and explanation sit side by side.
   Narrow screens: chips expand the cell in place instead.
   Engine: Pyodide + numpy, lazy-loaded on first RUN.
   ============================================================ */
(function () {
  "use strict";

  var PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
  var pyodidePromise = null;
  var DESKTOP = window.matchMedia("(min-width: 60em)").matches;

  function statusAll(msg) {
    document.querySelectorAll(".py-status").forEach(function (el) { el.textContent = msg; });
  }

  function loadEngine() {
    if (pyodidePromise) return pyodidePromise;
    statusAll("LOADING PYTHON RUNTIME… (~10 MB, once)");
    pyodidePromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = PYODIDE_URL;
      s.onload = function () {
        window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" })
          .then(function (py) { statusAll("LOADING NUMPY…"); return py.loadPackage("numpy").then(function () { return py; }); })
          .then(function (py) { statusAll("PYTHON READY"); resolve(py); })
          .catch(reject);
      };
      s.onerror = function () { reject(new Error("Failed to load Pyodide")); };
      document.head.appendChild(s);
    });
    return pyodidePromise;
  }

  /* ---------- tiny plotter ---------- */
  function drawPlot(canvas, series) {
    var FM = window.FM;
    var sc = FM.setupCanvas(canvas, 260);
    var ctx = sc.ctx, padL = 46, padB = 30, padT = 12, padR = 14;
    var W = sc.w - padL - padR, H = 260 - padT - padB;
    ctx.clearRect(0, 0, sc.w, 260);
    var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    series.forEach(function (s) {
      s.xs.forEach(function (v) { xmin = Math.min(xmin, v); xmax = Math.max(xmax, v); });
      s.ys.forEach(function (v) { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); });
    });
    if (!isFinite(xmin)) return;
    if (xmax === xmin) { xmax += 1; xmin -= 1; }
    if (ymax === ymin) { ymax += 1; ymin -= 1; }
    var px = (xmax - xmin) * 0.05, py = (ymax - ymin) * 0.08;
    xmin -= px; xmax += px; ymin -= py; ymax += py;
    function X(v) { return padL + (v - xmin) / (xmax - xmin) * W; }
    function Y(v) { return padT + (1 - (v - ymin) / (ymax - ymin)) * H; }
    ctx.strokeStyle = FM.C.HAIR; ctx.lineWidth = 1; ctx.strokeRect(padL, padT, W, H);
    ctx.font = FM.C.MONO; ctx.fillStyle = FM.C.MUT;
    for (var t = 0; t <= 4; t++) {
      var xv = xmin + (xmax - xmin) * t / 4, yv = ymin + (ymax - ymin) * t / 4;
      ctx.textAlign = "center"; ctx.fillText((+xv.toPrecision(3)).toString(), X(xv), padT + H + 18);
      ctx.textAlign = "right"; ctx.fillText((+yv.toPrecision(3)).toString(), padL - 6, Y(yv) + 3);
    }
    var GROUPC = [FM.C.MINT, FM.C.BLUE, FM.C.RED, FM.C.SEC, "#d9f0ff", FM.C.DEEP];
    series.forEach(function (s, si) {
      if (s.kind === "line") {
        ctx.strokeStyle = si === 0 ? FM.C.MINT : FM.C.BLUE; ctx.lineWidth = 1.6; ctx.beginPath();
        s.xs.forEach(function (x, i) { if (i === 0) ctx.moveTo(X(x), Y(s.ys[i])); else ctx.lineTo(X(x), Y(s.ys[i])); });
        ctx.stroke();
      } else {
        s.xs.forEach(function (x, i) {
          var g = s.labels ? (s.labels[i] | 0) : si;
          ctx.fillStyle = GROUPC[((g % GROUPC.length) + GROUPC.length) % GROUPC.length];
          ctx.globalAlpha = 0.85;
          ctx.beginPath(); ctx.arc(X(x), Y(s.ys[i]), 3, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        });
      }
    });
  }

  function toArr(v) {
    if (v && typeof v.toJs === "function") { var a = v.toJs(); try { v.destroy(); } catch (e) {} return Array.from(a); }
    return Array.from(v || []);
  }

  /* ---------- cell RUN wiring (unchanged contract) ---------- */
  function wire(cell) {
    var src = cell.querySelector(".py-src");
    var runBtn = cell.querySelector(".py-run");
    var out = cell.querySelector(".py-out");
    var plot = cell.querySelector(".py-plot");
    var status = cell.querySelector(".py-status");
    if (!src || !runBtn) return;
    var running = false;
    runBtn.addEventListener("click", function () {
      if (running) return;
      running = true;
      runBtn.textContent = "RUNNING…";
      out.hidden = false; out.textContent = "";
      var plots = [];
      loadEngine().then(function (py) {
        if (status) status.textContent = "EXECUTING";
        var stdout = [];
        py.setStdout({ batched: function (line) { stdout.push(line); } });
        py.setStderr({ batched: function (line) { stdout.push(line); } });
        py.globals.set("plot_xy", function (xs, ys) { plots.push({ kind: "line", xs: toArr(xs), ys: toArr(ys) }); });
        py.globals.set("plot_scatter", function (xs, ys, labels) {
          plots.push({ kind: "scatter", xs: toArr(xs), ys: toArr(ys), labels: labels !== undefined ? toArr(labels) : null });
        });
        return py.runPythonAsync(src.textContent).then(function (ret) {
          var text = stdout.join("\n");
          if (ret !== undefined && ret !== null && String(ret) !== "undefined") text += (text ? "\n" : "") + String(ret);
          out.textContent = text || "(no output — add a print())";
          out.style.color = "";
          if (plots.length) { plot.hidden = false; drawPlot(plot, plots); } else { plot.hidden = true; }
          if (status) status.textContent = "OK";
        });
      }).catch(function (err) {
        out.hidden = false;
        out.textContent = String(err).split("\n").slice(-8).join("\n");
        out.style.color = "#ff4136";
        if (status) status.textContent = "ERROR";
      }).finally(function () { running = false; runBtn.textContent = "RUN ▶"; });
    });
  }

  /* ---------- titles ---------- */
  function titleFor(cell, i) {
    var explicit = cell.getAttribute("data-title");
    if (explicit) return explicit;
    var sec = cell.closest("section");
    var node = cell;
    while (node && node.previousElementSibling) {
      node = node.previousElementSibling;
      if (/^H[23]$/.test(node.tagName)) return node.textContent.replace(/\s+/g, " ").trim();
    }
    if (sec) {
      var h2 = sec.querySelector("h2");
      if (h2) return h2.textContent.replace(/\s+/g, " ").trim();
    }
    return "Python cell " + (i + 1);
  }
  function commentLine(cell) {
    var src = cell.querySelector(".py-src");
    if (!src) return "";
    var m = src.textContent.match(/#\s*(.+)/);
    return m ? m[1].trim().slice(0, 64) : "runnable numpy — edit freely";
  }

  /* ---------- register cells into the shared dock (desktop) ----------
     Each cell becomes a chip in the prose; clicking the chip opens the
     dock to that cell's tab. The dock is NEVER auto-opened. */
  function buildChips(cells) {
    cells.forEach(function (cell, i) {
      var title = titleFor(cell, i);
      var chip = document.createElement("div");
      chip.className = "py-chip";
      chip.innerHTML =
        "<span class='pc-icon'>PY " + String(i + 1).padStart(2, "0") + "</span>" +
        "<span class='pc-title'><b>" + title + "</b><span># " + commentLine(cell) + "</span></span>" +
        "<span class='pc-cta'>OPEN IN LAB ▸</span>";
      cell.parentNode.insertBefore(chip, cell);   // chip takes the cell's place in flow
      var key = window.AIEDock.registerCode(cell, title); // dock moves the cell into the panel
      chip.addEventListener("click", function () { window.AIEDock.show(key); });
    });
  }

  /* ---------- inline fallback (narrow screens) ---------- */
  function buildInline(cells) {
    cells.forEach(function (cell, i) {
      var chip = document.createElement("div");
      chip.className = "py-chip";
      chip.innerHTML =
        "<span class='pc-icon'>PY " + String(i + 1).padStart(2, "0") + "</span>" +
        "<span class='pc-title'><b>" + titleFor(cell, i) + "</b><span># " + commentLine(cell) + "</span></span>" +
        "<span class='pc-cta'>EXPAND ▾</span>";
      cell.parentNode.insertBefore(chip, cell);
      cell.style.display = "none";
      chip.addEventListener("click", function () {
        var openNow = cell.style.display === "none";
        cell.style.display = openNow ? "block" : "none";
        chip.classList.toggle("expanded", openNow);
        chip.querySelector(".pc-cta").textContent = openNow ? "COLLAPSE ▴" : "EXPAND ▾";
      });
    });
  }

  function boot() {
    var cells = Array.prototype.slice.call(document.querySelectorAll(".pycell[data-py]"));
    if (!cells.length) return;
    cells.forEach(function (c) { c.classList.add("wired"); });
    cells.forEach(wire);
    if (DESKTOP && window.AIEDock) buildChips(cells); else buildInline(cells);
    /* docking the cells collapses ~400px each out of the prose flow —
       scroll-trigger positions measured before this are stale */
    if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 60);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
