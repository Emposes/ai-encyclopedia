export const meta = {
  name: 'aie-video-scripts',
  description: 'Generate concept-video scripts (beats + visuals) for new chapters, in parallel',
  phases: [{ title: 'Script', detail: 'one subagent per chapter reads it and writes per-section video beats' }],
};

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const ROOT = A.root;
const NAME = { stats: 'STATISTICS', data: 'DATA', ml: 'MACHINE LEARNING', mlops: 'MODEL RISK', dl: 'DEEP LEARNING', rl: 'REINFORCEMENT LEARNING', 'game-theory': 'GAME THEORY', timeseries: 'TIME SERIES', quant: 'QUANTITATIVE FINANCE', chapters: 'LLM FIELD MANUAL', prompting: 'PROMPTING', agents: 'AGENTS', frameworks: 'FRAMEWORKS', multimodal: 'MULTIMODAL', openmodels: 'OPEN MODELS' };
// args.chapters is a list of "dir/name" paths; derive file + eyebrow.
const chapters = (A.chapters || []).map((ch) => ({ file: ch + '.html', chapter: ch, eyebrow: NAME[ch.split('/')[0]] || ch.split('/')[0].toUpperCase() }));

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['concepts'],
  properties: {
    concepts: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'chapter', 'section', 'title', 'eyebrow', 'beats'],
        properties: {
          id: { type: 'string' }, chapter: { type: 'string' }, section: { type: 'string' },
          title: { type: 'string' }, eyebrow: { type: 'string' },
          beats: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false, required: ['text', 'visual'],
              properties: {
                text: { type: 'string' },
                visual: { type: 'object', required: ['type'], additionalProperties: true, properties: { type: { type: 'string' } } },
              },
            },
          },
        },
      },
    },
  },
};

function prompt(c) {
  return [
    'Generate short explainer-VIDEO scripts for one chapter of The AI Encyclopedia.',
    'STEP 1: Read the chapter file: ' + ROOT + '/' + c.file,
    'STEP 2: For EACH content section — the <section class="section" id="sN"> blocks, EXCLUDING the References section — produce ONE concept-video script.',
    '',
    'Return the StructuredOutput {concepts:[...]}. Each concept:',
    '  id: "' + c.chapter.replace(/\//g, '-') + '-" + the section id (e.g. "' + c.chapter.replace(/\//g, '-') + '-s1")',
    '  chapter: "' + c.chapter + '"',
    '  section: the section id ("s1"...)',
    '  title: the section\'s <h2> text',
    '  eyebrow: "' + c.eyebrow + '"',
    '  beats: 4 to 6 beats, each { text, visual }',
    '',
    'text = ONE narration sentence, ~12-28 words, plain and accurate, drier voice (NO em-dashes, no hype).',
    'visual = exactly ONE of these shapes (valid JSON; escape backslashes in tex):',
    "  {type:'title', text, sub?}",
    "  {type:'equation', tex, note?}        // KaTeX source; only where the section has real math",
    "  {type:'plot', ys:[>=3 numbers], dot?, xlabel?, ylabel?, mark?}",
    "  {type:'bars', values:[>=2 numbers], labels?, highlight?}",
    "  {type:'lattice'}                      // abstract; use sparingly",
    "  {type:'stat', value:Number, label, unit?, decimals?}",
    'Vary the visual types across beats. Use the section\'s real numbers/equations where possible. First beat is usually a title.',
    '',
    'STEP 3: ALSO write your concepts array as JSON to ' + ROOT + '/docs/video-scripts/' + c.chapter.replace(/\//g, '-') + '.json (create the directory if needed). Then return the StructuredOutput.',
  ].join('\n');
}

phase('Script');
log('Scripting videos for ' + chapters.length + ' new chapters');
const results = await parallel(chapters.map((c) => () => agent(prompt(c), { label: 'script:' + c.chapter, phase: 'Script', schema: SCHEMA })));
const ok = results.filter(Boolean);
const all = [];
ok.forEach((r) => (r.concepts || []).forEach((x) => all.push(x)));
return { chapters: ok.length, concepts: all.length, data: all };
