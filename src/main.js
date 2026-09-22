const icon = (name, size = 16) => {
  const paths = {
    sparkles: '<path d="m12 3-1.2 3.2L7.5 7.5l3.3 1.3L12 12l1.2-3.2 3.3-1.3-3.3-1.3Z"/><path d="m5 13-.8 2.2L2 16l2.2.8L5 19l.8-2.2L8 16l-2.2-.8Z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', check: '<path d="m5 12 4 4L19 6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>', light: '<path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>', upload:'<path d="M12 16V4m-5 5 5-5 5 5M5 20h14"/>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkles}</svg>`;
};

let industries = ['Technology', 'Fintech'];
let fileName = '';
let cvText = '';
let uploadState = 'idle';
let activeView = 'CV Review';
let jobAdText = '';
let currentRole = 'Product leadership';
let targetRole = 'Product Director';
let targetLevel = 'Director';
let analysisState = 'ready';
let interviewStep = 0;
let interviewAnswers = {};
let diagnosis = { headline: 'Upload your CV to start a strict evidence diagnosis.', summary: 'We will identify the strongest claims, the missing proof, and the highest-value questions to answer next.' };
let decisionConfidence = null;
const marketCorpus = { total: 42, sources: ['Employer career sites', 'User-supplied job descriptions'], refreshed: 'Demo cohort' };
let evidenceBlocks = [
  { id:'impact-emea', type:'Commercial impact', title:'EMEA market expansion', evidence:'Generated $4.2M in new annual revenue by leading expansion into three EMEA markets.', tags:['GTM','EMEA','Revenue'], source:'Northstar · CV evidence', confidence:'Verified' },
  { id:'leadership-team', type:'Leadership scope', title:'Cross-functional product leadership', evidence:'Led a 12-person product, design, and engineering team across three markets.', tags:['Leadership','Product','Multi-market'], source:'Northstar · CV evidence', confidence:'Verified' },
  { id:'launches-b2b', type:'Product delivery', title:'B2B product launches', evidence:'Owned go-to-market strategy for three B2B product launches.', tags:['GTM','B2B','Launch'], source:'CV evidence', confidence:'Verified' },
  { id:'strategy', type:'Strategic capability', title:'Portfolio and market strategy', evidence:'Translated customer insight into product strategy across international markets.', tags:['Strategy','Customer insight'], source:'CV evidence', confidence:'Needs detail' }
];
let interviewQuestions = [
  { key:'revenue', gap:'Commercial impact is unproven', evidence:'Your CV says: “Led expansion into new markets across EMEA.”', question:'What commercial result did that expansion produce?', help:'Use a revenue, pipeline, conversion, cost, customer, or market-share figure. A range is fine if that is all you can support.', placeholder:'For example: £4.2M in new annual revenue across three markets', label:'Commercial outcome' },
  { key:'scope', gap:'Leadership scope is unclear', evidence:'Your CV says: “Managed a cross-functional product team.”', question:'Who was on the team, and what did you directly own?', help:'Include team size, functions, markets, budget, portfolio, or decision rights. Be precise about what was yours.', placeholder:'For example: 12 people across product, design and engineering; owned the EMEA roadmap', label:'Scope of ownership' },
  { key:'proof', gap:'Strategy is described, but not evidenced', evidence:'Your CV says: “Created plans to launch new products.”', question:'Name one launch and the result it achieved.', help:'Focus on one concrete example: the customer problem, your role, what shipped, and a measurable outcome.', placeholder:'For example: Launched X for Y customers, reaching Z adoption in six months', label:'Launch evidence' }
];
let suggestions = [
  { id: 1, tone: 'amber', ico:'chart', title:'Quantify your impact', text:'Your role at Northstar mentions growth, but not the revenue impact.', from:'Led expansion into new markets across EMEA.', to:'Led EMEA expansion, generating $4.2M in new annual revenue.' },
  { id: 2, tone: 'violet', ico:'user', title:'Show leadership scale', text:'Hiring teams want to understand the size and shape of teams you led.', from:'Managed a cross-functional product team.', to:'Led a 12-person product, design, and engineering team across 3 markets.' },
  { id: 3, tone: 'blue', ico:'target', title:'Match industry language', text:'“Go-to-market strategy” appears in 72% of relevant roles.', from:'Created plans to launch new products.', to:'Owned go-to-market strategy for three B2B product launches.' }
];

const app = document.querySelector('#root');
const toast = message => { const el=document.createElement('div'); el.className='toast'; el.innerHTML=`${icon('check',18)}${message}`; document.body.append(el); setTimeout(()=>el.remove(),2400); };

function render() {
  app.innerHTML = `<div class="app-shell">
  <header class="topbar"><a class="brand" href="#top"><span class="brand-mark">${icon('sparkles',18)}</span><span>ShapeShift</span></a>
    <nav>${['Dashboard','My CV','Job Matches'].map((x,i)=>`<button class="${i?'':'nav-active'}">${x}</button>`).join('')}</nav>
    <div class="account"><button class="help">Help</button><span class="avatar">AM</span><button class="account-name">Alex Morgan⌄</button></div></header>
  <main id="top"><section class="hero"><div><span class="eyebrow">${icon('sparkles',14)} AI-powered career toolkit</span><h1>Your experience.<br><em>Perfectly positioned.</em></h1><p>Every job application is unique. Your CV should match the role’s language, level, and proof—not just repeat your career history.</p></div>
    <div class="score-card"><div class="score-ring"><strong>76</strong><span>/100</span></div><div><span class="muted-label">CV strength</span><h3>Strong foundation</h3><p>3 high-impact opportunities</p></div>${icon('arrow',21)}</div></section>
  <section class="journey"><div class="journey-heading"><span class="overline">HOW IT WORKS</span><h2>Build the proof once. Tailor it for every role.</h2><p>Your evidence library is the durable asset; each CV is a purposeful selection from it.</p></div><ol class="journey-steps"><li><span>01</span><div><strong>Diagnose</strong><p>Upload your current CV. We compare its claims with the language and evidence expected for your target role.</p></div></li><li><span>02</span><div><strong>Build your Evidence Library</strong><p>Answer focused questions to turn achievements into credible, reusable evidence entries. Export or import it as Markdown.</p></div></li><li><span>03</span><div><strong>Tailor for a role</strong><p>Paste a job description. Jev selects the best-supported evidence; the writer assembles a role-specific CV.</p></div></li></ol></section>
  <section class="workspace"><aside class="setup-panel"><div class="section-heading"><span>01</span><div><h2>Build your profile</h2><p>Give us the essentials to get started.</p></div></div>
    <label class="field-label">Your current CV</label>${fileName?`<div class="file-card"><span class="pdf-icon">${icon('file',19)}</span><div><strong>${fileName}</strong><small>${cvText ? 'Text extracted · ready for analysis' : 'Preparing document…'}</small></div><button data-replace-file aria-label="Replace CV">${icon('upload',16)}</button><button data-remove-file aria-label="Remove CV">${icon('close',16)}</button></div>`:`<button class="upload-card" data-upload ${uploadState==='uploading'?'disabled':''}>${icon('upload',20)}<strong>${uploadState==='uploading'?'Reading your CV…':'Upload your CV'}</strong><span>PDF or DOCX, up to 10 MB</span></button>`}<input id="file-input" hidden type="file" accept=".pdf,.docx">
    <label class="field-label">Where are you now?</label><select class="select-field native-select" id="current-role"><option>Product leadership</option><option>Product Manager</option><option>Commercial leadership</option><option>Strategy & operations</option></select>
    <label class="field-label">Where do you want to go?</label><input class="select-field text-field" id="target-role" value="${targetRole}" aria-label="Target role">
    <label class="field-label">Target level</label><div class="level-grid">${['Manager','Senior Manager','Director','VP'].map(x=>`<button data-level="${x}" class="${targetLevel===x?'selected':''}">${targetLevel===x?icon('check',13):''}${x}</button>`).join('')}</div>
    <label class="field-label">Target industries</label><div class="industry-grid">${['Technology','Fintech','Consulting'].map(x=>`<button data-industry="${x}" class="${industries.includes(x)?'selected':''}">${industries.includes(x)?icon('check',14):''}${x}</button>`).join('')}<button class="add-industry">＋ Add</button></div>
    <button class="analyze-button" data-analyze ${analysisState==='analysing'||!cvText?'disabled':''}>${icon('sparkles',17)} ${analysisState==='analysing'?'Analysing your CV…':'Analyse my profile'} ${icon('arrow',17)}</button><div class="privacy">${icon('check',15)}<span>Used only for your requested analysis—never shared with employers.</span></div></aside>
  <section class="review-panel"><div class="review-top"><div><span class="overline">YOUR CAREER INTELLIGENCE</span><h2>Build once. Reuse with intent.</h2></div><div class="view-switcher">${['CV Review','Evidence Interview','Evidence Library','Tailor CV','Bio Builder'].map(x=>`<button data-view="${x}" class="${activeView===x?'active':''}">${icon(x==='CV Review'?'file':x==='Evidence Interview'?'light':x==='Evidence Library'?'briefcase':x==='Tailor CV'?'target':'user',15)} ${x}</button>`).join('')}</div></div>
    ${activeView==='CV Review'?reviewMarkup():activeView==='Evidence Interview'?interviewMarkup():activeView==='Evidence Library'?blocksMarkup():activeView==='Tailor CV'?tailorMarkup():bioMarkup()}<input id="evidence-library-input" hidden type="file" accept=".md,text/markdown"></section></section></main></div>`;
  bindEvents();
}

function reviewMarkup(){ const confidence=decisionConfidence===null?'—':decisionConfidence.toFixed(2); return `<div class="market-brief"><div><span class="overline">MARKET EVIDENCE</span><strong>${targetRole} · ${targetLevel}</strong><p>${marketCorpus.total} relevant roles · ${industries.join(', ')} · ${marketCorpus.refreshed}</p></div><div class="confidence"><span>Decision confidence</span><strong>${confidence}</strong><small>${decisionConfidence===null?'Waiting for analysis':'Live Jev decision'}</small></div></div><div class="diagnosis"><span class="summary-icon">${icon('light',21)}</span><div><span class="overline">STRICT DIAGNOSIS</span><strong>${diagnosis.headline}</strong><p>${diagnosis.summary}</p></div><button class="outline-button" data-open-interview ${interviewQuestions.length?'':'disabled'}>Answer evidence questions</button></div><div class="suggestion-list">${suggestions.length?suggestions.map((s,i)=>`<article class="suggestion"><div class="suggestion-number ${s.tone}">${i+1}</div><div class="suggestion-body"><div class="suggestion-title"><span class="mini-icon ${s.tone}">${icon(s.ico,15)}</span><div><h3>${s.title}</h3><p>${s.text}</p></div></div><div class="rewrite"><div><span>CURRENT</span><p>${s.from}</p></div>${icon('arrow',16)}<div><span>BLOCK CANDIDATE</span><p>${s.to}</p></div></div><div class="suggestion-actions"><button class="apply" data-open-interview>${icon('check',15)} Add supporting evidence</button><button data-dismiss="${s.id}">Dismiss</button></div></div></article>`).join(''):`<div class="all-done">${icon('check',38)}<h3>You’re all caught up</h3><p>Your evidence library is ready to reuse.</p></div>`}</div>`; }
function interviewMarkup(){ const item=interviewQuestions[interviewStep]; const complete=interviewStep>=interviewQuestions.length; if(complete) return `<div class="interview-complete">${icon('check',38)}<h3>Evidence interview complete</h3><p>You have added specific evidence that can be reviewed and saved as blocks.</p><button class="analyze-button" data-open-blocks>Open evidence library ${icon('arrow',17)}</button></div>`; return `<div class="interview-progress"><span>Evidence interview</span><span>${interviewStep+1} of ${interviewQuestions.length}</span></div><article class="interview-card"><span class="interview-gap">${item.gap}</span><div class="cv-quote"><span>WHAT WE FOUND</span><p>${item.evidence}</p></div><h3>${item.question}</h3><p class="interview-help">${item.help}</p><label class="field-label" for="evidence-answer">${item.label}</label><textarea id="evidence-answer" placeholder="${item.placeholder}">${interviewAnswers[item.key]||''}</textarea><div class="interview-actions"><button data-skip-evidence>Skip for now</button><button class="analyze-button" data-next-question>Save evidence and continue ${icon('arrow',17)}</button></div></article>`; }
function blocksMarkup(){ return `<div class="blocks-heading"><div><span class="overline">YOUR REUSABLE EVIDENCE</span><h3>${evidenceBlocks.length} evidence entries, ready for tailored documents</h3><p>This is your Evidence Library: the claims you can stand behind, with enough context to reuse them confidently. It is not a single finished CV.</p></div><div class="library-actions"><button class="outline-button" data-import-blocks>${icon('upload',15)} Import Markdown</button><button class="outline-button" data-export-blocks>${icon('file',15)} Export Markdown</button></div></div><div class="block-list">${evidenceBlocks.map(block=>`<article class="evidence-block"><div class="block-meta"><span>${block.type}</span><b class="${block.confidence==='Verified'?'verified':'needs-detail'}">${block.confidence}</b></div><h3>${block.title}</h3><p>${block.evidence}</p><div class="block-tags">${block.tags.map(tag=>`<span>${tag}</span>`).join('')}</div><small>${block.source}</small></article>`).join('')}</div><div class="library-note"><strong>What happens next</strong><p>For a specific opportunity, Jev selects relevant, sufficiently evidenced entries. The writer arranges them into a CV, bio, or application; the editor checks that every sentence stays faithful to the selected evidence.</p></div>`; }
function tailorMarkup(){ return `<div class="tailor-builder"><span class="overline">STEP 03 · TAILOR FOR A ROLE</span><h3>Start with the role, not a blank page.</h3><p>Paste a job description. We will identify the required capability, seniority signals, and proof points, then select the strongest entries from your Evidence Library.</p><label class="field-label" for="job-ad-text">Job description</label><textarea id="job-ad-text" placeholder="Paste the job description here…">${jobAdText}</textarea><div class="tailor-status"><span>${icon('briefcase',16)}</span><div><strong>${evidenceBlocks.length} evidence entries available</strong><p>Only supported entries should be eligible for the tailored CV.</p></div></div><button class="analyze-button" data-tailor ${jobAdText.trim()?'':'disabled'}>${icon('sparkles',17)} Analyse this role and select evidence ${icon('arrow',17)}</button></div>`; }
function bioMarkup(){ return `<div class="bio-builder"><span class="bio-icon">${icon('user',25)}</span><h3>Your story, shaped for the right audience.</h3><p>We’ll turn your experience into a clear, credible bio for your target industries.</p><div class="bio-preview"><span>EXECUTIVE BIO · FINTECH</span><p>Product leader with a track record of translating customer insight into high-growth products across international markets…</p></div><button class="analyze-button" data-generate>${icon('sparkles',17)} Generate my bio ${icon('arrow',17)}</button></div>`; }

function bindEvents(){
  document.querySelectorAll('[data-industry]').forEach(el=>el.onclick=()=>{ const x=el.dataset.industry; industries=industries.includes(x)?industries.filter(i=>i!==x):[...industries,x]; render(); });
  document.querySelectorAll('[data-level]').forEach(el=>el.onclick=()=>{targetLevel=el.dataset.level; render();});
  document.querySelector('#current-role')?.addEventListener('change',e=>{currentRole=e.target.value;});
  document.querySelector('#target-role')?.addEventListener('change',e=>{targetRole=e.target.value.trim()||'Target role'; render();});
  document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>{activeView=el.dataset.view;render();});
  document.querySelector('[data-open-blocks]')?.addEventListener('click',()=>{activeView='Evidence Library';render();});
  document.querySelectorAll('[data-open-interview]').forEach(el=>el.onclick=()=>{activeView='Evidence Interview';render();});
  document.querySelector('[data-next-question]')?.addEventListener('click',saveInterviewAnswer);
  document.querySelector('[data-skip-evidence]')?.addEventListener('click',()=>{interviewStep+=1;render();});
  document.querySelector('[data-export-blocks]')?.addEventListener('click',exportBlocks);
  document.querySelector('[data-import-blocks]')?.addEventListener('click',()=>document.querySelector('#evidence-library-input').click());
  document.querySelector('#evidence-library-input')?.addEventListener('change',e=>importBlocks(e.target.files[0]));
  document.querySelector('#job-ad-text')?.addEventListener('input',e=>{jobAdText=e.target.value; document.querySelector('[data-tailor]')?.toggleAttribute('disabled',!jobAdText.trim());});
  document.querySelector('[data-tailor]')?.addEventListener('click',()=>toast('Role analysis is the next step: evidence selection will use this job description.'));
  document.querySelectorAll('[data-apply]').forEach(el=>el.onclick=()=>{suggestions=suggestions.filter(s=>s.id!==Number(el.dataset.apply));render();toast('Suggestion applied to your CV');});
  document.querySelectorAll('[data-dismiss]').forEach(el=>el.onclick=()=>{suggestions=suggestions.filter(s=>s.id!==Number(el.dataset.dismiss));render();});
  document.querySelector('[data-remove-file]')?.addEventListener('click',()=>{fileName='';cvText='';render();});
  document.querySelector('[data-upload]')?.addEventListener('click',()=>document.querySelector('#file-input').click());
  document.querySelector('[data-replace-file]')?.addEventListener('click',()=>document.querySelector('#file-input').click());
  document.querySelector('#file-input')?.addEventListener('change',e=>uploadCv(e.target.files[0]));
  document.querySelector('[data-analyze]')?.addEventListener('click',runAnalysis);
  document.querySelector('[data-generate]')?.addEventListener('click',()=>toast('Your tailored bio is ready'));
}

