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
let fileName = 'Alex_Morgan_CV.pdf';
let activeView = 'CV Review';
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
  <main id="top"><section class="hero"><div><span class="eyebrow">${icon('sparkles',14)} AI-powered career toolkit</span><h1>Your experience.<br><em>Perfectly positioned.</em></h1><p>Turn one master CV into tailored applications that speak directly to every opportunity.</p></div>
    <div class="score-card"><div class="score-ring"><strong>76</strong><span>/100</span></div><div><span class="muted-label">CV strength</span><h3>Strong foundation</h3><p>3 high-impact opportunities</p></div>${icon('arrow',21)}</div></section>
  <section class="workspace"><aside class="setup-panel"><div class="section-heading"><span>01</span><div><h2>Build your profile</h2><p>Give us the essentials to get started.</p></div></div>
    <label class="field-label">Your current CV</label>${fileName?`<div class="file-card"><span class="pdf-icon">${icon('file',19)}</span><div><strong>${fileName}</strong><small>PDF · 284 KB</small></div><button data-remove-file aria-label="Remove CV">${icon('close',16)}</button></div>`:`<button class="upload-card" data-upload>${icon('upload',20)}<strong>Upload your CV</strong><span>PDF or DOCX, up to 10 MB</span></button>`}<input id="file-input" hidden type="file" accept=".pdf,.doc,.docx">
    <label class="field-label">Where are you now?</label><button class="select-field"><span>${icon('briefcase',17)} Product leadership</span><span>⌄</span></button>
    <label class="field-label">Where do you want to go?</label><div class="industry-grid">${['Technology','Fintech','Consulting'].map(x=>`<button data-industry="${x}" class="${industries.includes(x)?'selected':''}">${industries.includes(x)?icon('check',14):''}${x}</button>`).join('')}<button class="add-industry">＋ Add</button></div>
    <button class="analyze-button" data-analyze>${icon('sparkles',17)} Analyse my profile ${icon('arrow',17)}</button><div class="privacy">${icon('check',15)}<span>Your information is private and never shared with employers.</span></div></aside>
  <section class="review-panel"><div class="review-top"><div><span class="overline">YOUR CAREER INTELLIGENCE</span><h2>Make every word count.</h2></div><div class="view-switcher">${['CV Review','Bio Builder'].map(x=>`<button data-view="${x}" class="${activeView===x?'active':''}">${icon(x==='CV Review'?'file':'user',15)} ${x}</button>`).join('')}</div></div>
    ${activeView==='CV Review'?reviewMarkup():bioMarkup()}</section></section></main></div>`;
  bindEvents();
}

function reviewMarkup(){ return `<div class="insight-summary"><div><span class="summary-icon">${icon('light',21)}</span><div><strong>${suggestions.length} ways to make your CV sharper</strong><p>Based on 1,240 roles in your target industries</p></div></div><span class="updated"><span></span> Updated just now</span></div><div class="suggestion-list">${suggestions.length?suggestions.map((s,i)=>`<article class="suggestion"><div class="suggestion-number ${s.tone}">${i+1}</div><div class="suggestion-body"><div class="suggestion-title"><span class="mini-icon ${s.tone}">${icon(s.ico,15)}</span><div><h3>${s.title}</h3><p>${s.text}</p></div></div><div class="rewrite"><div><span>CURRENT</span><p>${s.from}</p></div>${icon('arrow',16)}<div><span>SUGGESTED</span><p>${s.to}</p></div></div><div class="suggestion-actions"><button class="apply" data-apply="${s.id}">${icon('check',15)} Apply suggestion</button><button data-dismiss="${s.id}">Dismiss</button></div></div></article>`).join(''):`<div class="all-done">${icon('check',38)}<h3>You’re all caught up</h3><p>Your CV is looking sharp and ready to tailor.</p></div>`}</div>`; }
function bioMarkup(){ return `<div class="bio-builder"><span class="bio-icon">${icon('user',25)}</span><h3>Your story, shaped for the right audience.</h3><p>We’ll turn your experience into a clear, credible bio for your target industries.</p><div class="bio-preview"><span>EXECUTIVE BIO · FINTECH</span><p>Product leader with a track record of translating customer insight into high-growth products across international markets…</p></div><button class="analyze-button" data-generate>${icon('sparkles',17)} Generate my bio ${icon('arrow',17)}</button></div>`; }

function bindEvents(){
  document.querySelectorAll('[data-industry]').forEach(el=>el.onclick=()=>{ const x=el.dataset.industry; industries=industries.includes(x)?industries.filter(i=>i!==x):[...industries,x]; render(); });
  document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>{activeView=el.dataset.view;render();});
  document.querySelectorAll('[data-apply]').forEach(el=>el.onclick=()=>{suggestions=suggestions.filter(s=>s.id!==Number(el.dataset.apply));render();toast('Suggestion applied to your CV');});
  document.querySelectorAll('[data-dismiss]').forEach(el=>el.onclick=()=>{suggestions=suggestions.filter(s=>s.id!==Number(el.dataset.dismiss));render();});
  document.querySelector('[data-remove-file]')?.addEventListener('click',()=>{fileName='';render();});
  document.querySelector('[data-upload]')?.addEventListener('click',()=>document.querySelector('#file-input').click());
  document.querySelector('#file-input')?.addEventListener('change',e=>{fileName=e.target.files[0]?.name||'';render();});
  document.querySelector('[data-analyze]')?.addEventListener('click',()=>toast('Your profile is up to date'));
  document.querySelector('[data-generate]')?.addEventListener('click',()=>toast('Your tailored bio is ready'));
}
render();
