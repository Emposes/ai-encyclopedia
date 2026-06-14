/* ============================================================
   AI ENCYCLOPEDIA — runtime config.
   Paste your Supabase Project URL and anon (public) key here to
   turn on accounts, sign-in, progress sync, and the Studio gate.
   The anon key is meant to be public (safe in the client); the
   service-role key must NEVER go here — it lives only in Vercel
   env vars for the serverless functions.

   Leave blank to run in local/BYOK mode: the encyclopedia, Gym,
   onboarding, and bring-your-own-key Studio tools all work; only
   sign-in / cross-device sync stay dormant until this is filled.
   ============================================================ */
window.AIE_CONFIG = {
  supabaseUrl: "https://jltpzwzeevbzgwxtievu.supabase.co",
  supabaseAnonKey: "sb_publishable_JESkx580Ll0Ee7lBeoJ-zQ_f0rEKeup"  // publishable (public) key — safe in the client with RLS on
};
window.AIE_CONFIG.enabled = !!(window.AIE_CONFIG.supabaseUrl && window.AIE_CONFIG.supabaseAnonKey);
