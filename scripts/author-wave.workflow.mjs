export const meta = {
  name: 'aie-author-wave',
  description: 'Author a wave of AI Encyclopedia chapters in parallel from briefs (args)',
  phases: [{ title: 'Author', detail: 'one subagent per chapter, per AUTHORING.md' }],
};

// args = { wave: "A", root: "/abs/llm-manual", chapters: [ {brief}, ... ] }
// args may arrive as a JSON string or an object — normalize.
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const ROOT = A.root;
const AUTHORING = ROOT + '/AUTHORING.md';
const REF1 = ROOT + '/chapters/06-finetuning.html';
const REF2 = ROOT + '/chapters/03-attention.html';
const META_DIR = ROOT + '/docs/waves/meta';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['file', 'sections', 'glossary', 'refs', 'ok'],
  properties: {
    file: { type: 'string' },
    sections: { type: 'array', items: { type: 'string' } },
    glossary: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['term', 'def'],
        properties: { term: { type: 'string' }, def: { type: 'string' } },
      },
    },
    refs: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['cite', 'url'],
        properties: { cite: { type: 'string' }, url: { type: 'string' } },
      },
    },
    ok: { type: 'boolean' },
    notes: { type: 'string' },
  },
};

function buildPrompt(c) {
  const list = (arr, h) => (arr && arr.length ? h + '\n' + arr.map((x) => '  - ' + x).join('\n') : '');
  return [
    'You are authoring ONE chapter for "The AI Encyclopedia", a Palantir-dark interactive learning site. It must be indistinguishable in craft from the existing chapters.',
    '',
    'STEP 1 — Read COMPLETELY: ' + AUTHORING + '  (the non-negotiable spec, including the V2 additions: body data-track/data-level tags, per-track EQ prefixes, the References .ref-list section, >=2 write-the-value .exercise blocks, and the EXACT script order ending with lesson.js).',
    'Then skim for craft: ' + REF1 + ' (structure) and ' + REF2 + ' (instrument richness).',
    '',
    'STEP 2 — Write exactly one file: ' + ROOT + '/' + c.file + '   (create the parent directory if needed). Obey AUTHORING.md end to end. No placeholders/TODO/lorem; technically correct and current as of 2026; honest about contested points.',
    '',
    'CHAPTER BRIEF',
    '- Title: ' + c.title,
    '- Level: ' + c.level + '  → set <body data-track="' + c.track + '" data-level="' + c.level.toLowerCase() + '"> and make the hero badge match.',
    '- Crumb (topbar): ' + c.crumb,
    '- Hero ch-index: ' + c.chIndex,
    '- Equation tags: "EQ ' + c.eqPrefix + '.N"; instrument titles "INSTRUMENT ' + c.eqPrefix + '.N — NAME"; ALL element ids prefixed "' + c.slug + '-".',
    '- Pager + topbar: PREV = ' + c.prevFile + ' ("' + c.prevLabel + '"), NEXT = ' + c.nextFile + ' ("' + c.nextLabel + '"), INDEX = ../index.html#toc.',
    '- Lede (one bold idea): ' + c.thesis,
    '',
    'SECTIONS (assign ids s1..sK in this order; the LAST section is References):',
    c.sections.map((s, i) => '  s' + (i + 1) + ': ' + s).join('\n'),
    '',
    list(c.instruments, 'INSTRUMENTS (>=3; AUTHORING .widget pattern; all JS in the single bottom IIFE using FM helpers; setTimeout not rAF; guard each by element existence; meaningful initial state with zero interaction):'),
    '',
    list(c.pycells, 'RUNNABLE PYTHON (>=2 .pycell; numpy only; <30 lines; runs <3s; prints meaningful output even unedited; you may call plot_xy/plot_scatter):'),
    '',
    list(c.exercises, 'EXERCISES (>=2 .exercise "write-the-value" blocks per the contract; pick numeric answers tied to the chapter math):'),
    '',
    list(c.refs, 'REFERENCES (use the .ref-list component; cite these canonical primary sources as REAL links — verify the URLs are plausible/correct; add more if useful):'),
    '',
    'STEP 3 — Also write a sidecar metadata file: ' + META_DIR + '/' + c.slug + '.json  containing JSON: {"file":"' + c.file + '","glossary":[{"term","def"}... 4-8 items],"refs":[{"cite","url"}...]}. Create the directory if needed.',
    '',
    'Run the self-check list at the bottom of AUTHORING.md before finishing. Verify all math by hand. Your final message MUST be the StructuredOutput (data, not prose).',
  ].filter((x) => x !== '').join('\n');
}

phase('Author');
log('Authoring wave ' + A.wave + ' — ' + A.chapters.length + ' chapters');

const results = await parallel(
  A.chapters.map((c) => () =>
    agent(buildPrompt(c), { label: c.file, phase: 'Author', schema: SCHEMA })
  )
);

const ok = results.filter(Boolean);
log('Wave ' + A.wave + ' done: ' + ok.length + '/' + A.chapters.length + ' returned');
return {
  wave: A.wave,
  authored: ok.length,
  requested: A.chapters.length,
  files: ok.map((r) => r.file),
  glossaryCount: ok.reduce((n, r) => n + (r.glossary ? r.glossary.length : 0), 0),
  failures: A.chapters.map((c) => c.file).filter((f) => !ok.some((r) => r.file === f)),
};