function saveInterviewAnswer(){ const item=interviewQuestions[interviewStep]; const answer=document.querySelector('#evidence-answer')?.value.trim(); if(!answer){toast('Add a specific result or choose “Skip for now”');return;} interviewAnswers[item.key]=answer; evidenceBlocks=[...evidenceBlocks,{id:`interview-${item.key}`,type:item.label,title:item.gap.replace(' is unproven','').replace(' is unclear',''),evidence:answer,tags:[targetRole,targetLevel,'Interview'],source:'User-supplied evidence · verify before use',confidence:'Needs detail'}]; interviewStep+=1;render();toast('Evidence saved for review'); }

function saveSuggestionAsBlock(id){
  const suggestion=suggestions.find(item=>item.id===id); if(!suggestion) return;
  evidenceBlocks=[...evidenceBlocks,{id:`suggestion-${id}`,type:'Evidence candidate',title:suggestion.title,evidence:suggestion.to,tags:[targetRole,targetLevel],source:'CV recommendation · verify before use',confidence:'Needs detail'}];
  suggestions=suggestions.filter(item=>item.id!==id); activeView='Evidence Blocks'; render(); toast('Saved to your evidence library');
}

function exportBlocks(){
  const markdown=['# Career evidence library','',`> Target: ${targetRole} · ${targetLevel}`,'',...evidenceBlocks.flatMap(block=>[`## ${block.title}`,`- Type: ${block.type}`,`- Confidence: ${block.confidence}`,`- Evidence: ${block.evidence}`,`- Tags: ${block.tags.join(', ')}`,`- Source: ${block.source}`,''])].join('\n');
  const blob=new Blob([markdown],{type:'text/markdown'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download='career-evidence-library.md'; link.click(); URL.revokeObjectURL(url); toast('Markdown evidence library downloaded');
}

async function importBlocks(file){
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.md')) { toast('Choose a Markdown evidence library'); return; }
  const markdown=await file.text();
  const sections=markdown.split(/^## /m).slice(1);
  const imported=sections.map((section,index)=>{
    const [title,...lines]=section.split('\n');
    const field=label=>lines.find(line=>line.startsWith(`- ${label}:`))?.replace(`- ${label}:`,'').trim();
    const evidence=field('Evidence');
    if(!title || !evidence) return null;
    return { id:`import-${Date.now()}-${index}`,title:title.trim(),type:field('Type')||'Imported evidence',confidence:field('Confidence')||'Needs detail',evidence,tags:(field('Tags')||'Imported').split(',').map(tag=>tag.trim()),source:field('Source')||file.name };
  }).filter(Boolean);
  if(!imported.length){ toast('That Markdown file does not look like an Evidence Library export'); return; }
  evidenceBlocks=[...evidenceBlocks,...imported]; activeView='Evidence Library'; render(); toast(`${imported.length} evidence entries imported`);
}

async function runAnalysis(){
  if(!cvText){ toast('Upload a PDF or DOCX first'); return; }
  analysisState='analysing'; render();
  const payload={currentRole,targetRole,targetLevel,industries,fileName,cvText};
  try {
    const response=await fetch('/api/career-analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!response.ok) throw new Error('Analysis service is not configured');
    const result=await response.json();
    if(Array.isArray(result.suggestions)) suggestions=result.suggestions;
    if(result.diagnosis) diagnosis=result.diagnosis;
    if(Array.isArray(result.interviewQuestions)) { interviewQuestions=result.interviewQuestions; interviewStep=0; interviewAnswers={}; }
    if(typeof result.decisionConfidence==='number') decisionConfidence=result.decisionConfidence;
    if(result.marketCorpus) Object.assign(marketCorpus,result.marketCorpus);
    toast('Live career analysis is ready');
  } catch {
    suggestions=levelSuggestions(targetLevel);
    marketCorpus.total=42;
    marketCorpus.refreshed='Demo cohort · connect a data source for live results';
    diagnosis={headline:'The demo found three claims that need supporting evidence.',summary:'Connect the analysis service to replace this example with a diagnosis based on your CV.'};
    interviewQuestions=levelInterviewQuestions();
    decisionConfidence=null;
    toast('Showing the evidence-led demo analysis');
  } finally { analysisState='ready'; activeView='Evidence Blocks'; render(); }
}

function levelInterviewQuestions(){ return levelSuggestions(targetLevel).map((item,index)=>({ key:`demo-${index}`,gap:item.title,evidence:`Your CV says: “${item.from}”`,question:item.text,help:'Give a precise, supportable result, scope, or decision you personally owned.',placeholder:'Add the specific evidence you can stand behind',label:'Supporting evidence' })); }

async function uploadCv(file){
  if(!file) return;
  if(file.size > 10 * 1024 * 1024){ toast('Choose a CV under 10 MB'); return; }
  const extension=file.name.split('.').pop()?.toLowerCase();
  if(!['pdf','docx'].includes(extension)){ toast('Choose a PDF or DOCX file'); return; }
  uploadState='uploading'; render();
  try {
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file);});
    const response=await fetch('/api/extract-cv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,type:file.type,data})});
    const result=await response.json();
    if(!response.ok || !result.text) throw new Error(result.error || 'We could not read that document');
    fileName=file.name; cvText=result.text; uploadState='ready';
    toast('CV read successfully — starting your diagnosis');
    await runAnalysis();
  } catch(error) {
    uploadState='idle'; render();
    toast(error.message || 'We could not read that document');
  }
}

function levelSuggestions(level){
  const leadership=level==='VP'?'Show enterprise influence across functions and business units.':level==='Director'?'Show the size, remit, and multi-market impact of teams you led.':'Show how you led work beyond your individual remit.';
  return [
    { id:1,tone:'amber',ico:'chart',title:'Quantify commercial impact',text:`${targetRole} roles expect measured outcomes, not activity.`,from:'Led expansion into new markets across EMEA.',to:'Led EMEA expansion, generating $4.2M in new annual revenue.'},
    { id:2,tone:'violet',ico:'user',title:'Evidence leadership scope',text:leadership,from:'Managed a cross-functional product team.',to:'Led a 12-person product, design, and engineering team across 3 markets.'},
    { id:3,tone:'blue',ico:'target',title:'Use market language truthfully',text:`The ${targetLevel} cohort frequently describes go-to-market ownership.`,from:'Created plans to launch new products.',to:'Owned go-to-market strategy for three B2B product launches.'}
  ];
}
render();
