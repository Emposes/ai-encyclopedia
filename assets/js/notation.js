/* ============================================================
   AI ENCYCLOPEDIA — global Notation reference.
   A modal available on every page. Open with "?" (Shift+/),
   close with Esc or a click outside. Renders its math with
   KaTeX, lazy-loading KaTeX on pages that don't already have it.
   Injected by shared.js.
   ============================================================ */
(function () {
  "use strict";
  if (window.__AIE_NOTATION__) return;
  window.__AIE_NOTATION__ = true;

  var ROWS = [
    ["x, y, \\hat{y}", "Input; true target; model prediction."],
    ["\\theta, w, b", "Learnable parameters; weights; biases. \\(\\pi_\\theta\\) is the policy they define."],
    ["\\mathcal{L}, \\eta", "Loss function; learning rate."],
    ["\\nabla_\\theta \\mathcal{L}", "Gradient of the loss with respect to the parameters: the direction of steepest increase."],
    ["x_t,\\; x_{<t}", "Token at position \\(t\\); all tokens before it (the context)."],
    ["V, d_{\\text{model}}", "Vocabulary (size \\(|V|\\)); width of the residual stream."],
    ["L,\\; h,\\; d_k", "Layers; attention heads; per-head dimension \\(d_k = d_{\\text{model}}/h\\)."],
    ["N,\\; D,\\; C", "Parameter count; training tokens; training compute in FLOPs (\\(C \\approx 6ND\\))."],
    ["\\mu, \\sigma, \\sigma^2", "Mean; standard deviation; variance of a distribution."],
    ["\\mathbb{E},\\; \\mathrm{Var}", "Expectation; variance."],
    ["\\mathrm{KL},\\; H", "Kullback–Leibler divergence; entropy."],
    ["Q, K, V", "Query, key, value matrices inside attention."],
    ["\\sigma,\\; \\odot", "Sigmoid / nonlinearity; element-wise product."],
    ["\\hat{\\beta},\\; R^2", "Estimated coefficients; coefficient of determination (regression)."],
    ["\\Delta,\\; \\Gamma,\\; \\nu", "Option Greeks: delta, gamma, vega (quant finance)."]
  ];

  var css = ""
    + "#aie-not-ov{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.72);display:none;align-items:flex-start;justify-content:center;padding:8vh 16px}"
    + "#aie-not-ov.on{display:flex}"
    + "#aie-not{width:760px;max-width:94vw;max-height:80vh;overflow:auto;background:var(--panel,#1e2124);border:1px solid var(--hairline,#2f3234);border-radius:4px;padding:28px 32px}"
    + "#aie-not .nt-head{display:flex;align-items:baseline;gap:14px;margin-bottom:18px}"
    + "#aie-not .nt-eye{font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--text-muted,#636363)}"
    + "#aie-not h2{font-family:var(--font-display,inherit);font-size:24px;color:var(--text-bright,#fff);margin:0}"
    + "#aie-not .nt-close{margin-left:auto;cursor:pointer;background:transparent;border:1px solid var(--hairline,#2f3234);border-radius:2px;color:var(--text-secondary,#9b9b9b);font-family:var(--font-mono,monospace);font-size:11px;padding:6px 10px}"
    + "#aie-not table{width:100%;border-collapse:collapse}"
    + "#aie-not td{padding:11px 0;border-bottom:1px solid var(--hairline,#2f3234);font-size:14px;color:var(--text,#e5e5e5);vertical-align:top}"
    + "#aie-not td.sym{width:190px;color:var(--text-bright,#fff)}"
    + "#aie-not .nt-foot{margin-top:16px;font-family:var(--font-mono,monospace);font-size:11px;color:var(--text-muted,#636363)}";
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  var ov = document.createElement("div"); ov.id = "aie-not-ov";
  var rowsHtml = ROWS.map(function (r) { return '<tr><td class="sym">\\(' + r[0] + '\\)</td><td>' + r[1] + "</td></tr>"; }).join("");
  ov.innerHTML =
    '<div id="aie-not" role="dialog" aria-label="Notation">' +
    '<div class="nt-head"><span class="nt-eye">Reference</span><h2>Notation</h2><button class="nt-close">Esc</button></div>' +
    "<table><tbody>" + rowsHtml + "</tbody></table>" +
    '<div class="nt-foot">Press ? anywhere to open this. The same symbols are used across every track.</div></div>';
  document.body.appendChild(ov);

  var rendered = false;
  function ensureKatex(cb) {
    if (window.renderMathInElement) return cb();
    if (!document.querySelector('link[href*="katex"]')) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"; document.head.appendChild(l);
    }
    var s1 = document.createElement("script"); s1.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
    s1.onload = function () { var s2 = document.createElement("script"); s2.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"; s2.onload = cb; document.head.appendChild(s2); };
    document.head.appendChild(s1);
  }
  function open() {
    ov.classList.add("on");
    if (!rendered) ensureKatex(function () {
      try { window.renderMathInElement(document.getElementById("aie-not"), { delimiters: [{ left: "\\(", right: "\\)", display: false }, { left: "$$", right: "$$", display: true }], throwOnError: false }); rendered = true; } catch (e) {}
    });
  }
  function close() { ov.classList.remove("on"); }

  ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  ov.querySelector(".nt-close").addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    var el = document.activeElement, tag = el && el.tagName;
    var typing = tag === "INPUT" || tag === "TEXTAREA" || (el && el.isContentEditable);
    if (e.key === "Escape") { close(); return; }
    if (e.key === "?" && !typing) { e.preventDefault(); ov.classList.contains("on") ? close() : open(); }
  });
})();
