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
