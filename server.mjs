import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { OpenRouter } from '@openrouter/sdk';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const root = process.cwd();
const staticRoot = process.argv.includes('--dist') ? join(root, 'dist') : root;
const env = Object.fromEntries((await readFile(join(root, '.env'), 'utf8')).split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/); return match ? [[match[1], match[2].trim()]] : [];
}));
const apiKey = env.OPENROUTER_API_KEY;
const client = new OpenRouter({ apiKey });
const appHeaders = { 'HTTP-Referer': env.OPENROUTER_HTTP_REFERER, 'X-Title': env.OPENROUTER_APP_NAME };

const exampleClaims = [
  'Led expansion into new markets across EMEA.',
  'Managed a cross-functional product team.',
  'Created plans to launch new products.'
];

const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
const content = response => response.choices?.[0]?.message?.content || '';
const parseJson = value => JSON.parse(value.replace(/^```json\s*|\s*```$/g, '').trim());

const confidenceFor = answers => {
  const values = Object.values(answers || {}).map(answer => Number(answer?.confidence)).filter(value => Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
};

const cleanText = text => text.replace(/\u0000/g, '').replace(/\s{2,}/g, ' ').trim().slice(0, 60000);
const sourceClaimsFor = cvText => {
  const candidates = cvText.split(/\n|(?<=[.!?])\s+/).map(value => value.trim()).filter(value => value.length > 35 && value.length < 500);
  return candidates.slice(0, 24).length ? candidates.slice(0, 24) : exampleClaims;
};

async function extractCv(input) {
  const { name = '', data = '' } = input || {};
  const extension = extname(name).toLowerCase();
  if (!['.pdf', '.docx'].includes(extension)) throw new Error('Please upload a PDF or DOCX file.');
  const encoded = data.split(',').pop() || '';
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length || buffer.length > 10 * 1024 * 1024) throw new Error('Please upload a document under 10 MB.');
  let text;
  if (extension === '.docx') {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else {
    const parser = new PDFParse({ data: buffer });
    try { text = (await parser.getText()).text; } finally { await parser.destroy(); }
  }
  text = cleanText(text || '');
  if (text.length < 80) throw new Error('We could not extract enough readable text. Try a text-based PDF or DOCX.');
  return text;
}

async function chat(model, messages) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...appHeaders },
    body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 900, reasoning: { enabled: false }, response_format: { type: 'json_object' } })
  });
  if (!response.ok) throw new Error(`OpenRouter returned ${response.status}: ${await response.text()}`);
  return parseJson(content(await response.json()));
}

