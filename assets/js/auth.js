/* ============================================================
   AI ENCYCLOPEDIA — auth + sync (Supabase, Google sign-in).
   Exposes a small global API the rest of the site uses:

     window.AIE_AUTH = {
       enabled,                 // is Supabase configured?
       ready: Promise,          // resolves once the session is known
       user(),                  // current user object or null
       signInGoogle(),          // start Google OAuth
       signOut(),
       onChange(fn),            // fn(user) on auth state change
       getProfile(), saveProfile(patch),   // row in `profiles` (id = user id)
     }

   When unconfigured (aie-config blank) every method is a safe
   no-op and enabled === false, so callers degrade to local mode.
   Loaded site-wide by shared.js, after aie-config.js.
   ============================================================ */
(function () {
  "use strict";
  if (window.AIE_AUTH) return;

  var cfg = window.AIE_CONFIG || {};
  var listeners = [];
  var currentUser = null;
  var sb = null;
  var resolveReady;
  var ready = new Promise(function (r) { resolveReady = r; });

  function emit() { listeners.forEach(function (fn) { try { fn(currentUser); } catch (e) {} }); }

  var API = {
    enabled: !!cfg.enabled,
    ready: ready,
    user: function () { return currentUser; },
    onChange: function (fn) { listeners.push(fn); if (currentUser !== undefined) { try { fn(currentUser); } catch (e) {} } },
    signInGoogle: function () {
      if (!sb) { alert("Sign-in isn't configured on this deployment yet."); return; }
      return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href } });
    },
    signOut: function () { if (sb) return sb.auth.signOut().then(function () { currentUser = null; emit(); }); },
    getProfile: function () {
      if (!sb || !currentUser) return Promise.resolve(null);
      return sb.from("profiles").select("*").eq("id", currentUser.id).maybeSingle().then(function (r) { return r.data; });
    },
    saveProfile: function (patch) {
      if (!sb || !currentUser) return Promise.resolve(null);
      var row = Object.assign({ id: currentUser.id, email: currentUser.email, updated_at: new Date().toISOString() }, patch || {});
      return sb.from("profiles").upsert(row).then(function (r) { return r; });
    }
  };
  window.AIE_AUTH = API;

  if (!cfg.enabled) { currentUser = null; resolveReady(null); return; } // local mode

  // load the vendored Supabase SDK, served from our own origin so there is no
  // flaky third-party CDN in the critical auth/feedback path. The UMD bundle
  // (assets/js/vendor/supabase.js) attaches window.supabase.
  loadSupabase().then(function (lib) {
    sb = lib.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    window.AIE_SB = sb;
    return sb.auth.getSession().then(function (r) {
      currentUser = (r.data && r.data.session && r.data.session.user) || null;
      resolveReady(currentUser); emit();
      sb.auth.onAuthStateChange(function (_evt, session) {
        currentUser = (session && session.user) || null; emit();
      });
    });
  }).catch(function (e) {
    // SDK failed to load: degrade to local mode, don't break the page
    API.enabled = false; currentUser = null; resolveReady(null);
  });

  function loadSupabase() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "/assets/js/vendor/supabase.js";
      s.async = true;
      s.onload = function () {
        if (window.supabase && window.supabase.createClient) resolve(window.supabase);
        else reject(new Error("supabase global missing after vendor load"));
      };
      s.onerror = function () { reject(new Error("failed to load vendored supabase.js")); };
      document.head.appendChild(s);
    });
  }
})();
