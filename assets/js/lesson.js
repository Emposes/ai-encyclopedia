/* ============================================================
   AI ENCYCLOPEDIA — lesson player (Learn mode)
   A VIEW LAYER over the existing chapter HTML — no content rewrite.
   Each <section class="section"> becomes a lesson: its interactive
   artifacts (video · demo · exercise · code · diagram) go in a left
   "stage" with a toggle; its prose/equations go in the right panel.
   Lessons are paged left→right. "Read as one page" reloads into the
   normal scrollable document (robust: a reload resets the DOM, so we
   never have to restore moved nodes).
   Default view = learn. Per-concept videos come from window.AIE_VIDEOS.
   ============================================================ */
(function () {
  "use strict";

  var main = document.querySelector(".chapter-grid main");
  if (!main) return;
  var sections = Array.prototype.slice.call(main.querySelectorAll("section.section"))
    .filter(function (s) { return s.id !== "refs"; });
  if (sections.length < 2) return;

  var VIEW_KEY = "aie-view";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function getView() { try { return localStorage.getItem(VIEW_KEY) || "learn"; } catch (e) { return "learn"; } }
  function setView(v) { try { localStorage.setItem(VIEW_KEY, v); } catch (e) {} }

  /* topbar toggle (works in both modes) */
  (function injectToggle() {
    var bar = document.querySelector(".topbar");
    if (!bar || bar.querySelector(".view-switch")) return;
    var learn = getView() !== "read";
    var btn = document.createElement("button");
    btn.className = "bar-link view-switch";
    btn.style.cssText = "background:none;cursor:pointer;font-family:inherit;";
    btn.textContent = learn ? "⇄ READ" : "⇄ LEARN";
    btn.title = learn ? "Read as one scrollable page" : "Switch to guided lessons";
    btn.addEventListener("click", function () { setView(learn ? "read" : "learn"); location.reload(); });
    var primary = bar.querySelector(".bar-link.primary");
    if (primary) bar.insertBefore(btn, primary); else bar.appendChild(btn);
  })();

  if (getView() === "read") return;   // leave the normal document untouched

  /* run AFTER artifact-wiring scripts (exercises.js, pyrunner.js, inline
     instrument IIFEs) so their nodes are wired before we relocate them */
  function go() { try { build(); } catch (e) { if (window.console) console.warn("lesson player fell back to read:", e); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();

  function chapterKey() {
    var m = location.pathname.replace(/^\//, "").replace(/\.html$/, "");
    return m;
  }
  function videoFor(secId) {
    var reg = window.AIE_VIDEOS || {};
    var ch = reg[chapterKey()] || {};
    return ch[secId] || null;
  }

  function build() {
    document.body.classList.add("learn-mode");
    var chapTitle = (document.querySelector(".chapter-hero h1") || {}).textContent || "";
    var chIndex = (document.querySelector(".chapter-hero .ch-index") || {}).textContent || "";

    /* assemble lesson records, detaching artifact + text nodes */
    var lessons = sections.map(function (sec) {
      var title = (sec.querySelector(".sec-head h2") || {}).textContent || "Lesson";
      var secId = sec.id || "";
      var tabs = [];

      var vid = videoFor(secId);
      if (vid) {
        var vpane = document.createElement("div");
        vpane.className = "lv-pane lv-pane-media";
        vpane.innerHTML = "<div class='lv-video-wrap'><video class='lv-video' controls preload='metadata' " +
          "playsinline src='" + vid + "'></video></div>";
        tabs.push({ kind: "video", label: "Watch", pane: vpane });
      }
      collect(sec, ".widget", "demo", "Demo", tabs);
      collect(sec, ".exercise", "exercise", "Exercise", tabs);
      collect(sec, ".figure", "figure", "Diagram", tabs);
      collect(sec, ".pycell", "code", "Code", tabs);

      if (!tabs.length) {
        var card = document.createElement("div");
        card.className = "lv-pane lv-pane-media";
        card.innerHTML = "<div class='lv-video-pending'><span class='vp-dot'></span>" +
          "<span class='vp-t'>" + esc(title) + "</span>" +
          "<span class='vp-t' style='color:var(--text-muted)'>concept film in production</span></div>";
        tabs.push({ kind: "card", label: "Overview", pane: card });
      }
      return { title: title, secId: secId, tabs: tabs, panel: sec };  // sec is now text-only
    });

    /* preferred default stage order */
    var ORDER = { video: 0, demo: 1, exercise: 2, figure: 3, code: 4, card: 5 };
    lessons.forEach(function (l) { l.tabs.sort(function (a, b) { return ORDER[a.kind] - ORDER[b.kind]; }); });

    /* build the view shell */
    var view = document.createElement("div");
    view.className = "lesson-view";
    view.innerHTML =
      "<div class='lv-top'><span class='le' id='lv-eyebrow'></span><span class='lt' id='lv-ctx'></span>" +
      "<span class='spacer'></span><button class='view-toggle' id='lv-read'>Read as one page</button></div>" +
      "<div class='lv-split'><div class='lv-stage'><div class='lv-stage-tabs' id='lv-tabs'></div>" +
      "<div class='lv-stage-hint' id='lv-stagehint'></div>" +
      "<div class='lv-stage-body' id='lv-stagebody'></div>" +
      "<div class='lv-stage-foot' id='lv-stagefoot'></div></div>" +
      "<div class='lv-panel' id='lv-panel'></div></div>" +
      "<div class='lv-rail'><button class='nav' id='lv-prev'>Prev</button>" +
      "<div class='dots' id='lv-dots'></div><button class='nav next' id='lv-next'>Next</button></div>";
    var shell = main.closest(".shell") || main.parentNode;
    shell.parentNode.insertBefore(view, shell.nextSibling);

    var tabsEl = view.querySelector("#lv-tabs");
    var bodyEl = view.querySelector("#lv-stagebody");
    var panelEl = view.querySelector("#lv-panel");
    var dotsEl = view.querySelector("#lv-dots");
    var prevB = view.querySelector("#lv-prev");
    var nextB = view.querySelector("#lv-next");
    view.querySelector("#lv-read").addEventListener("click", function () { setView("read"); location.reload(); });

    lessons.forEach(function (l, i) {
      var d = document.createElement("span");
      d.className = "dot"; d.title = l.title;
      d.addEventListener("click", function () { show(i); });
      dotsEl.appendChild(d);
    });

    var cur = -1;
    function show(i) {
      if (i < 0 || i >= lessons.length) return;
      cur = i;
      var l = lessons[i];
      view.querySelector("#lv-eyebrow").textContent = "— Lesson " + (i + 1) + " / " + lessons.length;
      view.querySelector("#lv-ctx").textContent = l.title;
      /* stage tabs + panes — rendered as a Watch → Play → Try progression */
      tabsEl.innerHTML = ""; bodyEl.innerHTML = "";
      l._visited = {};
      var CORE = { video: 1, demo: 1, exercise: 1 };
      l.tabs.forEach(function (t, ti) {
        var b = document.createElement("button");
        b.textContent = t.label;
        b.addEventListener("click", function () { activate(l, ti); });
        tabsEl.appendChild(b);
        bodyEl.appendChild(t.pane);
        t._btn = b;
      });
      var coreCount = l.tabs.filter(function (t) { return CORE[t.kind]; }).length;
      var hintEl = view.querySelector("#lv-stagehint");
      hintEl.style.display = coreCount >= 2 ? "block" : "none";
      hintEl.textContent = "Use the tabs to switch between the video, demo, and exercise.";
      activate(l, 0);
      /* text panel */
      panelEl.innerHTML = "";
      panelEl.appendChild(l.panel);
      /* dots + nav */
      Array.prototype.forEach.call(dotsEl.children, function (d, di) {
        d.classList.toggle("on", di === i);
        d.classList.toggle("done", di < i);
      });
      prevB.disabled = i === 0;
      nextB.textContent = i === lessons.length - 1 ? "Finish" : "Next";
      markProgress(i, lessons.length);
      /* canvases re-fit to the stage width; let the DOM settle first */
      setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 30);
      if (!reduced) { view.querySelector(".lv-split").scrollIntoView({ block: "nearest" }); }
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
    function activate(l, ti) {
      l._visited[ti] = true;
      l.tabs.forEach(function (t, k) {
        t.pane.classList.toggle("on", k === ti);
        if (t._btn) {
          t._btn.classList.toggle("on", k === ti);
          t._btn.classList.toggle("visited", !!l._visited[k] && k !== ti);
          t._btn.classList.remove("lv-next");
        }
      });
      /* the contextual "next step" button — drives Watch → Play → Try */
      var foot = view.querySelector("#lv-stagefoot");
      var nextTab = ti + 1 < l.tabs.length ? l.tabs[ti + 1] : null;
      if (nextTab && nextTab._btn && !l._visited[ti + 1]) nextTab._btn.classList.add("lv-next");
      var verb = { video: "Video", demo: "Demo", exercise: "Exercise", figure: "Diagram", code: "Code" };
      if (nextTab) {
        foot.innerHTML = "<button class='lv-nextstep'>Next: " + esc(verb[nextTab.kind] || nextTab.label) + "</button>";
        foot.querySelector(".lv-nextstep").addEventListener("click", function () { activate(l, ti + 1); });
      } else if (cur < lessons.length - 1) {
        foot.innerHTML = "<button class='lv-nextstep'>Next lesson: " + esc(lessons[cur + 1].title.slice(0, 32)) + "</button>";
        foot.querySelector(".lv-nextstep").addEventListener("click", function () { show(cur + 1); });
      } else {
        foot.innerHTML = "<button class='lv-nextstep'>Finish chapter</button>";
        foot.querySelector(".lv-nextstep").addEventListener("click", function () { setView("read"); location.reload(); });
      }
      setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 30);
    }

    prevB.addEventListener("click", function () { show(cur - 1); });
    nextB.addEventListener("click", function () {
      if (cur === lessons.length - 1) { setView("read"); location.reload(); }
      else show(cur + 1);
    });

    /* keyboard ← → (not while typing) */
    document.addEventListener("keydown", function (e) {
      var t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); show(Math.min(cur + 1, lessons.length - 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(Math.max(cur - 1, 0)); }
    });
    /* swipe on touch */
    var sx = 0, sy = 0;
    view.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    view.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { show(cur + (dx < 0 ? 1 : -1)); }
    }, { passive: true });

    /* start at the lesson named in the hash (#sN) if any */
    var startIdx = 0;
    if (location.hash) {
      var hid = location.hash.slice(1);
      lessons.forEach(function (l, i) { if (l.secId === hid) startIdx = i; });
    }
    show(startIdx);
  }

  function collect(sec, sel, kind, label, tabs) {
    var els = Array.prototype.slice.call(sec.querySelectorAll(sel));
    els.forEach(function (el, i) {
      var pane = document.createElement("div");
      pane.className = "lv-pane";
      el.parentNode.removeChild(el);
      pane.appendChild(el);
      tabs.push({ kind: kind, label: els.length > 1 ? label + " " + (i + 1) : label, pane: pane });
    });
  }
  function markProgress(i, n) {
    if (i < n - 1) return;
    try {
      var p = JSON.parse(localStorage.getItem("aie-progress") || "{}");
      p["/" + chapterKey()] = 1; localStorage.setItem("aie-progress", JSON.stringify(p));
    } catch (e) {}
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
})();
