/* ============================================================
   AI ENCYCLOPEDIA — ⌘K search palette
   Injects a SEARCH button into the topbar, binds ⌘K / Ctrl+K,
   and searches /search-index.json (built by scripts/build.mjs).
   ============================================================ */
(function () {
  "use strict";

  var INDEX_URL = "/search-index.json";
  var index = null, overlay = null, input = null, list = null, items = [], sel = 0;

  function fetchIndex() {
    if (index) return Promise.resolve(index);
    return fetch(INDEX_URL).then(function (r) { return r.json(); }).then(function (j) {
      index = j; return j;
    });
  }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "pal-overlay";
    overlay.innerHTML =
      "<div class='pal-box'>" +
      "<div class='pal-head'><input class='pal-input' type='text' placeholder='Search the encyclopedia…' spellcheck='false'/><span class='pal-esc'>ESC</span></div>" +
      "<div class='pal-list'></div>" +
      "<div class='pal-foot'>↑↓ NAVIGATE · ↵ OPEN · 33 PAGES INDEXED</div>" +
      "</div>";
    document.body.appendChild(overlay);
    input = overlay.querySelector(".pal-input");
    list = overlay.querySelector(".pal-list");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    input.addEventListener("input", function () { query(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); go(); }
      else if (e.key === "Escape") close();
    });
  }

  function open() {
    if (!overlay) build();
    overlay.classList.add("show");
    input.value = "";
    input.focus();
    fetchIndex().then(function () { query(""); }).catch(function () {
      list.innerHTML = "<div class='pal-empty'>Index unavailable offline.</div>";
    });
  }
  function close() { if (overlay) overlay.classList.remove("show"); }

  function score(entry, q) {
    var hay = (entry.t + " " + (entry.s || "") + " " + (entry.b || "")).toLowerCase();
    var s = 0;
    q.forEach(function (w) {
      var i = hay.indexOf(w);
      if (i === -1) { s = -1; return; }
      s += entry.t.toLowerCase().indexOf(w) !== -1 ? 30 : (entry.s || "").toLowerCase().indexOf(w) !== -1 ? 18 : 6;
      s += Math.max(0, 8 - i / 40);
    });
    return s;
  }

  function query(raw) {
    if (!index) return;
    var q = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var pool;
    if (!q.length) {
      pool = index.slice(0, 12).map(function (e) { return { e: e, s: 0 }; });
    } else {
      pool = index.map(function (e) { return { e: e, s: score(e, q) }; })
        .filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 14);
    }
    items = pool.map(function (x) { return x.e; });
    sel = 0;
    render();
  }

  function render() {
    if (!items.length) {
      list.innerHTML = "<div class='pal-empty'>No matches. Try a concept name — “rope”, “backprop”, “few-shot”…</div>";
      return;
    }
    list.innerHTML = items.map(function (e, i) {
      return "<a class='pal-item" + (i === sel ? " sel" : "") + "' href='" + e.u + "'>" +
        "<span class='pi-vol'>" + (e.v || "") + "</span>" +
        "<span class='pi-main'><span class='pi-title'>" + e.t + "</span>" +
        (e.s ? "<span class='pi-sec'>" + e.s + "</span>" : "") + "</span>" +
        "<span class='pi-arrow'>→</span></a>";
    }).join("");
    var selEl = list.children[sel];
    if (selEl) selEl.scrollIntoView({ block: "nearest" });
  }

  function move(d) { sel = (sel + d + items.length) % items.length; render(); }
  function go() { if (items[sel]) location.href = items[sel].u; }

  /* topbar button */
  function injectButton() {
    var bar = document.querySelector(".topbar");
    if (!bar) return;
    var spacer = bar.querySelector(".spacer");
    var btn = document.createElement("button");
    btn.className = "bar-link pal-trigger";
    btn.innerHTML = "SEARCH <span class='kbd' style='margin-left:6px;'>⌘K</span>";
    btn.addEventListener("click", open);
    if (spacer && spacer.nextSibling) bar.insertBefore(btn, spacer.nextSibling);
    else bar.appendChild(btn);
  }

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectButton);
  else injectButton();
})();
