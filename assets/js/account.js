/* ============================================================
   AI ENCYCLOPEDIA — topbar account control.
   Shows SIGN IN (Google) when logged out, or the account name +
   SIGN OUT when logged in. Dormant (renders nothing) until
   Supabase is configured. Injected by shared.js.
   ============================================================ */
(function () {
  "use strict";
  if (window.__AIE_ACCOUNT__) return;
  window.__AIE_ACCOUNT__ = true;

  function init() {
    var auth = window.AIE_AUTH;
    if (!auth || !auth.enabled) return; // local mode: no account UI
    var bar = document.querySelector(".topbar");
    if (!bar || document.getElementById("aie-acct")) return;

    var st = document.createElement("style");
    st.textContent = "#aie-acct{font-family:var(--font-mono,monospace);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-secondary,#9b9b9b);cursor:pointer;display:inline-flex;gap:8px;align-items:center}#aie-acct a{color:var(--text-muted,#636363);text-decoration:none}#aie-acct a:hover,#aie-acct:hover{color:var(--text-bright,#fff)}";
    document.head.appendChild(st);

    var el = document.createElement("span");
    el.id = "aie-acct"; el.className = "bar-link";
    bar.appendChild(el);

    function render(u) {
      if (u) {
        var name = (u.email || "account").split("@")[0];
        el.innerHTML = "<span>" + name + "</span> <a id='aie-signout'>SIGN OUT</a>";
        el.onclick = null;
        var so = document.getElementById("aie-signout");
        if (so) so.onclick = function (e) { e.stopPropagation(); auth.signOut(); };
      } else {
        el.innerHTML = "SIGN IN";
        el.onclick = function () { auth.signInGoogle(); };
      }
    }
    auth.onChange(render);
  }

  if (window.AIE_AUTH) init();
  else {
    var n = 0, t = setInterval(function () { if (window.AIE_AUTH || ++n > 30) { clearInterval(t); init(); } }, 150);
  }
})();
