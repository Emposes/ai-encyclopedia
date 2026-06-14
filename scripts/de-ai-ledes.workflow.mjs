export const meta = {
  name: 'aie-de-ai-ledes',
  description: 'Copy-edit every chapter lede to a drier, reference-grade voice (remove AI-writing tells)',
  phases: [{ title: 'Edit', detail: 'one subagent per track, rewrites the lede of each chapter in place' }],
};

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const ROOT = A.root;
const tracks = A.tracks;

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['track', 'edited'],
  properties: {
    track: { type: 'string' },
    edited: { type: 'number' },
    notes: { type: 'string' },
  },
};

function prompt(track) {
  return [
    'You are doing a precise COPY EDIT, not a rewrite of content. Work in the directory: ' + ROOT + '/' + track + '/',
    '',
    'For EACH *.html file in that directory:',
    '1. Read the file. Find the single `<p class="lede">...</p>` in the chapter hero.',
    '2. Rewrite ONLY the inner text of that lede to a drier, reference-grade voice that removes AI-writing tells:',
    '   - Do NOT use em-dashes (—). Use periods, colons, or commas instead.',
    '   - Do NOT use the formulaic shape "X is the Y that Z" or "It is not just X, it is Y".',
    '   - No hype, no chipper tone. Plain, confident, factual.',
    '   - 2 to 3 sentences maximum. Keep exactly one <strong>…</strong> bold key idea.',
    '   - Preserve the technical meaning and any inline \\( … \\) math.',
    '3. Use the Edit tool to replace ONLY that lede paragraph. Change nothing else in the file — not the title, not sections, not scripts.',
    '',
    'Do not touch any file outside ' + ROOT + '/' + track + '/. Do not create files.',
    'When done, return the StructuredOutput with the count of ledes you edited.',
  ].join('\n');
}

phase('Edit');
log('De-AI ledes across ' + tracks.length + ' tracks');
const results = await parallel(tracks.map((t) => () => agent(prompt(t), { label: 'ledes:' + t, phase: 'Edit', schema: SCHEMA })));
const ok = results.filter(Boolean);
return { tracks: ok.length, totalEdited: ok.reduce((n, r) => n + (r.edited || 0), 0), perTrack: ok };
