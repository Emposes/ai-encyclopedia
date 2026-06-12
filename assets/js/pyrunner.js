/* ============================================================
   AI ENCYCLOPEDIA — in-browser Python (Pyodide)
   Enhances every .pycell[data-py]: editable source, RUN button,
   captured stdout, and a plot bridge (plot_xy / plot_scatter)
   rendered onto the cell's canvas. Pyodide + numpy load lazily
   on the first RUN anywhere on the page.
   ============================================================ */
(function () {
  "use strict";

  var PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
  var pyodidePromise = null;

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
          .then(function (py) {
            statusAll("LOADING NUMPY…");
            return py.loadPackage("numpy").then(function () { return py; });
          })
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

    ctx.strokeStyle = FM.C.HAIR; ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, W, H);
    ctx.font = FM.C.MONO; ctx.fillStyle = FM.C.MUT;
    for (var t = 0; t <= 4; t++) {
      var xv = xmin + (xmax - xmin) * t / 4, yv = ymin + (ymax - ymin) * t / 4;
      ctx.textAlign = "center";
      ctx.fillText((+xv.toPrecision(3)).toString(), X(xv), padT + H + 18);
      ctx.textAlign = "right";
      ctx.fillText((+yv.toPrecision(3)).toString(), padL - 6, Y(yv) + 3);
    }
    var GROUPC = [FM.C.MINT, FM.C.BLUE, FM.C.RED, FM.C.SEC, "#d9f0ff", FM.C.DEEP];
    series.forEach(function (s, si) {
      if (s.kind === "line") {
        ctx.strokeStyle = si === 0 ? FM.C.MINT : FM.C.BLUE; ctx.lineWidth = 1.6;
        ctx.beginPath();
        s.xs.forEach(function (x, i) {
          if (i === 0) ctx.moveTo(X(x), Y(s.ys[i])); else ctx.lineTo(X(x), Y(s.ys[i]));
        });
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

  /* ---------- wire cells ---------- */
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
      out.hidden = false;
      out.textContent = "";
      var plots = [];

      loadEngine().then(function (py) {
        if (status) status.textContent = "EXECUTING";
        var stdout = [];
        py.setStdout({ batched: function (line) { stdout.push(line); } });
        py.setStderr({ batched: function (line) { stdout.push(line); } });
        py.globals.set("plot_xy", function (xs, ys) {
          plots.push({ kind: "line", xs: toArr(xs), ys: toArr(ys) });
        });
        py.globals.set("plot_scatter", function (xs, ys, labels) {
          plots.push({ kind: "scatter", xs: toArr(xs), ys: toArr(ys), labels: labels !== undefined ? toArr(labels) : null });
        });
        return py.runPythonAsync(src.textContent).then(function (ret) {
          var text = stdout.join("\n");
          if (ret !== undefined && ret !== null && String(ret) !== "undefined") {
            text += (text ? "\n" : "") + String(ret);
          }
          out.textContent = text || "(no output — add a print())";
          out.style.color = "";
          if (plots.length) { plot.hidden = false; drawPlot(plot, plots); }
          else { plot.hidden = true; }
          if (status) status.textContent = "OK";
        });
      }).catch(function (err) {
        out.hidden = false;
        out.textContent = String(err).split("\n").slice(-8).join("\n");
        out.style.color = "#ff4136";
        if (status) status.textContent = "ERROR";
      }).finally(function () {
        running = false;
        runBtn.textContent = "RUN ▶";
      });
    });
  }

  function boot() { document.querySelectorAll(".pycell[data-py]").forEach(wire); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