async function decide(decisionsRequest) {
  if (env.JEV_PROVIDER === 'typesafe') {
    const response = await fetch(`${env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai'}/v1/systemone`, {
      method: 'POST', headers: { Authorization: `Bearer ${env.TYPESAFE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...decisionsRequest, model: env.TYPESAFE_DEFAULT_MODEL || 'jev-latest' })
    });
    if (!response.ok) throw new Error(`TypeSafe returned ${response.status}: ${await response.text()}`);
    return response.json();
  }
  return client.alpha.decisions.create({
    httpReferer: env.OPENROUTER_HTTP_REFERER, appTitle: env.OPENROUTER_APP_NAME, decisionsRequest
  });
}

async function analyse(input) {
  const cvText = cleanText(input.cvText || '');
  if (cvText.length < 80) throw new Error('Upload a readable CV before starting analysis.');
  const sourceClaims = sourceClaimsFor(cvText);
  const state = { target: `${input.targetRole} · ${input.targetLevel}`, industries: input.industries, currentRole: input.currentRole, cvText, claims: sourceClaims };
  const decision = await decide({
    model: env.JEV_MODEL || '~typesafe/jev-latest', state,
    questions: {
      target_fit: { type: 'choice', criteria: { strong: 'Clearly matches the target level and role', partial: 'Some relevance but important evidence is missing', weak: 'Does not demonstrate the target role' }, instructions: 'Judge the supplied CV claims against the target.' },
      evidence_strength: { type: 'score', criteria: ['Unsupported', 'General claim', 'Specific but incomplete', 'Specific and measurable', 'Fully evidenced'], instructions: 'Score how well the claims prove commercial impact, leadership scope, and delivery.' },
      needs_follow_up: { type: 'choice', criteria: { revenue: 'Commercial outcome or measurable business impact', scope: 'Team, budget, market, or decision scope', launch: 'A named launch and measurable result' }, instructions: 'Choose the highest-value follow-up question for this CV.' }
    }
  });
  const decisionSummary = JSON.stringify(decision.answers);
  const draft = await chat(env.CV_WRITER_MODEL, [
    { role: 'system', content: 'You are a precise career evidence writer. Never invent facts. Return JSON only: {"diagnosis":{"headline":"","summary":""},"suggestions":[{"title":"","text":"","from":"","to":"","evidenceNeeded":"","question":"","help":"","placeholder":""}]}. The diagnosis must describe this specific CV and its target, not generic advice. Create at most three concise evidence questions. Each `from` value must quote or faithfully shorten a supplied CV claim. `to` must be a proposed evidence-block direction, not an invented achievement.' },
    { role: 'user', content: JSON.stringify({ state, decisionSummary }) }
  ]);
  const edited = await chat(env.CV_EDITOR_MODEL, [
    { role: 'system', content: 'You are a strict CV editor. Keep only recommendations that ask for evidence or restate a supplied source claim. Reject invented outcomes. Return JSON only: {"diagnosis":{"headline":"","summary":""},"suggestions":[{"title":"","text":"","from":"","to":"","evidenceNeeded":"","question":"","help":"","placeholder":""}]}. Preserve at most three items. Keep the diagnosis specific to the CV; do not make claims absent from the supplied source claims.' },
    { role: 'user', content: JSON.stringify({ sourceClaims, draft }) }
  ]);
  const tones = ['amber', 'violet', 'blue']; const icons = ['chart', 'user', 'target'];
  const recommendations = (edited.suggestions || []).slice(0, 3).map((item, index) => ({
    id: index + 1, tone: tones[index] || 'blue', ico: icons[index] || 'target', title: item.title, text: item.text,
    from: item.from, to: item.to, evidenceNeeded: item.evidenceNeeded, question: item.question, help: item.help, placeholder: item.placeholder
  }));
  const diagnosis = edited.diagnosis?.headline ? edited.diagnosis : {
    headline: recommendations.length ? `${recommendations.length} claims need stronger evidence before reuse.` : 'No high-priority evidence gaps were identified.',
    summary: recommendations.length ? recommendations.map(item => item.title).join(' · ') : 'Review your evidence blocks before generating a tailored CV.'
  };
  return {
    suggestions: recommendations,
    diagnosis,
    interviewQuestions: recommendations.map((item, index) => ({
      key: `evidence-${index + 1}`, gap: item.title || 'Evidence gap', evidence: `Your CV says: “${item.from || 'a relevant claim'}”`,
      question: item.question || item.text || 'What specific result, scope, or decision can you support here?',
      help: item.help || item.evidenceNeeded || 'Use a precise result, scope, or decision you personally owned. Do not estimate if you cannot support it.',
      placeholder: item.placeholder || 'Add the specific evidence you can stand behind', label: item.evidenceNeeded || 'Supporting evidence'
    })),
    marketCorpus: { total: 0, refreshed: `Live Jev analysis · ${decision.model}`, sources: ['CV evidence interview'] },
    decisions: decision.answers,
    decisionConfidence: confidenceFor(decision.answers)
  };
}

const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json' };
const server = createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/career-analysis') {
      let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 700000) throw new Error('CV content is too large.'); }
      if (!apiKey) return json(res, 500, { error: 'OPENROUTER_API_KEY is missing.' });
      return json(res, 200, await analyse(JSON.parse(raw || '{}')));
    }
    if (req.method === 'POST' && req.url === '/api/extract-cv') {
      let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 14 * 1024 * 1024) throw new Error('CV file is too large.'); }
      return json(res, 200, { text: await extractCv(JSON.parse(raw || '{}')) });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    const requested = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '');
    const file = normalize(join(staticRoot, requested));
    if (!file.startsWith(staticRoot)) return json(res, 403, { error: 'Forbidden.' });
    const body = await readFile(file); res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) { json(res, 500, { error: error.message || 'Unexpected server error.' }); }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(4173, () => console.log(`ShapeShift running at http://localhost:4173 (${process.argv.includes('--dist') ? 'production preview' : 'development'})`));
}

export { analyse, extractCv };
