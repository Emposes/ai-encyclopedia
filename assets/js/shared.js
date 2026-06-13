/* ============================================================
   LLM FIELD MANUAL — shared behaviors
   GSAP scroll choreography · scrollspy · KaTeX · SVG draw-ins
   All effects are progressive enhancements: content renders
   fully without JS, then motion is layered on top.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- FM: shared helper API for chapter-inline scripts ---------- */
  window.FM = {
    setupCanvas: function (canvas, cssH) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth || canvas.parentElement.clientWidth;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + "px";
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx: ctx, w: w, h: cssH };
    },
    softmax: function (logits, T) {
      T = T || 1;
      var m = -Infinity, i, s = 0, out = [];
      for (i = 0; i < logits.length; i++) m = Math.max(m, logits[i] / T);
      for (i = 0; i < logits.length; i++) { out.push(Math.exp(logits[i] / T - m)); s += out[i]; }
      for (i = 0; i < logits.length; i++) out[i] /= s;
      return out;
    },
    mulberry32: function (seed) {
      return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    siFormat: function (x, digits) {
      digits = digits === undefined ? 1 : digits;
      var u = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
      for (var i = 0; i < u.length; i++) if (Math.abs(x) >= u[i][0]) return (x / u[i][0]).toFixed(digits) + u[i][1];
      return x.toFixed(digits);
    },
    C: {
      MINT: "#a6f2cc", DEEP: "#2b5945", BLUE: "#4e8af7", RED: "#ff4136",
      HAIR: "#2f3234", MUT: "#636363", SEC: "#9b9b9b", BRIGHT: "#ffffff",
      MONO: "10px ui-monospace, SF Mono, Menlo, monospace"
    }
  };

  /* ---------- AIEDock: the right-side context dock (code + reference) ----------
     One panel hosts BOTH runnable code cells (tabs) and the detailed
     definition of any clicked glossary term. Opens only on demand — never
     auto-opens. Desktop only (mobile keeps inline cells + hover tooltips). */
  window.AIEDock = (function () {
    var panel, tabsEl, bodyEl, titleEl, hintEl, built = false;
    var tabs = [], codeN = 0;
    var DESKTOP = window.matchMedia("(min-width: 60em)").matches;

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }
    function refreshTriggers() {
      if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 350);
    }
    function ensure() {
      if (built) return;
      built = true;
      panel = document.createElement("aside");
      panel.className = "lab-panel";
      panel.setAttribute("aria-label", "Reference and code dock");
      panel.innerHTML =
        "<div class='lab-head'><span class='lh-dot'></span>" +
        "<span class='lh-title' id='aiedock-title'>REFERENCE</span>" +
        "<span class='py-status' style='font-family:ui-monospace,Menlo,monospace;font-size:9px;color:#636363;letter-spacing:.1em;'></span>" +
        "<button class='lh-close' id='aiedock-close'>ESC ✕</button></div>" +
        "<div class='lab-tabs' id='aiedock-tabs'></div>" +
        "<div class='lab-body' id='aiedock-body'></div>" +
        "<div class='lab-hint' id='aiedock-hint'></div>";
      document.body.appendChild(panel);
      tabsEl = panel.querySelector("#aiedock-tabs");
      bodyEl = panel.querySelector("#aiedock-body");
      titleEl = panel.querySelector("#aiedock-title");
      hintEl = panel.querySelector("#aiedock-hint");
      panel.querySelector("#aiedock-close").addEventListener("click", close);
      document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") close(); });
    }
    function open() { ensure(); panel.classList.add("open"); if (DESKTOP) document.body.classList.add("lab-open"); refreshTriggers(); }
    function close() { if (!panel) return; panel.classList.remove("open"); document.body.classList.remove("lab-open"); refreshTriggers(); }
    function activate(key) {
      tabsEl.style.display = tabs.length > 1 ? "flex" : "none";
      tabs.forEach(function (t) {
        var on = t.key === key;
        t.paneEl.style.display = on ? "block" : "none";
        t.tabEl.classList.toggle("on", on);
        if (on) { titleEl.textContent = t.title; hintEl.textContent = t.hint; }
      });
    }
    function find(key) { for (var i = 0; i < tabs.length; i++) if (tabs[i].key === key) return tabs[i]; return null; }
    function addTab(key, label, title, hint) {
      ensure();
      var tabEl = document.createElement("button");
      tabEl.className = "lab-tab"; tabEl.textContent = label;
      tabEl.addEventListener("click", function () { activate(key); });
      tabsEl.appendChild(tabEl);
      var paneEl = document.createElement("div");
      paneEl.style.display = "none";
      bodyEl.appendChild(paneEl);
      var t = { key: key, tabEl: tabEl, paneEl: paneEl, title: title, hint: hint };
      tabs.push(t);
      return t;
    }
    function registerCode(cellEl, title) {
      var key = "code" + codeN++;
      var t = addTab(key, "CELL " + String(codeN).padStart(2, "0"),
        "THE LAB — PYTHON",
        "EDIT THE CODE FREELY — IT RUNS IN YOUR BROWSER (PYODIDE/WASM). BREAK IT ON PURPOSE.");
      t.tabEl.title = title || "";
      t.paneEl.appendChild(cellEl);
      cellEl.style.display = "block";
      return key;
    }
    function show(key) { open(); activate(key); }
    function openReference(opts) {
      ensure();
      var t = find("ref");
      if (!t) t = addTab("ref", "DEFINITION", "DEFINITION",
        "CLICK A RELATED TERM TO KEEP EXPLORING · ESC TO CLOSE");
      var rel = (opts.related || []).map(function (r) {
        return "<button class='dock-rel' data-term='" + esc(r) + "'>" + esc(r) + "</button>";
      }).join("");
      t.paneEl.innerHTML =
        "<div class='dock-ref'>" +
        "<div class='dr-term'>" + esc(opts.term) + "</div>" +
        "<div class='dr-def'>" + esc(opts.def) + "</div>" +
        (rel ? "<div class='dr-rel-label'>RELATED TERMS</div><div class='dr-rel'>" + rel + "</div>" : "") +
        "</div>";
      if (opts.onRelated) {
        t.paneEl.querySelectorAll(".dock-rel").forEach(function (b) {
          b.addEventListener("click", function () { opts.onRelated(b.getAttribute("data-term")); });
        });
      }
      show("ref");
    }
    return { open: open, close: close, show: show, registerCode: registerCode, openReference: openReference, desktop: DESKTOP };
  })();

  /* ---------- reading progress (localStorage, no accounts) ---------- */
  function initProgress() {
    var path = location.pathname.replace(/\.html$/, "");
    var isChapter = /\/(chapters|ml|prompting|agents)\//.test(path);
    if (!isChapter) return;
    var marked = false;
    window.addEventListener("scroll", function () {
      if (marked) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.7) {
        marked = true;
        try {
          var p = JSON.parse(localStorage.getItem("aie-progress") || "{}");
          p[path] = 1;
          localStorage.setItem("aie-progress", JSON.stringify(p));
        } catch (e) { /* private mode */ }
      }
    }, { passive: true });
  }
  initProgress();

  /* ---------- KaTeX auto-render ---------- */
  function renderMath() {
    if (typeof renderMathInElement !== "function") return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
    /* math rendering changes content heights: fix anchor position
       and recompute scroll-trigger positions */
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    if (location.hash) {
      try {
        var target = document.querySelector(location.hash);
        if (target) target.scrollIntoView();
      } catch (e) { /* invalid selector in hash — ignore */ }
    }
    /* glossary wraps terms only after math is settled */
    if (typeof window.__glossaryScan === "function") window.__glossaryScan();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMath);
  } else {
    renderMath();
  }
  /* KaTeX loads deferred; the auto-render script calls this on load */
  window.__manualMathReady = renderMath;

  /* ---------- GSAP setup ---------- */
  function initMotion() {
    if (typeof gsap === "undefined") return;
    if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);
    if (reduced) return;

    /* progress bar */
    var fill = document.querySelector(".progress-fill");
    if (fill && typeof ScrollTrigger !== "undefined") {
      gsap.to(fill, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
      });
      gsap.set(fill, { scaleX: 0 });
    }

    /* hero entrance (chapter pages) */
    var hero = document.querySelector(".chapter-hero");
    if (hero) {
      var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(hero.querySelector(".ch-index"), { y: 16, opacity: 0, duration: 0.6 }, 0.05)
        .from(hero.querySelector("h1"), { y: 48, opacity: 0, duration: 0.9 }, 0.12)
        .from(hero.querySelector(".lede"), { y: 24, opacity: 0, duration: 0.7 }, 0.34);
      var meta = hero.querySelector(".ch-meta");
      if (meta) tl.from(meta.children, { y: 16, opacity: 0, duration: 0.5, stagger: 0.07 }, 0.5);
    }

    /* cover entrance (index page) */
    var cover = document.querySelector(".cover");
    if (cover) {
      var lines = cover.querySelectorAll("h1 .line > span");
      var ctl = gsap.timeline({ defaults: { ease: "power4.out" } });
      ctl.from(cover.querySelector(".cov-eyebrow"), { y: 14, opacity: 0, duration: 0.6 }, 0.1)
         .from(lines, { yPercent: 110, duration: 1.0, stagger: 0.1 }, 0.2)
         .from(cover.querySelector(".cov-sub"), { y: 20, opacity: 0, duration: 0.7 }, 0.7);
      var cmeta = cover.querySelector(".cov-meta");
      if (cmeta) ctl.from(cmeta.children, { y: 14, opacity: 0, duration: 0.5, stagger: 0.06 }, 0.85);
      var cue = document.querySelector(".scroll-cue");
      if (cue) ctl.from(cue, { opacity: 0, duration: 0.8 }, 1.1);
    }

    /* generic scroll reveals */
    if (typeof ScrollTrigger !== "undefined") {
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        gsap.from(el, {
          y: 36, opacity: 0, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 86%" }
        });
      });

      document.querySelectorAll("[data-reveal-stagger]").forEach(function (el) {
        gsap.from(el.children, {
          y: 28, opacity: 0, duration: 0.7, ease: "power2.out", stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 84%" }
        });
      });

      /* section headers: hairline + number tick-in */
      document.querySelectorAll(".sec-head").forEach(function (el) {
        gsap.from(el, {
          x: -24, opacity: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        });
      });

      /* SVG stroke draw-ins: any path/line/polyline marked data-draw */
      document.querySelectorAll("svg [data-draw]").forEach(function (path) {
        var len;
        try { len = path.getTotalLength(); } catch (e) { return; }
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut",
          scrollTrigger: { trigger: path.closest(".figure") || path, start: "top 82%" }
        });
      });

      /* fade-in for SVG nodes marked data-pop (boxes, labels) */
      document.querySelectorAll("svg [data-pop]").forEach(function (node, i) {
        gsap.from(node, {
          opacity: 0, y: 8, duration: 0.5, ease: "power2.out", delay: (i % 8) * 0.06,
          scrollTrigger: { trigger: node.closest(".figure") || node, start: "top 82%" }
        });
      });

      /* counters */
      document.querySelectorAll("[data-count-to]").forEach(function (el) {
        var target = parseFloat(el.getAttribute("data-count-to"));
        var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.6, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
          onUpdate: function () {
            el.textContent = obj.v.toLocaleString("en-US", {
              minimumFractionDigits: decimals, maximumFractionDigits: decimals
            });
          }
        });
      });
    }
  }

  /* ---------- scrollspy for side nav ---------- */
  function initSpy() {
    var links = document.querySelectorAll(".side-nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });

    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          if (map[id] && current !== map[id]) {
            if (current) current.classList.remove("active");
            current = map[id];
            current.classList.add("active");
          }
        }
      });
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });

    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* ---------- search is universal: self-heal if a page forgot the tag ----------
     Runs after full parse so an explicit tag later in the document is seen
     (running early caused a double-load → doubled ⌘K button). search.js is
     also idempotent now, as a second line of defense. */
  var sharedSrc = document.currentScript && document.currentScript.src;
  function ensureSearch() {
    if (document.querySelector('script[src*="search.js"]')) return;
    var me = sharedSrc;
    if (!me) {
      var tags = document.querySelectorAll('script[src*="shared.js"]');
      if (tags.length) me = tags[tags.length - 1].src;
    }
    if (!me) return;
    var s = document.createElement("script");
    s.src = me.replace(/shared\.js/, "search.js");
    document.head.appendChild(s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureSearch);
  else ensureSearch();

  /* ---------- instrument permalinks ---------- */
  function initPermalinks() {
    document.querySelectorAll(".widget[id] .w-head").forEach(function (head) {
      var id = head.closest(".widget").id;
      var btn = document.createElement("button");
      btn.className = "w-link";
      btn.title = "Copy direct link to this instrument";
      btn.textContent = "¶";
      btn.addEventListener("click", function () {
        var url = location.origin + location.pathname + "#" + id;
        function flash() { btn.textContent = "COPIED"; setTimeout(function () { btn.textContent = "¶"; }, 1200); }
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(flash, flash);
        else { location.hash = id; flash(); }
      });
      head.appendChild(btn);
    });
  }

  /* ---------- equation worked-example toggles ---------- */
  function initEqExamples() {
    document.querySelectorAll(".eq-x-toggle").forEach(function (btn) {
      var body = btn.parentElement.querySelector(".eq-x-body");
      if (!body) return;
      btn.addEventListener("click", function () {
        var show = body.hidden;
        body.hidden = !show;
        btn.textContent = btn.textContent.replace(show ? "▾" : "▴", show ? "▴" : "▾");
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initMotion();
    initSpy();
    initEqExamples();
    initPermalinks();
    /* belt-and-braces: fonts, KaTeX and the Lab all shift layout after
       triggers are measured — one final refresh once everything settles */
    window.addEventListener("load", function () {
      if (typeof ScrollTrigger !== "undefined") {
        setTimeout(function () { ScrollTrigger.refresh(); }, 400);
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
