<script>
// ── DARK MODE ──
function toggleDark(){
  document.body.classList.toggle('dark');
  const d=document.body.classList.contains('dark');
  localStorage.setItem('tp-dark',d?'1':'');
  const btn=document.getElementById('dark-toggle');
  btn.innerHTML=d
    ?`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#ic-sun"/></svg>`
    :`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#ic-moon"/></svg>`;
}
if(localStorage.getItem('tp-dark')==='1'){
  document.body.classList.add('dark');
  document.getElementById('dark-toggle').innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#ic-sun"/></svg>`;
}

// ── TABS WITH/WITHOUT PANEL ──
// Tabs that use the right detail panel
const PANEL_TABS=new Set(['toxidromes','environmental']);
let panelOpen=true;

function showTab(id,tab){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  if(tab) tab.classList.add('active');
  else {
    const nt=document.getElementById('ntab-'+id);
    if(nt) nt.classList.add('active');
    else document.querySelectorAll('.ntab').forEach(t=>{
      if((t.getAttribute('onclick')||'').includes("'"+id+"'")) t.classList.add('active');
    });
  }
  // Show/hide right panel based on tab
  const al=document.getElementById('app-layout');
  const pt=document.getElementById('panel-toggle');
  if(PANEL_TABS.has(id)){
    al.classList.remove('no-panel');
    if(pt) pt.style.display='';
  } else {
    al.classList.add('no-panel');
    if(pt) pt.style.display='none';
    clearDetailPanel();
  }
  history.replaceState(null,'','#'+id);
  if(id==='practice') initSprint();
  if(id==='tools') setTimeout(()=>pwRender(),50);
}

// ── RIGHT PANEL COLLAPSE ──
function toggleRightPanel(){
  const rp=document.getElementById('right-panel');
  const icon=document.getElementById('panel-toggle-icon');
  panelOpen=!panelOpen;
  rp.classList.toggle('collapsed',!panelOpen);
  icon.innerHTML=panelOpen?'<use href="#ic-chevright"/>':'<use href="#ic-chevleft"/>';
  localStorage.setItem('tp-panel-open',panelOpen?'1':'');
}
if(localStorage.getItem('tp-panel-open')===''){
  panelOpen=false;
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('right-panel').classList.add('collapsed');
    document.getElementById('panel-toggle-icon').innerHTML='<use href="#ic-chevleft"/>';
  });
}

// ── SUB-TAB HELPERS ──
function showPracticeSection(id,btn){
  document.querySelectorAll('.practice-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.ptab').forEach(b=>b.classList.remove('active'));
  document.getElementById('practice-'+id).classList.add('active');
  btn.classList.add('active');
  if(id==='sprint') initSprint();
}
function showToolsSection(id,btn){
  document.querySelectorAll('.tools-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.ttab').forEach(b=>b.classList.remove('active'));
  document.getElementById('tools-'+id).classList.add('active');
  btn.classList.add('active');
  if(id==='pathway') pwRender();
}

// ── HELPERS ──
function vc(v){return v&&v.includes('↑')?'vbadge-up':v&&v.includes('↓')?'vbadge-down':'vbadge-nl'}
function vcD(v){return v&&v.includes('↑')?'dvital-up':v&&v.includes('↓')?'dvital-down':'dvital-nl'}
const CAT_COLORS={sympatho:'#0D2B4E',choline:'#0F6E56',anticholine:'#854F0B',opioid:'#4a6b8a',sedative:'#5c6b8a',serotonin:'#3d2a6b',cardiac:'#0B4D3B',env:'#0F6E56'};

// ── DETAIL PANEL ──
function clearDetailPanel(){
  document.getElementById('right-panel').classList.add('empty');
  document.getElementById('rpp').style.display='flex';
  document.getElementById('detail-panel').style.display='none';
  document.getElementById('detail-panel').innerHTML='';
  document.querySelectorAll('.tox-row,.env-row').forEach(r=>r.classList.remove('selected'));
}
function showDetailPanel(html,toxName){
  const rp=document.getElementById('right-panel');
  rp.classList.remove('empty');
  if(!panelOpen){
    panelOpen=true;
    rp.classList.remove('collapsed');
    document.getElementById('panel-toggle-icon').innerHTML='<use href="#ic-chevright"/>';
  }
  document.getElementById('rpp').style.display='none';
  const dp=document.getElementById('detail-panel');
  dp.style.display='block';
  dp.innerHTML=html;
  dp.scrollTop=0;
  if(toxName) addToRecent(toxName);
  setTimeout(()=>{
    renderPerfChart('quiz-perf-canvas','quiz');
    renderPerfChart('sprint-perf-canvas','sprint');
  },100);
}

// ── BODY MAP (SVG with animated dots) ──
function buildBodyMap(tox){
  const regions=getBodyRegions(tox);
  let dots='';
  regions.forEach(r=>{
    const color=r.type==='red'?'var(--blue)':r.type==='teal'?'var(--teal)':'var(--amber)';
    dots+=`<circle cx="${r.x}" cy="${r.y}" r="6" fill="${color}" opacity="0.85">
      <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" begin="${r.x*0.01}s"/>
    </circle>
    <circle cx="${r.x}" cy="${r.y}" r="10" fill="${color}" opacity="0.18"/>`;
    if(r.label) dots+=`<text x="${r.x+12}" y="${r.y+4}" font-size="8.5" fill="${color}" font-family="DM Mono,monospace">${r.label}</text>`;
  });
  return `<svg width="90" height="200" viewBox="0 0 90 200" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="45" cy="22" rx="16" ry="18" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="40" y="38" width="10" height="10" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="25" y="47" width="40" height="60" rx="4" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="10" y="50" width="13" height="45" rx="6" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="67" y="50" width="13" height="45" rx="6" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="28" y="108" width="14" height="55" rx="6" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="48" y="108" width="14" height="55" rx="6" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <circle cx="40" cy="20" r="2.5" fill="var(--border3)" opacity="0.6"/>
  <circle cx="50" cy="20" r="2.5" fill="var(--border3)" opacity="0.6"/>
  ${dots}
  </svg>`;
}
function getBodyRegions(tox){
  const m={
    sympatho:[{x:45,y:20,type:'red',label:'Mydriasis'},{x:45,y:60,type:'red',label:'Tachycardia'},{x:45,y:72,type:'amber',label:'HTN'},{x:45,y:35,type:'amber',label:'↑Temp'},{x:18,y:65,type:'teal',label:'Diaphoresis'}],
    choline:[{x:45,y:20,type:'teal',label:'Miosis'},{x:45,y:60,type:'teal',label:'Bradycardia'},{x:45,y:55,type:'red',label:'Bronchospasm'},{x:18,y:65,type:'teal',label:'Secretions'},{x:45,y:85,type:'amber',label:'DUMBELS'}],
    anticholine:[{x:45,y:20,type:'red',label:'Mydriasis'},{x:45,y:35,type:'red',label:'↑Temp'},{x:45,y:60,type:'amber',label:'Tachycardia'},{x:18,y:65,type:'teal',label:'Dry Skin'},{x:45,y:110,type:'amber',label:'Urinary Ret.'}],
    opioid:[{x:45,y:20,type:'teal',label:'Miosis'},{x:45,y:55,type:'teal',label:'↓Resp'},{x:45,y:60,type:'teal',label:'↓HR'},{x:45,y:130,type:'teal',label:'Hypothermia'}],
    sedative:[{x:45,y:20,type:'teal',label:'Normal pupils'},{x:45,y:55,type:'teal',label:'↓Resp'},{x:45,y:60,type:'teal',label:'↓HR'},{x:18,y:75,type:'amber',label:'Ataxia'}],
    serotonin:[{x:45,y:20,type:'amber',label:'Mydriasis'},{x:45,y:35,type:'red',label:'Hyperthermia'},{x:45,y:60,type:'red',label:'Tachycardia'},{x:18,y:65,type:'amber',label:'Diaphoresis'},{x:45,y:130,type:'red',label:'Clonus'}],
    cardiac:[{x:45,y:60,type:'red',label:'Wide QRS'},{x:45,y:35,type:'amber',label:'HTN/Hypo'},{x:45,y:20,type:'amber',label:'Mydriasis'}],
    env:[{x:45,y:35,type:'red',label:'Thermal'},{x:45,y:60,type:'amber',label:'Cardiac'},{x:45,y:20,type:'amber',label:'CNS'}]
  };
  return m[tox.category||'env']||m.env;
}

// ── DETAIL VIEW BUILDERS ──
function buildToxDetail(t){
  const bm=buildBodyMap(t);
  const regions=getBodyRegions(t);
  const dots=regions.filter(r=>r.label).map(r=>`<div class="bm-legend-item"><div class="bm-dot bm-dot-${r.type}"></div>${r.label}</div>`).join('');
  let guidelineHtml='';
  if(t.mohfw) guidelineHtml+=`<div class="guideline-box"><div class="gl-lbl">MoHFW Guideline</div><div class="gl-text">${t.mohfw}</div></div>`;
  if(t.goldfrank) guidelineHtml+=`<div class="guideline-box" style="margin-top:6px;background:var(--teal-dim);border-color:var(--teal)"><div class="gl-lbl" style="color:var(--teal)">Goldfrank's Toxicologic Emergencies</div><div class="gl-text">${t.goldfrank}</div></div>`;
  return `<div class="detail-scroll">
  <div class="detail-banner">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
      <div style="flex:1">
        <div class="detail-cat">${t.catLabel}</div>
        <div class="detail-name">${t.name}</div>
      </div>
      <button class="hbtn" onclick="printCard()" title="Print" style="flex-shrink:0;margin-top:4px;background:var(--green-dim);border-color:var(--green-mid);color:var(--green)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#ic-print"/></svg>
      </button>
    </div>
    <div class="detail-vitals">
      ${['hr','bp','rr','temp'].map((k,i)=>{const v=t.vitals[k];const labels=['HR','BP','RR','Temp'];return`<div class="dvital ${vcD(v)}"><div class="dvital-val">${v}</div><div class="dvital-lbl">${labels[i]}</div></div>`;}).join('')}
    </div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">${t.agents}</div>
  </div>
  <div class="bodymap-wrap">
    <div class="bodymap-svg-wrap">${bm}</div>
    <div class="bodymap-legend">
      <div class="bm-legend-title">Affected Systems</div>
      ${dots}
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text3)"><div class="bm-dot bm-dot-red"></div>Elevated/Toxic</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text3)"><div style="width:6px;height:6px;border-radius:50%;background:var(--teal)"></div>Depressed</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text3)"><div style="width:6px;height:6px;border-radius:50%;background:var(--amber)"></div>Variable</div>
      </div>
    </div>
  </div>
  <div class="detail-sec"><div class="detail-sec-lbl">Pupils &amp; Skin</div><div class="detail-text">${t.pupils} &middot; ${t.skin}</div></div>
  <div class="detail-sec">
    <div class="detail-sec-lbl">Key Symptoms</div>
    <div class="detail-text">${t.symptoms}</div>
    <div class="tag-list">${t.symTags.map(s=>`<span class="sym-tag sym-key">${s}</span>`).join('')}</div>
  </div>
  <div class="detail-sec"><div class="detail-sec-lbl">Consciousness</div><div class="detail-text">${t.consciousness}</div></div>
  <div class="detail-sec"><div class="detail-sec-lbl">Antidote / Management</div><div class="ant-box">${t.antidote}</div>${guidelineHtml}</div>
  <div class="detail-sec"><div class="detail-sec-lbl">Mnemonic</div><div class="mne-box">${t.mnemonics.replace(/\n/g,'<br>')}</div></div>
  </div>`;
}

function buildEnvDetail(e){
  const bm=`<svg width="90" height="200" viewBox="0 0 90 200" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="45" cy="22" rx="16" ry="18" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="40" y="38" width="10" height="10" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="25" y="47" width="40" height="60" rx="4" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="10" y="50" width="13" height="45" rx="6" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="67" y="50" width="13" height="45" rx="6" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="28" y="108" width="14" height="55" rx="6" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <rect x="48" y="108" width="14" height="55" rx="6" fill="var(--surface2)" stroke="var(--border2)" stroke-width="1.2"/>
  <circle cx="45" cy="35" r="7" fill="var(--blue)" opacity="0.7"><animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite"/></circle>
  <circle cx="45" cy="60" r="6" fill="var(--amber)" opacity="0.7"/>
  <circle cx="45" cy="120" r="5" fill="var(--teal)" opacity="0.6"/>
  </svg>`;
  let guidelineHtml='';
  if(e.mohfw) guidelineHtml+=`<div class="guideline-box"><div class="gl-lbl">MoHFW Guideline</div><div class="gl-text">${e.mohfw}</div></div>`;
  if(e.goldfrank) guidelineHtml+=`<div class="guideline-box" style="margin-top:6px;background:var(--teal-dim);border-color:var(--teal)"><div class="gl-lbl" style="color:var(--teal)">Goldfrank's Toxicologic Emergencies</div><div class="gl-text">${e.goldfrank}</div></div>`;
  return `<div class="detail-scroll">
  <div class="detail-banner">
    <div class="detail-cat">${e.catLabel}</div>
    <div class="detail-name">${e.name}</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">${e.description}</div>
  </div>
  <div class="bodymap-wrap">
    <div class="bodymap-svg-wrap">${bm}</div>
    <div class="bodymap-legend">
      <div class="bm-legend-title">Primary Impact</div>
      <div class="bm-legend-item"><div class="bm-dot bm-dot-red"></div>Head / Thermoregulation</div>
      <div class="bm-legend-item"><div class="bm-dot bm-dot-amber"></div>Cardiovascular</div>
      <div class="bm-legend-item"><div style="width:8px;height:8px;border-radius:50%;background:var(--teal);flex-shrink:0;margin-top:4px"></div>Extremities / Systemic</div>
    </div>
  </div>
  <div class="detail-sec"><div class="detail-sec-lbl">Symptoms</div><div class="detail-text">${e.symptoms}</div></div>
  <div class="detail-sec"><div class="detail-sec-lbl">Management</div><div class="ant-box">${e.management}</div>${guidelineHtml}</div>
  <div class="detail-sec"><div class="detail-sec-lbl">Key Point</div><div class="mne-box">${e.keypoint}</div></div>
  <div class="detail-sec"><div class="detail-sec-lbl">Antidote / Rx</div><div class="detail-text">${e.antidote}</div></div>
  </div>`;
}

// ── DATA ──
const TOXIDROMES=[
  {name:"Sympathomimetic",category:"sympatho",catLabel:"Sympathomimetic",agents:"Cocaine, amphetamines, methamphetamine, MDMA, PCP, caffeine OD, bath salts (cathinones)",vitals:{hr:"↑",bp:"↑",rr:"↑",temp:"↑"},pupils:"Mydriasis (dilated)",skin:"Diaphoretic, flushed",symptoms:"Agitation, tremor, diaphoresis, hypertension, tachycardia, hyperthermia, seizures",consciousness:"Agitated / alert",antidote:"Benzodiazepines (first-line): lorazepam 2–4mg IV or diazepam 5–10mg IV. Phentolamine 2.5–5mg IV for refractory HTN. Avoid β-blockers alone (unopposed α effect).",mohfw:"Stabilise ABC. BZD titration per AIIMS protocol. Active cooling if temp >39°C. Continuous cardiac monitoring. Admit to HDU. Avoid antipsychotics (lower seizure threshold).",goldfrank:"Goldfrank's Ch. 75: BZDs are first-line for agitation and seizures. Phentolamine for pure α-adrenergic hypertension. KEY: diaphoresis (wet) distinguishes from anticholinergic (dry).",mnemonics:"Hot, hypertensive, hyperactive — everything UP.\nKEY: DIAPHORETIC (wet) unlike anticholinergic (dry).",symTags:["tachycardia","hypertension","hyperthermia","mydriasis","diaphoresis","agitation","seizures"]},
  {name:"Cholinergic (Muscarinic)",category:"choline",catLabel:"Cholinergic",agents:"Organophosphates, carbamates, nerve agents (VX, sarin), pilocarpine, muscarine mushrooms",vitals:{hr:"↓",bp:"↓",rr:"↑",temp:"nl"},pupils:"Miosis (pinpoint)",skin:"Diaphoretic, excessive secretions",symptoms:"DUMBELS: Defecation, Urination, Miosis, Bradycardia, Emesis, Lacrimation, Salivation. Bronchorrhoea, bronchospasm, seizures.",consciousness:"Confusion, seizures, coma",antidote:"Atropine 2–4mg IV q5–10min (titrate to DRY secretions, not HR/pupils). Pralidoxime 1–2g IV within 24–36h for organophosphates. BZDs for seizures.",mohfw:"POISONING MANAGEMENT PROTOCOL (MoHFW 2019): Atropinisation until secretions dry. Do NOT stop atropine early. Pralidoxime within golden window. ICU monitoring for respiratory failure.",goldfrank:"Goldfrank's Ch. 113: Atropine reverses muscarinic effects only — give massive doses until secretions dry. Pralidoxime most effective within 4h (prevents ageing). Both antidotes required for organophosphate.",mnemonics:"SLUDGE: Salivation, Lacrimation, Urination, Defecation, GI distress, Emesis.\nDUMBELS: Defecation, Urination, Miosis, Bradycardia, Emesis, Lacrimation, Salivation.",symTags:["bradycardia","miosis","diaphoresis","bronchospasm","vomiting","salivation","lacrimation","seizures","hypotension"]},
  {name:"Anticholinergic",category:"anticholine",catLabel:"Anticholinergic",agents:"Antihistamines (diphenhydramine), TCAs, atropine, scopolamine, jimsonweed, antipsychotics",vitals:{hr:"↑",bp:"↑",rr:"nl",temp:"↑"},pupils:"Mydriasis (dilated)",skin:"DRY, flushed, hot",symptoms:"Hallucinations, delirium, urinary retention, ileus, dry mucous membranes, hyperthermia",consciousness:"Delirium, agitation",antidote:"Physostigmine 1–2mg IV over 5min (PURE anticholinergic ONLY — NEVER in TCA OD). BZDs for agitation. Aggressive cooling. Urinary catheter.",mohfw:"National Poison Management Guideline: Supportive care first. Physostigmine only if QRS normal and TCA excluded. Cooling blankets. Foley catheter.",goldfrank:"Goldfrank's Ch. 48: Physostigmine is diagnostic and therapeutic in pure anticholinergic toxicity. Contraindicated: asthma, cardiac conduction abnormalities, TCA co-ingestion.",mnemonics:"Mad as a hatter · Blind as a bat · Hot as a hare · DRY as a bone · Red as a beet",symTags:["tachycardia","hyperthermia","mydriasis","dryskin","urinaryretention","delirium","flushed"]},
  {name:"Opioid",category:"opioid",catLabel:"Opioid",agents:"Heroin, morphine, oxycodone, fentanyl, methadone, tramadol, loperamide",vitals:{hr:"↓",bp:"↓",rr:"↓↓",temp:"↓"},pupils:"Miosis (pinpoint)",skin:"Cool, pale, clammy",symptoms:"Classic triad: coma, miosis, respiratory depression. Constipation, hyporeflexia. Pulmonary oedema in heroin OD.",consciousness:"Sedated → coma",antidote:"Naloxone 0.4–2mg IV/IM/IN; repeat q2–3min. Start infusion at 2/3 reversal dose/hr for long-acting opioids.",mohfw:"National Drug Dependence Treatment (NDDTC): Naloxone first-line. Titrate to adequate respiration (not full arousal). Observe ≥4h post-last dose.",goldfrank:"Goldfrank's Ch. 38: Naloxone titrated to respiratory adequacy — not to wakefulness (prevents withdrawal). Infusion required for long-acting agents (methadone, extended-release oxycodone).",mnemonics:"3 Ms: Miosis · Moribund (CNS depression) · Minimal respirations.",symTags:["bradycardia","miosis","respiratorydepression","hypotension","hypothermia","coma"]},
  {name:"Sedative-Hypnotic",category:"sedative",catLabel:"Sedative",agents:"Benzodiazepines, barbiturates, GHB, ethanol, carisoprodol, zolpidem",vitals:{hr:"↓",bp:"↓",rr:"↓",temp:"↓"},pupils:"Normal (midsize)",skin:"Normal",symptoms:"CNS depression, slurred speech, ataxia, amnesia. NORMAL pupils — key differentiator from opioids.",consciousness:"Sedated, slurred, ataxic",antidote:"Supportive care. Flumazenil 0.2mg IV q1min for BZDs (CAUTION: seizures in chronic users, TCA co-ingestion). Intubation if apnoea.",mohfw:"Supportive care is cornerstone. Flumazenil use restricted — CI in polypharmacy OD. Monitor for aspiration pneumonia.",goldfrank:"Goldfrank's Ch. 80: No routine flumazenil recommendation given seizure risk. Ethanol co-ingestion common — thiamine 100mg IV before glucose.",mnemonics:"Like opioid but NORMAL pupils.\nAtaxia + slurred speech distinguish from opioid.",symTags:["bradycardia","respiratorydepression","hypotension","hypothermia","ataxia"]},
  {name:"Serotonin Syndrome",category:"serotonin",catLabel:"Serotonin",agents:"SSRIs, SNRIs, MAOIs, linezolid, fentanyl, tramadol, ondansetron, tryptans",vitals:{hr:"↑",bp:"↑",rr:"↑",temp:"↑↑"},pupils:"Mydriasis",skin:"Diaphoretic, flushed",symptoms:"Clonus (spontaneous, inducible, ocular), hyperreflexia, agitation, diaphoresis. RAPID onset (minutes–hours). Hunter Criteria: clonus + serotonergic drug.",consciousness:"Agitated, tremulous",antidote:"Cyproheptadine 12mg PO/NG then 2mg q2h (max 32mg/d). BZDs. Cooling. Severe cases: intubation + non-depolarising NMB.",mohfw:"Discontinue offending agents. Cyproheptadine preferred. ICU for temp >41°C. Avoid physostigmine.",goldfrank:"Goldfrank's Ch. 71: Hunter Serotonin Toxicity Criteria — clonus is pathognomonic. Dantrolene NOT recommended. Differentiate from NMS by onset speed and presence of clonus vs rigidity.",mnemonics:"Serotonin = hyperREFLEXIA + CLONUS + rapid onset.\nContrast NMS = rigidity + slow onset.",symTags:["tachycardia","hypertension","hyperthermia","mydriasis","diaphoresis","clonus","hyperreflexia","agitation"]},
  {name:"Neuroleptic Malignant Syndrome",category:"serotonin",catLabel:"NMS",agents:"Haloperidol, antipsychotics (chlorpromazine, olanzapine), dopaminergic drug withdrawal",vitals:{hr:"↑",bp:"↑↑",rr:"↑",temp:"↑↑↑"},pupils:"Normal",skin:"Diaphoretic",symptoms:"FEVER + LEAD-PIPE RIGIDITY + altered mental status + autonomic instability. SLOW onset (days–weeks). Markedly elevated CK (>1000 U/L).",consciousness:"Altered, may be stuporous",antidote:"Bromocriptine 2.5–10mg TID PO + Dantrolene 2.5mg/kg IV q5min (max 10mg/kg/day). Aggressive cooling. Discontinue offending antipsychotic.",mohfw:"NMS Management (AIIMS Protocol): Discontinue antipsychotic. Bromocriptine dopaminergic agonist. CK monitoring daily. Exclude infectious meningitis.",goldfrank:"Goldfrank's Ch. 71: NMS vs SS — NMS: slow onset, lead-pipe rigidity, bradyreflexia, markedly elevated CK. Bromocriptine restores dopaminergic tone; dantrolene reduces muscle rigidity directly.",mnemonics:"NMS = RIGIDITY (lead-pipe) + SLOW onset.\nHigh CK. Bradyreflexia unlike SS.",symTags:["tachycardia","hypertension","hyperthermia","diaphoresis","rigidity","alteredconsciousness"]},
  {name:"TCA Toxicity",category:"cardiac",catLabel:"Cardiac/TCA",agents:"Amitriptyline, nortriptyline, imipramine, doxepin, clomipramine",vitals:{hr:"↑",bp:"↓",rr:"↑",temp:"↑"},pupils:"Mydriasis",skin:"Dry, flushed (anticholinergic)",symptoms:"Anticholinergic features + QRS widening (>100ms), R-wave in aVR >3mm, ventricular dysrhythmias, seizures, hypotension.",consciousness:"Altered; seizures",antidote:"Sodium bicarbonate 1–2 mEq/kg IV bolus. Target pH 7.45–7.55. Lipid emulsion 20% for refractory arrest. NO physostigmine.",mohfw:"NaHCO3 first-line for QRS >100ms. Do NOT use physostigmine. Intubation for airway protection. Avoid class IA/IC antiarrhythmics.",goldfrank:"Goldfrank's Ch. 73: Serum alkalinisation reverses Na-channel blockade — give as boluses, not infusion. QRS >100ms or R-aVR >3mm: treat immediately. Continuous ECG monitoring ≥6h.",mnemonics:"3 Cs: Cardiovascular (wide QRS) · Convulsions · Coma.\nECG: QRS >100ms = treat with NaHCO3.",symTags:["tachycardia","hypotension","mydriasis","dryskin","wideqrs","seizures","dysrhythmia"]},
  {name:"CCB / Beta Blocker OD",category:"cardiac",catLabel:"Cardiac",agents:"Verapamil, diltiazem, amlodipine (CCB); atenolol, metoprolol, propranolol (BB)",vitals:{hr:"↓↓",bp:"↓↓",rr:"nl",temp:"nl"},pupils:"Normal",skin:"Normal or cool",symptoms:"Bradycardia, hypotension, AV block. CCB: HYPERglycemia (blocks insulin). BB: HYPOglycemia, bronchospasm.",consciousness:"May be alert initially",antidote:"CaCl 1g IV / CaGluconate 3g IV. High-dose Insulin (HIE) 1u/kg bolus. Glucagon 3–10mg IV for BB. Lipid Emulsion 20% for lipophilic agents. ECMO if refractory.",mohfw:"Calcium + HIE combination therapy. Start vasopressors early. ECMO considered at tertiary centres.",goldfrank:"Goldfrank's Ch. 63: High-dose insulin (HIE) improves myocardial inotropy. Calcium first-line. Glucagon for BB only. Lipid emulsion as rescue for lipophilic agents.",mnemonics:"CCB: Calcium + Carbohydrates (High Insulin) + lipid emulsion.\nCCB = HYPERglycemia. BB = HYPOglycemia.",symTags:["bradycardia","hypotension","avblock","dysrhythmia"]},
  {name:"Digoxin Toxicity",category:"cardiac",catLabel:"Cardiac",agents:"Digoxin, digitalis, foxglove, oleander, lily of the valley, Chan Su",vitals:{hr:"↓",bp:"↓",rr:"nl",temp:"nl"},pupils:"Normal",skin:"Normal",symptoms:"Bradycardia, AV block, xanthopsia (yellow-green vision), N/V, hyperkalaemia. Virtually any dysrhythmia possible.",consciousness:"Nausea, confusion",antidote:"Digoxin Immune Fab (DigiFab): Vials = (serum level × wt kg) / 100. Empiric: 10 vials acute, 5 vials chronic. AVOID calcium.",mohfw:"DigiFab availability limited in India — consult AIIMS Poison Centre (011-26589391). Monitor K+. Transvenous pacing if unresponsive.",goldfrank:"Goldfrank's Ch. 65: AVOID calcium — 'stone heart' risk. Post-Fab serum levels unreliable. Haemodialysis ineffective.",mnemonics:"Dig toxicity = Yellow vision + AV block + hyperkalaemia.\nAntidote: Fab fragments.",symTags:["bradycardia","hypotension","avblock","vomiting","dysrhythmia","xanthopsia"]},
  {name:"Acetaminophen (APAP) OD",category:"cardiac",catLabel:"Metabolic",agents:"Paracetamol, Tylenol, Calpol, co-codamol, combination cold/flu remedies",vitals:{hr:"nl",bp:"nl",rr:"nl",temp:"nl"},pupils:"Normal",skin:"Normal (early)",symptoms:"Phase 1 (0–24h): N/V, malaise. Phase 2 (24–72h): RUQ pain, LFT rise. Phase 3 (72–96h): hepatic necrosis, coagulopathy. Phase 4: recovery or fulminant failure.",consciousness:"Alert early; encephalopathy in late stage",antidote:"N-Acetylcysteine (NAC): 150mg/kg IV over 1h → 50mg/kg over 4h → 100mg/kg over 16h. Plot level on Rumack-Matthew nomogram at ≥4h post-ingestion.",mohfw:"NAC is antidote — effective up to 24h. Activated charcoal within 2h if >150mg/kg. LFTs, PT/INR, creatinine monitoring. Contact liver unit if INR >2.",goldfrank:"Goldfrank's Ch. 32: Start NAC immediately if >8h post-ingestion. Extended-release formulations require level at 4h AND 8h. ALF → transplant evaluation.",mnemonics:"4 Phases: LOOKS WELL → RUQ pain → Liver failure → Recovery or death.\nNAC most effective if started within 8h.",symTags:["vomiting","aki","alteredconsciousness"]},
  {name:"Salicylate Toxicity",category:"cardiac",catLabel:"Metabolic",agents:"Aspirin, bismuth subsalicylate, oil of wintergreen (methyl salicylate)",vitals:{hr:"↑",bp:"nl",rr:"↑↑",temp:"↑"},pupils:"Normal",skin:"Diaphoretic",symptoms:"Mixed resp alkalosis + metabolic acidosis (HAGMA), tinnitus, hyperthermia, AMS (late). N/V, dehydration.",consciousness:"AMS = severe toxicity",antidote:"Sodium bicarbonate infusion: target urine pH >7.5. Haemodialysis for severe toxicity (level >100mg/dL, AMS, renal failure).",mohfw:"NaHCO3 infusion mainstay. Monitor glucose. NEVER intubate without extreme caution (lose respiratory compensation).",goldfrank:"Goldfrank's Ch. 39: Urinary alkalinisation requires normal K+. Intubation hazardous. HD indications: AMS, renal failure, level >100mg/dL.",mnemonics:"Tinnitus + Hyperventilation + Acid-base chaos = Aspirin.",symTags:["tachycardia","hyperthermia","diaphoresis","tinnitus","hyperventilation","hagma"]},
  {name:"Toxic Alcohols",category:"sedative",catLabel:"Metabolic",agents:"Methanol (wood alcohol), Ethylene glycol (antifreeze), Isopropanol (rubbing alcohol)",vitals:{hr:"↑",bp:"nl",rr:"↑↑",temp:"nl"},pupils:"Varies",skin:"Normal",symptoms:"HAGMA + osmol gap elevation. MeOH: visual changes → blindness (formate toxicity). EG: calcium oxalate crystals, AKI. IsoPrOH: ketosis WITHOUT acidosis.",consciousness:"Intoxicated; AMS in severe",antidote:"Fomepizole (4-MP) 15mg/kg IV loading dose. Haemodialysis for severe MeOH/EG. Ethanol IV if fomepizole unavailable.",mohfw:"Fomepizole preferred; ethanol infusion if unavailable. Folate 50mg IV for methanol. Early nephrology consultation for EG.",goldfrank:"Goldfrank's Ch. 109–111: Fomepizole standard of care. HD removes both parent alcohols and metabolites. MeOH: add folate. EG: add pyridoxine and thiamine.",mnemonics:"MeOH = formate = Blindness.\nEG = oxalate = AKI.\nBoth: Fomepizole + HD. IsoPrOH = ketones only, NO acidosis.",symTags:["hagma","osmolgap","visualchanges","alteredconsciousness","aki"]}
];

const ENV=[
  {name:"Heat Stroke",catLabel:"Thermal",description:"Core temp >40°C + CNS dysfunction. Classic (elderly, anhidrotic) vs Exertional (athletes, diaphoretic).",symptoms:"Hot dry skin (classic), diaphoresis (exertional), AMS, seizures, multi-organ failure.",management:"RAPID COOLING — target <39°C within 30min. Evaporative cooling or cold water immersion for exertional. Ice packs to neck/groin.",keypoint:"Cooling speed determines mortality. Every minute counts.",antidote:"Cooling; BZDs for shivering/seizures; antipyretics are futile.",mohfw:"National Heat Action Plan (MoHFW): Cool immediately. Oral ORS if conscious. IV fluids if hypotensive. Temperature monitoring q15min.",goldfrank:"Goldfrank's Ch. 29: Core temperature target ≤39°C within 30 min. Cold-water immersion most effective for exertional heat stroke. Dantrolene not indicated."},
  {name:"Heat Exhaustion",catLabel:"Thermal",description:"Volume depletion + electrolyte loss. Core temp usually <40°C. Precursor to heat stroke.",symptoms:"Weakness, dizziness, headache, N/V, cool/pale/moist skin, mild AMS.",management:"Remove from heat. Cool environment. Oral hydration (ORS) or IV NS 500mL bolus. Rest.",keypoint:"Distinguish from heat stroke by CNS status and temperature.",antidote:"Supportive hydration. ORS 200mL q15min if conscious.",mohfw:"MoHFW Heat Action Plan: Oral rehydration first-line. Monitor progression to heat stroke."},
  {name:"Hypothermia",catLabel:"Thermal",description:"Core temp <35°C. Mild 32–35°C, Moderate 28–32°C, Severe <28°C. J (Osborn) waves on ECG.",symptoms:"Shivering lost <32°C, confusion → coma, bradycardia, AF, ventricular fibrillation, asystole.",management:"Passive rewarming (mild), active external (moderate), active internal + ECMO for severe/arrest. Warm humidified O2, warm IV fluids.",keypoint:"'Not dead until warm and dead' — withhold death pronouncement until rewarmed.",antidote:"Rewarming. ECMO. Warm IV fluids (40°C).",goldfrank:"Goldfrank's Ch. 15: ECMO is definitive for refractory cases. Target 37°C before declaring death."},
  {name:"Carbon Monoxide Poisoning",catLabel:"Inhalation",description:"CO binds Hb 250× > O2. Normal pulse oximetry — occult poisoning. Multiple simultaneous victims classic.",symptoms:"Headache, N/V, dizziness, confusion, cherry-red skin (late). Cardiac ischaemia, neuro sequelae.",management:"100% O2 via NRB. HBO for: LOC, COHb >25% (>15% pregnant), cardiac/neuro symptoms. Remove from source.",keypoint:"Pulse ox FALSELY NORMAL. Must use CO-oximetry. Delayed neuro syndrome 15–30%.",antidote:"100% O2 NRB. HBO for severe cases.",mohfw:"CO Poisoning: 100% O2 standard. HBO at designated centres (PGIMER, AIIMS).",goldfrank:"Goldfrank's Ch. 125: 100% O2 halves CO half-life to ~60 min. HBO: COHb >25%, LOC, cardiac symptoms."},
  {name:"Cyanide Poisoning",catLabel:"Inhalation",description:"Inhibits cytochrome oxidase → cellular hypoxia. Smoke inhalation, industrial, nitroprusside.",symptoms:"Severe lactic acidosis, CV collapse, altered consciousness. Smoke inhalation + lactate >8 = assume CN.",management:"Hydroxocobalamin (Cyanokit) 5g IV over 15min. Sodium thiosulfate 12.5g IV. Safe with CO co-exposure.",keypoint:"High lactate + smoke inhalation = CN co-poisoning. CO alone does not cause lactate >10.",antidote:"Hydroxocobalamin 5g IV. Sodium thiosulfate 12.5g IV.",mohfw:"Hydroxocobalamin preferred (safe with CO). Turns urine red-brown — warn staff. Sodium thiosulfate adjunct.",goldfrank:"Goldfrank's Ch. 126: Hydroxocobalamin preferred. Lactate >10 with smoke inhalation is presumptive CN."},
  {name:"Snakebite (Crotalid/Viper)",catLabel:"Envenomation",description:"Haemotoxic + cytotoxic venom. In India: Russell's viper, Saw-scaled viper most common.",symptoms:"Local pain/swelling/ecchymosis, coagulopathy, systemic symptoms, ptosis (krait).",management:"Immobilise, remove jewellery. Polyvalent antivenom first-line. Monitor coags q6h.",keypoint:"20WST (20-minute whole blood clotting test) to detect coagulopathy. Repeat q6h.",antidote:"Polyvalent Snake Antivenom (PSAV): 10 vials IV, repeat 10 vials if no response at 6h.",mohfw:"MoHFW Snakebite Management Protocol 2016: PSAV Indian polyvalent. 20WST diagnostic. DO NOT: tourniquet, cut, suck.",goldfrank:"Goldfrank's Ch. 122: Neostigmine challenge appropriate for neurotoxic envenomation where antivenom unavailable."},
  {name:"High-Altitude Illness",catLabel:"Altitude",description:"AMS → HACE → HAPE. Hypobaric hypoxia above ~2500m (8,000ft).",symptoms:"AMS: headache + 1 other. HACE: ataxia/AMS/confusion. HAPE: dyspnoea at rest, cough, crackles.",management:"DESCEND. Oxygen. Acetazolamide for mild AMS. Dexamethasone for HACE. Nifedipine for HAPE.",keypoint:"HAPE is the most deadly altitude illness. DESCEND is always definitive.",antidote:"Acetazolamide 125–250mg BID; Dex 8mg then 4mg q6h; Nifedipine 30mg ER.",goldfrank:"Goldfrank's Ch. 45: Descent is always definitive. Dexamethasone reduces HACE oedema. Nifedipine reduces pulmonary artery pressure in HAPE."}
];

const ANTIDOTES=[
  {drug:"Naloxone (Narcan)",indication:"Opioid toxicity — respiratory depression",dose:"0.4–2mg IV/IM/IN; repeat q2-3min; infusion at 2/3 reversal dose/hr for long-acting opioids",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 38",extra:"Monitor ≥4–6h. Naloxone half-life 30–90min < most opioids."},
  {drug:"Flumazenil",indication:"Benzodiazepine OD (use cautiously)",dose:"0.2mg IV q1min; max 1mg. AVOID in chronic BZD use, TCAs, seizure history",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 80",extra:"Risk of refractory seizures in dependent patients."},
  {drug:"Atropine",indication:"Organophosphate / cholinergic toxicity",dose:"2–4mg IV q5-10min until secretions dry; may require massive doses (100s mg)",source:"mohfw",sourceLabel:"MoHFW · Goldfrank's Ch. 113",extra:"Titrate to DRY secretions — NOT heart rate or pupils."},
  {drug:"Pralidoxime (2-PAM)",indication:"Organophosphate (oxime reactivation)",dose:"1–2g IV over 15–30min; within 24–36h window",source:"mohfw",sourceLabel:"MoHFW",extra:"Most effective within 4h. Ineffective after ageing."},
  {drug:"N-Acetylcysteine (NAC)",indication:"Acetaminophen OD — hepatotoxicity prevention",dose:"150mg/kg IV over 1h → 50mg/kg over 4h → 100mg/kg over 16h (Prescott)",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 32",extra:"Use Rumack-Matthew nomogram at ≥4h post-ingestion."},
  {drug:"Sodium Bicarbonate",indication:"TCA toxicity (QRS widening), salicylate, Na-channel blockade",dose:"1–2 mEq/kg IV bolus; target pH 7.45–7.55 for TCA; target urine pH >7.5 for salicylate",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 73",extra:"BOLUSES for TCA. INFUSION for salicylate."},
  {drug:"Physostigmine",indication:"Pure anticholinergic toxicity (NOT TCAs)",dose:"1–2mg IV over 5min; CI: TCA co-ingestion, asthma, cardiac conduction disease",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 48"},
  {drug:"Fomepizole (4-MP)",indication:"Methanol / Ethylene glycol poisoning",dose:"15mg/kg IV loading, 10mg/kg q12h ×4 doses, then 15mg/kg q12h",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 109",extra:"Ethanol IV (10% in D5W) if fomepizole unavailable."},
  {drug:"Calcium Chloride / Gluconate",indication:"CCB OD, hyperkalemia, HF toxicity",dose:"CaCl 1g IV (10mL of 10%); CaGluconate 3g IV; repeat q10-20min",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 63"},
  {drug:"High-dose Insulin (HIE)",indication:"CCB / BB OD with haemodynamic instability",dose:"1 unit/kg IV bolus, then 0.5–2 units/kg/hr + dextrose (glucose 100–250)",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 63",extra:"Monitor glucose and K+."},
  {drug:"Glucagon",indication:"Beta-blocker OD",dose:"3–10mg IV bolus (causes vomiting — have suction ready), then 3–5mg/hr infusion",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 63"},
  {drug:"Lipid Emulsion (ILE)",indication:"Lipophilic drug toxicity (LA, CCB, BBs, TCAs)",dose:"1.5mL/kg 20% intralipid IV over 1min; repeat ×2 if no response; max 3 doses",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 66"},
  {drug:"Cyproheptadine",indication:"Serotonin syndrome",dose:"12mg PO/NG initially, then 2mg q2h prn; max 32mg/day",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 71"},
  {drug:"Dantrolene",indication:"NMS, malignant hyperthermia",dose:"2.5mg/kg IV q5min; max 10mg/kg. Reconstitute with sterile water.",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 71"},
  {drug:"Digoxin Immune Fab",indication:"Digoxin/cardiac glycoside toxicity",dose:"Vials = (level × wt kg)/100; empiric 10 vials acute, 5 vials chronic; AVOID Ca",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 65",extra:"AIIMS Poison Centre: 011-26589391"},
  {drug:"Methylene Blue",indication:"Methemoglobinaemia",dose:"1–2mg/kg IV over 5min; repeat once if needed; CI: G6PD deficiency",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 127"},
  {drug:"Hydroxocobalamin",indication:"Cyanide poisoning",dose:"5g IV over 15min; repeat ×3 if needed; SAFE with CO co-exposure",source:"goldfrank",sourceLabel:"Goldfrank's Ch. 126"},
  {drug:"Polyvalent Snake Antivenom",indication:"Viper / cobra envenomation (India)",dose:"10 vials IV in NS over 1h; repeat if 20WST positive at 6h; DILUTE appropriately",source:"mohfw",sourceLabel:"MoHFW 2016",extra:"Indian PSAV: Bharat Serums / Serum Institute. Monitor for anaphylaxis."}
];

const CALCULATORS=[
  {id:'naloxone',name:'Naloxone',ind:"Opioid reversal · Goldfrank's Ch. 38",fields:[{id:'wt',label:'Weight (kg)',ph:'70',type:'number'},{id:'rd',label:'Effective reversal dose (mg)',ph:'0.4',type:'number'}],
    calc(f){const wt=+f.wt||70,rd=+f.rd||0.4;return[{l:'Initial bolus',v:'0.4–2mg IV/IM/IN',n:'Start 0.4mg; titrate up to effect.'},{l:'Repeat interval',v:'Every 2–3 min'},{l:'Maintenance infusion',v:`${(rd*0.667).toFixed(2)}mg/hr`,n:`2/3 of effective reversal dose (${rd}mg)/hr.`},{l:'Monitoring duration',v:'≥4–6h after last dose',n:'Longer for long-acting opioids (methadone).'}];},
    warn:'Naloxone half-life 30–90min < most opioids. Start infusion for long-acting agents.'},
  {id:'nac',name:'NAC (Acetaminophen)',ind:"Acetaminophen OD · Goldfrank's Ch. 32",fields:[{id:'wt',label:'Weight (kg)',ph:'70',type:'number'},{id:'apap',label:'APAP level (mcg/mL)',ph:'180',type:'number'},{id:'hrs',label:'Hours post-ingestion',ph:'6',type:'number'}],
    calc(f){const wt=+f.wt||70,d1=150*wt,d2=50*wt,d3=100*wt;return[{l:'Bag 1 — Loading',v:`${d1}mg (150mg/kg)`,n:'In 200mL D5W over 1 hour.'},{l:'Bag 2',v:`${d2}mg (50mg/kg)`,n:'In 500mL D5W over 4 hours.'},{l:'Bag 3',v:`${d3}mg (100mg/kg)`,n:'In 1000mL D5W over 16 hours.'},{l:'Total NAC',v:`${(d1+d2+d3).toLocaleString()}mg`}];},
    postRender:function(){renderNomogram();},
    warn:'Plot APAP level on Rumack-Matthew nomogram at ≥4h. Begin NAC immediately if >8h post-ingestion.'},
  {id:'digfab',name:'Digoxin Fab',ind:"Digoxin toxicity · Goldfrank's Ch. 65",fields:[{id:'wt',label:'Weight (kg)',ph:'70',type:'number'},{id:'lv',label:'Serum level (ng/mL)',ph:'4.2',type:'number'}],
    calc(f){const wt=+f.wt||70,lv=+f.lv||0,vm=lv?Math.ceil((lv*wt)/100):null;return[{l:'Formula-based vials',v:vm?`${vm} vials (${vm*40}mg)`:'Enter level above',n:'Each vial = 40mg DigiFab.'},{l:'Empiric — acute OD',v:'10–20 vials'},{l:'Empiric — chronic OD',v:'3–6 vials'},{l:'Administration',v:'IV over 30 min',n:'Effect in 20–60 min.'}];},
    warn:'AVOID calcium in digoxin toxicity. Post-Fab serum levels unreliable.'},
  {id:'atropine',name:'Atropine (OP)',ind:"Organophosphate poisoning · MoHFW / Goldfrank's Ch. 113",fields:[{id:'wt',label:'Weight (kg)',ph:'70',type:'number'},{id:'sev',label:'Severity',type:'select',opts:['Mild (DUMBELS only)','Moderate (bronchospasm)','Severe (bronchorrhoea + resp failure)']}],
    calc(f){const wt=+f.wt||70,sev=f.sev||'';const init=sev.includes('Mild')?'1–2':sev.includes('Severe')?'4–8':'2–4';return[{l:'Initial bolus',v:`${init}mg IV`,n:'Repeat every 5–10 min until secretions dry.'},{l:'Strategy',v:'Double dose q5min if no response'},{l:'Endpoint',v:'DRY secretions',n:'HR and pupils are NOT endpoints.'},{l:'Pralidoxime',v:`${(wt*0.02).toFixed(1)}g IV (20mg/kg)`,n:'Over 15–30 min. Within 24–36h.'}];},
    warn:'Atropine reverses MUSCARINIC only. Pralidoxime reverses NICOTINIC. Give BOTH.'},
  {id:'hie',name:'High-Dose Insulin',ind:"CCB/BB toxicity · Goldfrank's Ch. 63",fields:[{id:'wt',label:'Weight (kg)',ph:'70',type:'number'},{id:'glc',label:'Current glucose (mmol/L)',ph:'6.5',type:'number'}],
    calc(f){const wt=+f.wt||70,glc=+f.glc||6.5;return[{l:'Insulin bolus',v:`${wt} units (1u/kg)`,n:'Regular insulin IV push.'},{l:'Insulin infusion',v:`${Math.round(wt*0.5)}–${wt*2} units/hr`},{l:'Dextrose bolus',v:glc<6?'50mL D50W IV':'Not required now',n:'Target glucose 5.5–13.9 mmol/L.'},{l:'K+ target',v:'>3.5 mmol/L',n:'Monitor closely.'}];},
    warn:'Onset 15–45 min. Maintain glucose >100mg/dL throughout.'},
  {id:'bicarb',name:'Sodium Bicarbonate',ind:"TCA / Salicylate · Goldfrank's Ch. 73",fields:[{id:'wt',label:'Weight (kg)',ph:'70',type:'number'},{id:'ind',label:'Indication',type:'select',opts:['TCA (QRS widening)','Salicylate (urinary alkalinisation)','Both']}],
    calc(f){const wt=+f.wt||70,meq=Math.round(wt*1.5);return[{l:'Bolus dose',v:`${meq} mEq IV`,n:`${meq}mL 8.4% NaHCO3.`},{l:'TCA target',v:'Serum pH 7.45–7.55'},{l:'Salicylate target',v:'Urine pH >7.5',n:'Add 3 amps to 1L D5W at 1.5–2× maintenance.'},{l:'K+ target',v:'≥4.0 mmol/L',n:'Hypokalaemia prevents urinary alkalinisation.'}];},
    warn:'BOLUSES for TCA. INFUSION for salicylate. NEVER intubate salicylate without extreme caution.'},
  {id:'methb',name:'Methylene Blue',ind:"Methemoglobinaemia · Goldfrank's Ch. 127",fields:[{id:'wt',label:'Weight (kg)',ph:'70',type:'number'}],
    calc(f){const wt=+f.wt||70,mg=wt*2,ml=(mg/10).toFixed(1);return[{l:'Dose',v:`${mg}mg (2mg/kg)`,n:`${ml}mL of 10mg/mL over 5 min.`},{l:'Repeat',v:'Same dose after 30–60 min if needed'},{l:'Maximum',v:'7mg/kg total'}];},
    warn:'CONTRAINDICATED in G6PD deficiency — use ascorbic acid 1–2g IV instead.'},
  {id:'snakebite',name:'Snake Antivenom',ind:"Snakebite (India) · MoHFW 2016",fields:[{id:'wt',label:'Weight (kg)',ph:'70',type:'number'},{id:'sev',label:'Severity',type:'select',opts:['20WST positive (coagulopathy)','Neurotoxic (ptosis/ophthalmoplegia)','Haemotoxic (local necrosis)','Systemic (haemodynamic)']}],
    calc(f){return[{l:'Initial antivenom',v:'10 vials PSAV IV in 100mL NS',n:'Over 1 hour. Premedicate: epinephrine 0.25mg SC.'},{l:'Repeat dosing',v:'10 vials if 20WST still positive at 6h'},{l:'Neurotoxic adjunct',v:'Neostigmine 0.01mg/kg IV + atropine 0.6mg IV',n:'For cobra/krait envenomation.'},{l:'Monitor for',v:'Anaphylaxis — have epinephrine drawn up'}];},
    warn:"MoHFW 2016 protocol. Polyvalent covers Big Four: Russell's viper, Saw-scaled viper, Common krait, Indian cobra."}
];

const SYM_OPTIONS=[
  {id:"tachycardia",label:"Tachycardia",icon:"heart"},{id:"bradycardia",label:"Bradycardia",icon:"heart"},
  {id:"hypertension",label:"Hypertension",icon:"up"},{id:"hypotension",label:"Hypotension",icon:"up"},
  {id:"hyperthermia",label:"Hyperthermia",icon:"thermo"},{id:"hypothermia",label:"Hypothermia",icon:"thermo"},
  {id:"mydriasis",label:"Mydriasis (dilated)",icon:"eye"},{id:"miosis",label:"Miosis (pinpoint)",icon:"eye"},
  {id:"diaphoresis",label:"Diaphoresis",icon:"droplet"},{id:"dryskin",label:"Dry Skin",icon:"wind"},
  {id:"flushed",label:"Flushed",icon:"thermo"},{id:"agitation",label:"Agitation",icon:"bolt"},
  {id:"coma",label:"Coma / Sedation",icon:"brain"},{id:"delirium",label:"Delirium",icon:"brain"},
  {id:"alteredconsciousness",label:"Altered Consciousness",icon:"brain"},{id:"seizures",label:"Seizures",icon:"bolt"},
  {id:"clonus",label:"Clonus",icon:"pathway"},{id:"hyperreflexia",label:"Hyperreflexia",icon:"bolt"},
  {id:"rigidity",label:"Rigidity",icon:"bolt"},{id:"ataxia",label:"Ataxia",icon:"pathway"},
  {id:"bronchospasm",label:"Bronchospasm",icon:"wind"},{id:"respiratorydepression",label:"Resp. Depression",icon:"wind"},
  {id:"hyperventilation",label:"Hyperventilation",icon:"wind"},{id:"vomiting",label:"Vomiting / N/V",icon:"warning"},
  {id:"salivation",label:"Salivation / Secretions",icon:"droplet"},{id:"lacrimation",label:"Lacrimation",icon:"droplet"},
  {id:"urinaryretention",label:"Urinary Retention",icon:"warning"},{id:"tinnitus",label:"Tinnitus",icon:"warning"},
  {id:"visualchanges",label:"Visual Changes",icon:"eye"},{id:"xanthopsia",label:"Yellow Vision",icon:"eye"},
  {id:"wideqrs",label:"Wide QRS",icon:"heart"},{id:"avblock",label:"AV Block",icon:"heart"},
  {id:"dysrhythmia",label:"Dysrhythmia",icon:"heart"},{id:"hagma",label:"HAGMA",icon:"flask"},
  {id:"osmolgap",label:"Osmol Gap",icon:"flask"},{id:"aki",label:"AKI",icon:"flask"}
];

const CASES=[
  {difficulty:'easy',vitals:[{val:"148",label:"HR",cls:"sv-high"},{val:"185/110",label:"BP",cls:"sv-high"},{val:"22",label:"RR",cls:"sv-normal"},{val:"38.8°",label:"Temp",cls:"sv-high"}],symptoms:"Patient agitated, diaphoretic, grinding teeth. Dilated pupils. Found at music festival.",answer:"Sympathomimetic",options:["Sympathomimetic","Anticholinergic","Serotonin Syndrome","Cholinergic"],explanation:"Sympathomimetic: agitation + DIAPHORESIS + mydriasis + tachycardia + HTN. Key diff from anticholinergic: DIAPHORESIS (sympatho = wet; anticholinergic = dry). Goldfrank's Ch. 75."},
  {difficulty:'easy',vitals:[{val:"52",label:"HR",cls:"sv-low"},{val:"88/60",label:"BP",cls:"sv-low"},{val:"10",label:"RR",cls:"sv-low"},{val:"36.1°",label:"Temp",cls:"sv-low"}],symptoms:"Found unconscious in alley. Pinpoint pupils. Slow, shallow breathing.",answer:"Opioid Toxidrome",options:["Opioid Toxidrome","Sedative-Hypnotic","Cholinergic","TCA Toxicity"],explanation:"Classic opioid triad: COMA + MIOSIS + RESPIRATORY DEPRESSION. Sedatives don't cause miosis. (Goldfrank's Ch. 38)"},
  {difficulty:'easy',vitals:[{val:"110",label:"HR",cls:"sv-high"},{val:"140/90",label:"BP",cls:"sv-high"},{val:"20",label:"RR",cls:"sv-normal"},{val:"39.2°",label:"Temp",cls:"sv-high"}],symptoms:"Confused elderly woman. Hot, DRY, flushed skin. Dilated pupils. Unable to urinate. Took multiple diphenhydramine.",answer:"Anticholinergic",options:["Anticholinergic","Sympathomimetic","Serotonin Syndrome","NMS"],explanation:"Anticholinergic: HOT + DRY + FLUSHED + mydriasis + urinary retention. KEY diff from sympathomimetic: DRY skin. (Goldfrank's Ch. 48)"},
  {difficulty:'easy',vitals:[{val:"50",label:"HR",cls:"sv-low"},{val:"82/55",label:"BP",cls:"sv-low"},{val:"16",label:"RR",cls:"sv-normal"},{val:"36.8°",label:"Temp",cls:"sv-normal"}],symptoms:"Empty Calan SR (verapamil) bottle. Blood glucose 14.5 mmol/L. First-degree AV block on ECG.",answer:"CCB Overdose",options:["CCB Overdose","Beta Blocker OD","Digoxin Toxicity","Clonidine OD"],explanation:"CCB: bradycardia + hypotension + HYPERGLYCEMIA + AV block. BBs cause HYPOglycemia. Treat: CaCl, high-dose insulin, lipid emulsion. (Goldfrank's Ch. 63)"},
  {difficulty:'easy',vitals:[{val:"38",label:"HR",cls:"sv-low"},{val:"78/50",label:"BP",cls:"sv-low"},{val:"14",label:"RR",cls:"sv-normal"},{val:"37.0°",label:"Temp",cls:"sv-normal"}],symptoms:"On digoxin for AF. N/V for 2 days. Seeing yellow-green halos. K+ 6.1 mmol/L.",answer:"Digoxin Toxicity",options:["Digoxin Toxicity","CCB Overdose","Beta Blocker OD","Hyperkalaemia"],explanation:"Digoxin toxicity: xanthopsia + bradycardia/AV block + hyperkalaemia. Treat with DigiFab. AVOID calcium. (Goldfrank's Ch. 65)"},
  {difficulty:'medium',vitals:[{val:"130",label:"HR",cls:"sv-high"},{val:"155/95",label:"BP",cls:"sv-high"},{val:"20",label:"RR",cls:"sv-normal"},{val:"40.1°",label:"Temp",cls:"sv-high"}],symptoms:"Fluoxetine + tramadol started yesterday. Tremor, ankle clonus, hyperreflexia, very anxious.",answer:"Serotonin Syndrome",options:["Serotonin Syndrome","NMS","Sympathomimetic","Anticholinergic"],explanation:"SSRI + tramadol → CLONUS + HYPERREFLEXIA + hyperthermia. Rapid onset. Key diff from NMS: clonus + hyperreflexia vs lead-pipe rigidity. (Goldfrank's Ch. 71)"},
  {difficulty:'medium',vitals:[{val:"26",label:"HR",cls:"sv-low"},{val:"68/45",label:"BP",cls:"sv-low"},{val:"12",label:"RR",cls:"sv-normal"},{val:"36.5°",label:"Temp",cls:"sv-normal"}],symptoms:"Empty atenolol bottles. Blood glucose 2.4 mmol/L. Bradycardia unresponsive to atropine.",answer:"Beta Blocker OD",options:["Beta Blocker OD","CCB Overdose","Digoxin Toxicity","Vagal excess"],explanation:"BB: bradycardia + hypotension + HYPOGLYCEMIA + bronchospasm. Unlike CCB (hyperglycaemia). Treat: glucagon, high-dose insulin. (Goldfrank's Ch. 63)"},
  {difficulty:'medium',vitals:[{val:"118",label:"HR",cls:"sv-high"},{val:"148/92",label:"BP",cls:"sv-high"},{val:"28",label:"RR",cls:"sv-high"},{val:"38.4°",label:"Temp",cls:"sv-high"}],symptoms:"Tinnitus for hours. Whole bottle of aspirin. ABG: pH 7.52, pCO2 28, HCO3 22.",answer:"Salicylate Toxicity",options:["Salicylate Toxicity","Sympathomimetic","Serotonin Syndrome","Thyroid Storm"],explanation:"Salicylates: tinnitus + PRIMARY respiratory alkalosis (early) → later HAGMA. Treat: NaHCO3 infusion, target urine pH >7.5. (Goldfrank's Ch. 39)"},
  {difficulty:'medium',vitals:[{val:"95",label:"HR",cls:"sv-normal"},{val:"110/70",label:"BP",cls:"sv-normal"},{val:"18",label:"RR",cls:"sv-normal"},{val:"37.0°",label:"Temp",cls:"sv-normal"}],symptoms:"Drank home-made booze. Visual blurring. Anion gap 24, osmol gap 18. pH 7.22.",answer:"Methanol Poisoning",options:["Methanol Poisoning","Ethylene Glycol","Isopropanol","Ethanol"],explanation:"Methanol: HAGMA + elevated osmol gap + VISUAL SYMPTOMS (formic acid injures retina). Fomepizole + HD. (Goldfrank's Ch. 109)"},
  {difficulty:'hard',vitals:[{val:"142",label:"HR",cls:"sv-high"},{val:"88/55",label:"BP",cls:"sv-low"},{val:"24",label:"RR",cls:"sv-high"},{val:"37.8°",label:"Temp",cls:"sv-high"}],symptoms:"ECG: QRS 130ms, R wave in aVR >3mm. Seizing on arrival. Dilated pupils, skin dry.",answer:"TCA Toxicity",options:["TCA Toxicity","Sympathomimetic","Hyperkalaemia","Na-channel blockade"],explanation:"TCA: anticholinergic features + QRS >100ms + R-wave aVR >3mm + seizures + hypotension. NaHCO3 boluses. NO physostigmine. (Goldfrank's Ch. 73)"},
  {difficulty:'hard',vitals:[{val:"62",label:"HR",cls:"sv-low"},{val:"80/55",label:"BP",cls:"sv-low"},{val:"18",label:"RR",cls:"sv-normal"},{val:"36.6°",label:"Temp",cls:"sv-normal"}],symptoms:"Works at pest control. Excessive secretions, vomiting, pinpoint pupils, fasciculations.",answer:"Organophosphate Poisoning",options:["Organophosphate Poisoning","Opioid","Cholinergic (other)","Clonidine OD"],explanation:"OP poisoning: DUMBELS + bronchorrhoea + fasciculations. Massive atropine + pralidoxime within 24–36h. (Goldfrank's Ch. 113)"},
  {difficulty:'hard',vitals:[{val:"99",label:"HR",cls:"sv-normal"},{val:"100/65",label:"BP",cls:"sv-normal"},{val:"16",label:"RR",cls:"sv-normal"},{val:"37.0°",label:"Temp",cls:"sv-normal"}],symptoms:"SpO2 99%. Multiple family members unwell. Generator in garage. Headache, weakness, confusion.",answer:"Carbon Monoxide Poisoning",options:["Carbon Monoxide Poisoning","Viral illness","Serotonin Syndrome","Sepsis"],explanation:"CO: NORMAL pulse oximetry despite serious toxicity. Multiple family + generator + enclosed space = CO until proven otherwise. (Goldfrank's Ch. 125)"},
  {difficulty:'hard',vitals:[{val:"120",label:"HR",cls:"sv-high"},{val:"135/88",label:"BP",cls:"sv-high"},{val:"22",label:"RR",cls:"sv-normal"},{val:"40.6°",label:"Temp",cls:"sv-high"}],symptoms:"ICU patient on haloperidol ×5 days. Now rigid, drooling, unresponsive. CK 12,000 U/L.",answer:"Neuroleptic Malignant Syndrome",options:["NMS","Serotonin Syndrome","Malignant Hyperthermia","Heat Stroke"],explanation:"NMS: antipsychotic + LEAD-PIPE RIGIDITY + hyperthermia + markedly elevated CK + SLOW onset (days). Dantrolene + bromocriptine. (Goldfrank's Ch. 71)"}
];

const QUIZ_SOURCE=[
  {q:"A 24-year-old from a rave — agitation, diaphoresis, HR 148, BP 180/100, dilated pupils, hyperthermia. Best initial treatment?",opts:["Haloperidol 5mg IM","Lorazepam 2mg IV","Metoprolol 5mg IV","Physostigmine 1mg IV"],ans:1,exp:"Sympathomimetic toxidrome. BZDs are first-line. Beta-blockers alone are contraindicated (unopposed α effect). Haloperidol lowers seizure threshold. (Goldfrank's Ch. 75)",topic:"Sympathomimetic"},
  {q:"Hallmark difference between Serotonin Syndrome and NMS:",opts:["SS has higher temps","Clonus/hyperreflexia (SS) vs lead-pipe rigidity (NMS)","Diaphoresis is only in NMS","NMS has faster onset"],ans:1,exp:"SS: clonus, hyperreflexia, rapid onset (minutes–hours). NMS: lead-pipe rigidity, bradyreflexia, slow onset (days–weeks). High CK in NMS. (Goldfrank's Ch. 71)",topic:"Serotonin/NMS"},
  {q:"Naloxone 0.4mg given → patient wakes, then re-sedated at 30 minutes. Best next step?",opts:["Another 0.4mg bolus only","Start naloxone infusion at 2/3 of reversal dose per hour","Intubate immediately","Give flumazenil 0.2mg IV"],ans:1,exp:"Naloxone half-life 30–90min < most opioids. Start infusion at 2/3 of effective reversal dose per hour. (Goldfrank's Ch. 38)",topic:"Opioid"},
  {q:"Bradycardia, hypotension, hyperglycaemia, 1st-degree AV block after ingestion. Most likely toxin?",opts:["Beta-blocker","Calcium channel blocker","Digoxin","Clonidine"],ans:1,exp:"Hyperglycaemia is the KEY differentiator: CCBs block pancreatic insulin release. BBs cause HYPOglycaemia. (Goldfrank's Ch. 63)",topic:"CCB/BB OD"},
  {q:"SLUDGE / DUMBELS mnemonic describes which toxidrome?",opts:["Anticholinergic","Cholinergic (Organophosphate)","Sympathomimetic","Serotonin Syndrome"],ans:1,exp:"SLUDGE = Salivation, Lacrimation, Urination, Defecation, GI, Emesis. Cholinergic/organophosphate toxidrome. (Goldfrank's Ch. 113)",topic:"Cholinergic"},
  {q:"TCA OD with QRS >120ms. First-line treatment?",opts:["Lidocaine 1.5mg/kg IV","Sodium bicarbonate 1–2 mEq/kg IV","Magnesium sulphate 2g IV","Activated charcoal via NG"],ans:1,exp:"NaHCO3 alkalinises serum and provides Na load — given as boluses. Physostigmine CONTRAINDICATED in TCA. (Goldfrank's Ch. 73)",topic:"TCA Toxicity"},
  {q:"Hiker collapses at high altitude — ataxia, confusion, severe headache. Most important intervention?",opts:["Acetazolamide 250mg PO","Dexamethasone 8mg IV","Descent to lower altitude","Supplemental O2 via nasal cannula"],ans:2,exp:"HACE — descent is ALWAYS definitive. O2 and dexamethasone are adjuncts only. (Goldfrank's Ch. 45)",topic:"High-Altitude Illness"},
  {q:"Multiple family members have headache, confusion, normal SpO2 after indoor generator use. First action?",opts:["Order ABG with pH only","100% O2 via NRB + order CO-oximetry","Discharge — O2 sat normal","Give hydroxocobalamin empirically"],ans:1,exp:"CO poisoning — pulse oximetry FALSELY NORMAL. 100% O2 halves CO half-life. (Goldfrank's Ch. 125)",topic:"Carbon Monoxide"},
  {q:"Which finding best differentiates ethylene glycol from methanol toxicity?",opts:["High anion gap metabolic acidosis","Calcium oxalate crystals / AKI (EG) vs visual loss (MeOH)","Osmol gap elevation","High serum osmolality"],ans:1,exp:"Methanol = retinal toxicity (formate) → blindness. Ethylene glycol = oxalate crystals → AKI. (Goldfrank's Ch. 109–111)",topic:"Toxic Alcohols"},
  {q:"Atropine for organophosphate poisoning should be titrated until:",opts:["HR normalises to 60–100","Pupils are dilated","Bronchial secretions are dry","RBC cholinesterase normalises"],ans:2,exp:"Titrate atropine to DRYING OF SECRETIONS, not HR or pupils. (MoHFW 2019; Goldfrank's Ch. 113)",topic:"Cholinergic"},
  {q:"Snakebite with positive 20WST. India — first-line management:",opts:["Observation only","Polyvalent Snake Antivenom 10 vials IV","Fresh frozen plasma + platelets","Tranexamic acid"],ans:1,exp:"MoHFW 2016 protocol: PSAV 10 vials IV over 1h. Premedicate with epinephrine 0.25mg SC.",topic:"Snakebite"},
  {q:"Smoke inhalation victim — lactate 12 mmol/L, not improving on high-flow O2:",opts:["CO poisoning alone — increase FiO2","Suspect cyanide co-poisoning — give hydroxocobalamin","Sepsis — start antibiotics","ARDS — intubate"],ans:1,exp:"High lactate (>10) + smoke inhalation = CN co-poisoning. Hydroxocobalamin 5g IV safe with CO. (Goldfrank's Ch. 126)",topic:"Cyanide Poisoning"}
];

// ── PATHWAY DATA ──
const PW_TOX={
  serotonin:{name:"Serotonin Syndrome",color:"#5c2a6b",agents:"SSRIs, SNRIs, MAOIs, tramadol, linezolid, ondansetron",vitals:{hr:"↑",bp:"↑",rr:"↑",temp:"↑↑"},antidote:"Cyproheptadine 12mg PO/NG → 2mg q2h. BZDs. Cooling.",mnemonic:"Serotonin = CLONUS + hyperreflexia + RAPID onset. (Ch. 71)",key:"Clonus · Hyperreflexia · Rapid onset"},
  nms:{name:"Neuroleptic Malignant Syndrome",color:"#0F6E56",agents:"Antipsychotics, dopaminergic withdrawal",vitals:{hr:"↑",bp:"↑↑",rr:"↑",temp:"↑↑↑"},antidote:"Bromocriptine 2.5–10mg TID + Dantrolene 2.5mg/kg IV. Cooling.",mnemonic:"NMS = RIGIDITY (lead-pipe) + SLOW onset. High CK. (Ch. 71)",key:"Lead-pipe rigidity · Slow onset · High CK"},
  anticholinergic:{name:"Anticholinergic",color:"#854F0B",agents:"Antihistamines, TCAs, atropine, jimsonweed",vitals:{hr:"↑",bp:"↑",rr:"nl",temp:"↑"},antidote:"Physostigmine 1–2mg IV (pure anticholinergic only). BZDs. Cooling.",mnemonic:"Mad as a hatter · DRY as a bone · Red as a beet (Ch. 48)",key:"DRY skin · Urinary retention · Hallucinations"},
  sympathomimetic:{name:"Sympathomimetic",color:"#C0392B",agents:"Cocaine, amphetamines, MDMA, bath salts",vitals:{hr:"↑",bp:"↑",rr:"↑",temp:"↑"},antidote:"BZDs (first-line). Phentolamine for refractory HTN.",mnemonic:"Like anticholinergic but DIAPHORETIC. Everything UP. (Ch. 75)",key:"Diaphoresis (WET) · Agitation · HTN + Tachycardia"},
  tca:{name:"TCA Toxicity",color:"#C0392B",agents:"Amitriptyline, nortriptyline, imipramine",vitals:{hr:"↑",bp:"↓",rr:"↑",temp:"↑"},antidote:"NaHCO3 1–2mEq/kg IV bolus. Target pH 7.45–7.55. NO physostigmine.",mnemonic:"QRS > 100ms = treat with NaHCO3. (Ch. 73)",key:"Wide QRS · R-wave aVR · Seizures + Hypotension"},
  cholinergic:{name:"Cholinergic",color:"#0F6E56",agents:"Organophosphates, carbamates, nerve agents",vitals:{hr:"↓",bp:"↓",rr:"↑",temp:"nl"},antidote:"Atropine 2–4mg IV q5-10min to DRY secretions. Pralidoxime 1–2g IV.",mnemonic:"DUMBELS: Defecation, Urination, Miosis, Bradycardia, Emesis, Lacrimation, Salivation (Ch. 113)",key:"Miosis + WET · DUMBELS · Bronchorrhoea"},
  opioid:{name:"Opioid",color:"#6b5c2a",agents:"Heroin, morphine, oxycodone, fentanyl",vitals:{hr:"↓",bp:"↓",rr:"↓↓",temp:"↓"},antidote:"Naloxone 0.4–2mg IV/IM/IN. Repeat q2-3min. Infusion for long-acting.",mnemonic:"3 Ms: Miosis · Moribund · Minimal respirations. (Ch. 38)",key:"Miosis + CNS depression + Resp. depression"},
  sedative:{name:"Sedative-Hypnotic",color:"#5c6b8a",agents:"BZDs, barbiturates, GHB, ethanol",vitals:{hr:"↓",bp:"↓",rr:"↓",temp:"↓"},antidote:"Supportive. Flumazenil 0.2mg IV q1min (caution: seizures).",mnemonic:"Like opioids but NORMAL pupils. Ataxia + slurred speech. (Ch. 80)",key:"Normal pupils · Ataxia · No miosis"},
  salicylate:{name:"Salicylate Toxicity",color:"#854F0B",agents:"Aspirin, oil of wintergreen",vitals:{hr:"↑",bp:"nl",rr:"↑↑",temp:"↑"},antidote:"NaHCO3 infusion — target urine pH >7.5. HD for severe.",mnemonic:"Tinnitus + Hyperventilation + Acid-base chaos = Aspirin. (Ch. 39)",key:"Tinnitus · HAGMA + Resp. Alkalosis"},
  toxic_alcohol:{name:"Toxic Alcohol (MeOH/EG)",color:"#0F6E56",agents:"Methanol (wood alcohol), Ethylene glycol (antifreeze)",vitals:{hr:"↑",bp:"nl",rr:"↑↑",temp:"nl"},antidote:"Fomepizole 15mg/kg IV. HD for severe MeOH/EG.",mnemonic:"MeOH = Blindness. EG = AKI. Both: Fomepizole + HD. (Ch. 109–111)",key:"HAGMA + Osmol gap · Visual changes (MeOH) · AKI (EG)"}
};

const PW_STEPS=[
  {id:"pupils",label:"Step 1 — Pupils",icon:"eye",q:"What are the pupils doing?",sub:"Pupil size is the primary branching point in toxidrome identification.",opts:[{icon:"eye",lbl:"MYDRIASIS",sub:"Dilated, >5mm",val:"mydriasis"},{icon:"eye",lbl:"MIOSIS",sub:"Pinpoint",val:"miosis"},{icon:"eye",lbl:"NORMAL",sub:"Mid-position",val:"normal"}]},
  {id:"skin_m",label:"Step 2 — Skin",icon:"droplet",q:"What is the skin like?",sub:"Wet vs dry is the key separator when pupils are dilated.",showIf:{pupils:"mydriasis"},opts:[{icon:"wind",lbl:"DRY / FLUSHED",sub:"Dry mucous membranes",val:"dry"},{icon:"droplet",lbl:"DIAPHORETIC",sub:"Wet, sweating",val:"wet"}]},
  {id:"ecg_m",label:"Step 3 — ECG",icon:"heart",q:"What does the ECG show?",sub:"QRS width separates TCA from pure anticholinergic.",showIf:{pupils:"mydriasis",skin_m:"dry"},opts:[{icon:"heart",lbl:"WIDE QRS",sub:">100ms or R-wave aVR",val:"wide"},{icon:"heart",lbl:"NORMAL QRS",sub:"<100ms",val:"normal_qrs"}]},
  {id:"tone_mw",label:"Step 3 — Muscle Tone",icon:"bolt",q:"What is the muscle tone / reflexes?",sub:"Diaphoretic + dilated pupils — clonus/hyperreflexia separates SS.",showIf:{pupils:"mydriasis",skin_m:"wet"},opts:[{icon:"bolt",lbl:"HYPERREFLEXIA / CLONUS",sub:"Hunter criteria met",val:"hyperreflexia"},{icon:"bolt",lbl:"NORMAL TONE",sub:"No clonus",val:"normal"}]},
  {id:"skin_i",label:"Step 2 — Secretions",icon:"droplet",q:"What is the skin / secretions like?",sub:"Pinpoint pupils — skin separates cholinergic from opioid/sedative.",showIf:{pupils:"miosis"},opts:[{icon:"droplet",lbl:"DIAPHORETIC / SECRETIONS",sub:"Wet, bronchorrhoea",val:"wet"},{icon:"wind",lbl:"DRY / NORMAL",sub:"No excess secretions",val:"dry"}]},
  {id:"resp_id",label:"Step 3 — Breathing",icon:"wind",q:"What is the respiratory pattern?",sub:"Opioids cause deep respiratory depression.",showIf:{pupils:"miosis",skin_i:"dry"},opts:[{icon:"wind",lbl:"RESP. DEPRESSION",sub:"Slow, shallow",val:"dep"},{icon:"wind",lbl:"RELATIVELY PRESERVED",sub:"Mildly reduced",val:"norm"}]},
  {id:"anion_n",label:"Step 2 — Anion Gap",icon:"flask",q:"Is there a metabolic gap?",sub:"Normal pupils — check for metabolic derangement.",showIf:{pupils:"normal"},opts:[{icon:"flask",lbl:"ELEVATED AG / OSMOL GAP",sub:"HAGMA and/or osmol gap",val:"gap"},{icon:"flask",lbl:"NORMAL",sub:"No significant gap",val:"no_gap"}]},
  {id:"tinnitus",label:"Step 3 — Symptoms",icon:"warning",q:"Tinnitus or hyperventilation present?",sub:"Both salicylates and toxic alcohols cause HAGMA — tinnitus distinguishes.",showIf:{pupils:"normal",anion_n:"gap"},opts:[{icon:"warning",lbl:"TINNITUS + HYPERVENTILATION",sub:"Aspirin-type features",val:"tinnitus"},{icon:"eye",lbl:"VISUAL CHANGES / INTOXICATED",sub:"Alcohol-type features",val:"visual"}]}
];

const PW_RES=[
  {when:{pupils:"mydriasis",skin_m:"wet",tone_mw:"hyperreflexia"},r:"serotonin"},
  {when:{pupils:"mydriasis",skin_m:"wet",tone_mw:"normal"},r:"sympathomimetic"},
  {when:{pupils:"mydriasis",skin_m:"dry",ecg_m:"wide"},r:"tca"},
  {when:{pupils:"mydriasis",skin_m:"dry",ecg_m:"normal_qrs"},r:"anticholinergic"},
  {when:{pupils:"miosis",skin_i:"wet"},r:"cholinergic"},
  {when:{pupils:"miosis",skin_i:"dry",resp_id:"dep"},r:"opioid"},
  {when:{pupils:"miosis",skin_i:"dry",resp_id:"norm"},r:"sedative"},
  {when:{pupils:"normal",anion_n:"gap",tinnitus:"tinnitus"},r:"salicylate"},
  {when:{pupils:"normal",anion_n:"gap",tinnitus:"visual"},r:"toxic_alcohol"},
  {when:{pupils:"normal",anion_n:"no_gap"},r:"sedative"}
];

// ── PATHWAY LOGIC ──
let pwC={};
function pwShow(s){if(!s.showIf)return true;return Object.entries(s.showIf).every(([k,v])=>pwC[k]===v)}
function pwResult(){return PW_RES.find(r=>Object.entries(r.when).every(([k,v])=>pwC[k]===v))}
function pwChoose(stepId,val){pwC[stepId]=val;pwRender();}
function pwReset(){
  pwC={};
  document.getElementById('pw-sb-title').textContent='Make a selection';
  document.getElementById('pw-placeholder').style.display='block';
  document.getElementById('pw-result').style.display='none';
  pwRender();
}
function pwRender(){
  const tree=document.getElementById('pw-tree');if(!tree)return;tree.innerHTML='';
  const vis=PW_STEPS.filter(s=>pwShow(s));
  const res=pwResult();
  vis.forEach((step,idx)=>{
    const answered=pwC[step.id]!==undefined;const isNext=!answered&&!res;
    const div=document.createElement('div');div.className='pw-step';
    if(answered){
      const chosen=step.opts.find(o=>o.val===pwC[step.id]);
      div.innerHTML=`<div class="pw-answered"><div class="pw-check">✓</div><div><strong>${step.label.split('—')[1]?.trim()}</strong>: ${chosen?.lbl}</div></div>`;
    } else {
      div.innerHTML=`<div class="pw-qcard ${isNext?'active':''}">
        <div class="pw-qlbl">${step.label}</div>
        <div class="pw-qtitle">${step.q}</div>
        <div class="pw-qsub">${step.sub}</div>
        <div class="pw-opts">${step.opts.map(o=>`<button class="pw-opt" onclick="pwChoose('${step.id}','${o.val}')">
          <span class="pw-opt-em"><svg><use href="#ic-${o.icon}"/></svg></span>
          <div><div class="pw-opt-lbl">${o.lbl}</div><div class="pw-opt-sub">${o.sub}</div></div>
        </button>`).join('')}</div>
      </div>`;
    }
    tree.appendChild(div);
    if(idx<vis.length-1||res){const c=document.createElement('div');c.className='pw-connector';tree.appendChild(c);}
    setTimeout(()=>div.classList.add('vis'),idx*60);
  });
  if(res){
    const tox=PW_TOX[res.r];
    const rDiv=document.createElement('div');rDiv.className='pw-step';
    rDiv.innerHTML=`<div class="pw-result-node" style="border-color:${tox.color}">
      <div class="pw-res-lbl" style="color:${tox.color}">Identified Toxidrome</div>
      <div class="pw-res-name" style="color:${tox.color}">${tox.name}</div>
      <button class="pw-goto" style="color:${tox.color};border-color:${tox.color}" onclick="pwOpenDetail('${res.r}')">View Management →</button>
    </div>`;
    tree.appendChild(rDiv);
    setTimeout(()=>rDiv.classList.add('vis'),vis.length*60);
    document.getElementById('pw-sb-title').textContent=tox.name;
    document.getElementById('pw-placeholder').style.display='none';
    const pr=document.getElementById('pw-result');pr.style.display='block';
    pr.innerHTML=`<div style="padding:16px 17px;border-bottom:1px solid var(--border);background:${tox.color};color:#fff">
      <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:3px;font-family:var(--mono)">Identified</div>
      <div style="font-size:20px;font-weight:700;letter-spacing:-.02em">${tox.name}</div>
      <div style="font-size:11px;opacity:.8;margin-top:3px">${tox.agents}</div>
    </div>
    <div style="padding:13px 17px;border-bottom:1px solid var(--border)">
      <div style="font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px">Vital Signs</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${['hr','bp','rr','temp'].map((k,i)=>{const v=tox.vitals[k];const labels=['HR','BP','RR','Temp'];const c=v.includes('↑')?'dvital-up':v.includes('↓')?'dvital-down':'dvital-nl';return`<div class="dvital ${c}"><div class="dvital-val">${v}</div><div class="dvital-lbl">${labels[i]}</div></div>`;}).join('')}</div>
    </div>
    <div style="padding:13px 17px;border-bottom:1px solid var(--border)">
      <div style="font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:6px">Key Findings</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.65;font-family:var(--mono)">${tox.key}</div>
    </div>
    <div style="padding:13px 17px;border-bottom:1px solid var(--border)"><div class="ant-box">${tox.antidote}</div></div>
    <div style="padding:13px 17px"><div class="mne-box">${tox.mnemonic}</div></div>`;
  }
}
function pwOpenDetail(key){
  const tName={serotonin:'Serotonin',nms:'Neuroleptic',anticholinergic:'Anticholinergic',sympathomimetic:'Sympathomimetic',cholinergic:'Cholinergic',opioid:'Opioid',sedative:'Sedative',tca:'TCA',salicylate:'Salicylate',toxic_alcohol:'Toxic'}[key]||key;
  const t=TOXIDROMES.find(x=>x.name.toLowerCase().includes(tName.toLowerCase()));
  if(t) showDetailPanel(buildToxDetail(t),t.name);
}

// ── RENDER TOX LIST ──
let toxFilter='all',toxSearch='';
let favorites=new Set(JSON.parse(localStorage.getItem('tp-favs')||'[]'));

function setToxFilter(cat,el){
  toxFilter=cat;
  document.querySelectorAll('.fchip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderToxList();
}
function filterTox(){toxSearch=document.getElementById('tox-search').value.toLowerCase();renderToxList();}
function renderToxList(){
  const list=document.getElementById('tox-list');list.innerHTML='';
  const f=TOXIDROMES.filter(t=>{
    const mc=toxFilter==='all'||t.category===toxFilter;
    const ms=!toxSearch||[t.name,t.agents,t.symptoms].some(x=>x.toLowerCase().includes(toxSearch));
    return mc&&ms;
  });
  if(!f.length){list.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);font-size:13px">No matches found.</div>';return;}
  f.forEach(t=>{
    const col=CAT_COLORS[t.category]||'#C0392B';
    const isFav=favorites.has(t.name);
    const row=document.createElement('div');row.className='tox-row';
    row.innerHTML=`<div class="tox-row-main">
      <div class="tox-row-stripe" style="background:${col}"></div>
      <div class="tox-row-info">
        <div class="tox-row-name">${t.name}</div>
        <div class="tox-row-preview">${t.agents.substring(0,60)}&hellip;</div>
      </div>
      <div class="tox-row-vitals">
        <span class="vbadge ${vc(t.vitals.hr)}">HR${t.vitals.hr}</span>
        <span class="vbadge ${vc(t.vitals.bp)}">BP${t.vitals.bp}</span>
        <span class="vbadge ${vc(t.vitals.temp)}">T&deg;${t.vitals.temp}</span>
      </div>
      <span class="tox-cat-tag" style="color:${col};border-color:${col}30;background:${col}10">${t.catLabel}</span>
      <button class="fav-btn${isFav?' active':''}" onclick="event.stopPropagation();toggleFav('${t.name}')" title="${isFav?'Remove from favorites':'Add to favorites'}">
        <svg viewBox="0 0 24 24" ${isFav?'fill="currentColor"':'fill="none"'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>`;
    row.onclick=()=>{
      document.querySelectorAll('.tox-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
      showDetailPanel(buildToxDetail(t),t.name);
    };
    list.appendChild(row);
  });
}

// ── RENDER ENV LIST ──
function renderEnvList(){
  const list=document.getElementById('env-list');
  ENV.forEach(e=>{
    const row=document.createElement('div');row.className='tox-row env-row';
    row.innerHTML=`<div class="tox-row-main">
      <div class="tox-row-stripe" style="background:var(--teal)"></div>
      <div class="tox-row-info">
        <div class="tox-row-name">${e.name}</div>
        <div class="tox-row-preview">${e.description.substring(0,65)}&hellip;</div>
      </div>
      <span class="tox-cat-tag" style="color:var(--teal);border-color:var(--teal-mid);background:var(--teal-dim)">${e.catLabel}</span>
    </div>`;
    row.onclick=()=>{
      document.querySelectorAll('.tox-row,.env-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
      showDetailPanel(buildEnvDetail(e));
    };
    list.appendChild(row);
  });
}

// ── ANTIDOTES ──
function filterAntidotes(){const v=document.getElementById('ant-search').value.toLowerCase();renderAntidotes(v);}
function renderAntidotes(search=''){
  const s=search.toLowerCase();
  document.getElementById('antidotes-body').innerHTML=ANTIDOTES
    .filter(a=>!s||a.drug.toLowerCase().includes(s)||a.indication.toLowerCase().includes(s))
    .map(a=>`<tr>
      <td><div class="adrug">${a.drug}</div>${a.extra?`<div style="font-size:11px;color:var(--text3);margin-top:3px">${a.extra}</div>`:''}</td>
      <td><div class="aind">${a.indication}</div></td>
      <td><div class="adose">${a.dose}</div></td>
      <td><span class="asource src-${a.source}">${a.sourceLabel}</span></td>
    </tr>`).join('');
}

// ── CALCULATOR ──
let activeCalc=null;
function renderCalcList(){
  document.getElementById('calc-list').innerHTML=CALCULATORS.map((c,i)=>`<button class="calc-sb-btn" onclick="loadCalc(${i})">${c.name}</button>`).join('');
}
function loadCalc(idx){
  activeCalc=idx;
  document.querySelectorAll('.calc-sb-btn').forEach((b,i)=>b.classList.toggle('active',i===idx));
  const calc=CALCULATORS[idx];
  const savedWt=sessionStorage.getItem('tp-last-weight')||'';
  document.getElementById('calc-main').innerHTML=`
    <div class="calc-name">${calc.name}</div>
    <div class="calc-ind">${calc.ind}</div>
    <div class="calc-inputs">
      ${calc.fields.map(f=>`<div class="cfield">
        <label>${f.label}</label>
        ${f.type==='select'
          ?`<select id="cf-${f.id}">${f.opts.map(o=>`<option>${o}</option>`).join('')}</select>`
          :`<input id="cf-${f.id}" type="${f.type}" placeholder="${f.ph||''}" ${f.id==='wt'&&savedWt?`value="${savedWt}"`:''}>`
        }
      </div>`).join('')}
      <button class="btn-calc" onclick="runCalc()">Calculate &rarr;</button>
    </div>
    <div class="calc-results" id="calc-results"></div>
    ${calc.warn?`<div class="calc-warn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><use href="#ic-warning"/></svg>${calc.warn}</div>`:''}`;
}
function runCalc(){
  const calc=CALCULATORS[activeCalc];
  const fields={};
  calc.fields.forEach(f=>{const el=document.getElementById('cf-'+f.id);if(el)fields[f.id]=el.value;});
  const wtEl=document.getElementById('cf-wt');
  if(wtEl&&wtEl.value) sessionStorage.setItem('tp-last-weight',wtEl.value);
  const results=calc.calc(fields);
  const box=document.getElementById('calc-results');
  box.className='calc-results show';
  box.innerHTML=`<div class="cres-head">Calculated doses — verify with institutional protocol</div>`
    +results.map(r=>`<div class="cres-row">
      <div class="cres-lbl">${r.l}</div>
      <div class="cres-val">${r.v}</div>
      ${r.n?`<div class="cres-note">${r.n}</div>`:''}
    </div>`).join('');
  if(calc.postRender) setTimeout(()=>calc.postRender(),50);
}

// ── COMPARE ──
function populateCmpSelects(){
  const opts=`<option value="">— Select —</option>`+TOXIDROMES.map((t,i)=>`<option value="${i}">${t.name}</option>`).join('');
  document.getElementById('cmp-a').innerHTML=opts;
  document.getElementById('cmp-b').innerHTML=opts;
}
function renderCompare(){
  const ai=document.getElementById('cmp-a').value,bi=document.getElementById('cmp-b').value;
  const out=document.getElementById('compare-output');
  if(!ai||!bi){out.innerHTML='<div class="cmp-placeholder">Choose two toxidromes above to compare them.</div>';return;}
  const a=TOXIDROMES[ai],b=TOXIDROMES[bi];
  const fields=[
    {l:'Category',va:a.catLabel,vb:b.catLabel},
    {l:'Agents',va:a.agents,vb:b.agents},
    {l:'HR',va:a.vitals.hr,vb:b.vitals.hr},
    {l:'BP',va:a.vitals.bp,vb:b.vitals.bp},
    {l:'RR',va:a.vitals.rr,vb:b.vitals.rr},
    {l:'Temp',va:a.vitals.temp,vb:b.vitals.temp},
    {l:'Pupils',va:a.pupils,vb:b.pupils},
    {l:'Skin',va:a.skin,vb:b.skin},
    {l:'Consciousness',va:a.consciousness,vb:b.consciousness},
    {l:'Antidote',va:a.antidote,vb:b.antidote},
    {l:'Mnemonic',va:a.mnemonics,vb:b.mnemonics}
  ];
  const isDiff=(va,vb)=>va.trim().toLowerCase()!==vb.trim().toLowerCase();
  out.innerHTML=`<div class="cmp-grid">
    <div class="cmp-col">
      <div class="cmp-head"><div class="cmp-head-name" style="color:var(--teal)">${a.name}</div></div>
      ${fields.map(f=>`<div class="cmp-row"><div class="cmp-row-lbl">${f.l}</div><div class="cmp-row-val ${isDiff(f.va,f.vb)?'cmp-diff':''}">${f.va}</div></div>`).join('')}
    </div>
    <div class="cmp-col">
      <div class="cmp-head"><div class="cmp-head-name" style="color:var(--blue)">${b.name}</div></div>
      ${fields.map(f=>`<div class="cmp-row"><div class="cmp-row-lbl">${f.l}</div><div class="cmp-row-val ${isDiff(f.va,f.vb)?'cmp-diff':''}">${f.vb}</div></div>`).join('')}
    </div>
  </div>
  <div style="font-family:var(--mono);font-size:11px;color:var(--text3);padding:8px 15px;background:var(--surface2);border:1px solid var(--border2);border-top:none;border-radius:0 0 var(--r-lg) var(--r-lg)">Highlighted fields differ between toxidromes</div>`;
}

// ── SYMPTOM BUILDER ──
let selectedSyms=new Set();
function renderBuilderChips(){
  document.getElementById('sb-chips').innerHTML=SYM_OPTIONS.map(s=>`<div class="sb-chip${selectedSyms.has(s.id)?' sel':''}" onclick="toggleSym('${s.id}')">
    <span class="sb-icon"><svg><use href="#ic-${s.icon}"/></svg></span>${s.label}
  </div>`).join('');
}
function toggleSym(id){
  if(selectedSyms.has(id)) selectedSyms.delete(id); else selectedSyms.add(id);
  document.getElementById('sb-count').textContent=selectedSyms.size+' selected';
  renderBuilderChips();renderBuilderResults();
}
function clearBuilder(){
  selectedSyms.clear();
  document.getElementById('sb-count').textContent='0 selected';
  renderBuilderChips();renderBuilderResults();
}
function renderBuilderResults(){
  const out=document.getElementById('sb-results');
  if(!selectedSyms.size){out.innerHTML='<div class="sb-empty">Select symptoms above to find matching toxidromes.</div>';return;}
  const scored=TOXIDROMES.map(t=>{
    const matched=t.symTags.filter(s=>selectedSyms.has(s));
    const pct=Math.round((matched.length/Math.max(selectedSyms.size,t.symTags.length))*100);
    return{t,matched,pct};
  }).filter(x=>x.matched.length>0).sort((a,b)=>b.pct-a.pct);
  if(!scored.length){out.innerHTML='<div class="sb-empty">No close matches found.</div>';return;}
  const col=cat=>CAT_COLORS[cat]||'#C0392B';
  out.innerHTML=scored.map(({t,matched,pct})=>`<div class="sb-result">
    <div class="sb-result-bar" style="background:${col(t.category)}"></div>
    <div class="sb-result-body">
      <div class="sb-result-name">${t.name}</div>
      <div class="sb-match-pct">${pct}% match &middot; ${matched.length} symptoms</div>
      <div class="sb-track"><div class="sb-fill" style="width:${pct}%;background:${col(t.category)}"></div></div>
      <div class="sb-tags">${matched.map(m=>{const sym=SYM_OPTIONS.find(s=>s.id===m);return`<span class="sb-stag">${sym?sym.label:m}</span>`;}).join('')}</div>
      <button class="sb-goto" onclick="openToxByName('${t.name}')">View full card &rarr;</button>
    </div>
  </div>`).join('');
}
function openToxByName(name){
  showTab('toxidromes');
  setTimeout(()=>{
    const t=TOXIDROMES.find(x=>x.name===name);
    if(t) showDetailPanel(buildToxDetail(t),t.name);
  },100);
}

// ── CASE MATCHER ──
let caseOrder=[...CASES.keys()],caseIdx=0,mScore=0,mCorrect=0,mTotal=0;
let timerOn=false,timerInterval=null,timerSecs=30;

function shuffleCases(){
  caseOrder=caseOrder.sort(()=>Math.random()-.5);
  caseIdx=0;mScore=mCorrect=mTotal=0;
  ['m-score','m-correct','m-total'].forEach(id=>document.getElementById(id).textContent=0);
  renderMatcher();
}
function toggleTimer(){
  timerOn=!timerOn;
  const btn=document.getElementById('timer-toggle');
  btn.classList.toggle('on',timerOn);
  btn.textContent=timerOn?'Timer ON':'Enable Timer';
  if(!timerOn){
    clearInterval(timerInterval);
    document.getElementById('timer-disp').textContent='30s';
    document.getElementById('timer-disp').classList.remove('warn');
  } else startTimer();
}
function startTimer(){
  clearInterval(timerInterval);timerSecs=30;updateTimer();
  timerInterval=setInterval(()=>{
    timerSecs--;updateTimer();
    if(timerSecs<=5) document.getElementById('timer-disp').classList.add('warn');
    if(timerSecs<=0){clearInterval(timerInterval);autoTimeout();}
  },1000);
}
function updateTimer(){document.getElementById('timer-disp').textContent=timerSecs+'s';}
function autoTimeout(){
  document.querySelectorAll('.choice-btn').forEach(b=>b.disabled=true);
  mTotal++;document.getElementById('m-total').textContent=mTotal;
  const c=CASES[caseOrder[caseIdx%CASES.length]];
  const fb=document.getElementById('m-feedback');
  fb.className='fb-box show fb-bad';
  fb.innerHTML=`<strong style="color:var(--red)">Time's up!</strong> — Answer: <strong>${c.answer}</strong>. ${c.explanation}`;
}
function renderMatcher(){
  const c=CASES[caseOrder[caseIdx%CASES.length]];
  document.getElementById('m-case').innerHTML=`${(caseIdx%CASES.length)+1}/${CASES.length} <span class="diff-pill diff-${c.difficulty}">${c.difficulty}</span>`;
  document.getElementById('m-vitals').innerHTML=c.vitals.map(v=>`<div class="vbox"><div class="vbox-val ${v.cls}">${v.val}</div><div class="vbox-lbl">${v.label}</div></div>`).join('');
  document.getElementById('m-symptoms').textContent=c.symptoms;
  const fb=document.getElementById('m-feedback');fb.className='fb-box';fb.innerHTML='';
  const ch=document.getElementById('m-choices');ch.innerHTML='';
  c.options.forEach(opt=>{
    const btn=document.createElement('button');btn.className='choice-btn';btn.textContent=opt;
    btn.onclick=()=>checkAnswer(opt,c,btn);ch.appendChild(btn);
  });
  if(timerOn) startTimer();
}
function checkAnswer(chosen,cd,btn){
  clearInterval(timerInterval);
  document.querySelectorAll('.choice-btn').forEach(b=>b.disabled=true);
  mTotal++;const ok=chosen===cd.answer;
  if(ok){btn.classList.add('correct');mCorrect++;mScore+=10;}
  else{
    btn.classList.add('wrong');
    document.querySelectorAll('.choice-btn').forEach(b=>{if(b.textContent===cd.answer)b.classList.add('correct');});
    recordSRSMiss(cd.answer);
  }
  document.getElementById('m-score').textContent=mScore;
  document.getElementById('m-correct').textContent=mCorrect;
  document.getElementById('m-total').textContent=mTotal;
  document.getElementById('timer-disp').classList.remove('warn');
  const fb=document.getElementById('m-feedback');
  fb.className='fb-box show '+(ok?'fb-ok':'fb-bad');
  fb.innerHTML=`<strong style="color:${ok?'var(--teal)':'var(--red)'}">${ok?'Correct':'Incorrect'}</strong> &mdash; ${cd.explanation}`;
}
function nextCase(){caseIdx++;renderMatcher();}

// ── SPRINT ──
let sprintCases=[],sprintIdx=0,sprintScore=0,sprintInterval=null,sprintSecs=30,sprintMode=5,sprintAnswered=false;
function initSprint(){
  document.getElementById('sprint-content').innerHTML=`<div class="sprint-start">
    <h3>Toxidrome Sprint</h3>
    <p>Rapid-fire cases. 30 seconds per case. One shot.</p>
    <div class="sprint-modes">
      <button class="sprint-mode-btn sel" onclick="selMode(5,this)">5 cases</button>
      <button class="sprint-mode-btn" onclick="selMode(10,this)">10 cases</button>
      <button class="sprint-mode-btn" onclick="selMode(20,this)">Full 20</button>
    </div>
    <button class="btn btn-primary" onclick="startSprint()" style="padding:10px 28px;font-size:14px">Start Sprint &rarr;</button>
  </div>`;
}
function selMode(n,btn){
  sprintMode=n;
  document.querySelectorAll('.sprint-mode-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
}
function startSprint(){
  sprintCases=[...CASES.keys()].sort(()=>Math.random()-.5).slice(0,sprintMode);
  sprintIdx=0;sprintScore=0;renderSprintCase();
}
function renderSprintCase(){
  if(sprintIdx>=sprintCases.length){endSprint();return;}
  clearInterval(sprintInterval);sprintSecs=30;sprintAnswered=false;
  const c=CASES[sprintCases[sprintIdx]];
  document.getElementById('sprint-content').innerHTML=`<div class="sprint-wrap">
    <div class="sprint-head">
      <div><div class="sprint-meta">Case ${sprintIdx+1} of ${sprintCases.length} &middot; Score: ${sprintScore}</div></div>
      <div class="sprint-timer" id="sp-timer">30</div>
    </div>
    <div class="sprint-case">
      <div class="sprint-vitals">${c.vitals.map(v=>`<div class="sprint-vital-box"><div class="sv-val ${v.cls}">${v.val}</div><div class="sv-lbl">${v.label}</div></div>`).join('')}</div>
      <div class="sprint-symptoms">${c.symptoms}</div>
      <div class="sprint-choices">${c.options.map(o=>`<button class="sprint-choice" onclick="sprintAnswer('${o.replace(/'/g,"\\'")}','${c.answer.replace(/'/g,"\\'")}')">${o}</button>`).join('')}</div>
      <div id="sp-fb" style="margin-top:9px;font-size:12px;line-height:1.6;color:var(--text3)"></div>
    </div>
  </div>`;
  sprintInterval=setInterval(()=>{
    sprintSecs--;
    const t=document.getElementById('sp-timer');
    if(t){t.textContent=sprintSecs;t.classList.toggle('warn',sprintSecs<=5);}
    if(sprintSecs<=0){clearInterval(sprintInterval);sprintTimeout();}
  },1000);
}
function sprintAnswer(chosen,answer){
  if(sprintAnswered)return;sprintAnswered=true;clearInterval(sprintInterval);
  const ok=chosen===answer;if(ok)sprintScore++;
  document.querySelectorAll('.sprint-choice').forEach(b=>{
    b.disabled=true;
    if(b.textContent===answer)b.classList.add('correct');
    else if(b.textContent===chosen&&!ok)b.classList.add('wrong');
  });
  const c=CASES[sprintCases[sprintIdx]];
  const fb=document.getElementById('sp-fb');
  if(fb){fb.style.color=ok?'var(--teal)':'var(--red)';fb.innerHTML=`<strong>${ok?'Correct':'Incorrect'}</strong> &mdash; ${c.explanation}`;}
  setTimeout(()=>{sprintIdx++;renderSprintCase();},ok?1100:1900);
}
function sprintTimeout(){
  if(sprintAnswered)return;sprintAnswered=true;
  const c=CASES[sprintCases[sprintIdx]];
  document.querySelectorAll('.sprint-choice').forEach(b=>{b.disabled=true;if(b.textContent===c.answer)b.classList.add('correct');});
  const fb=document.getElementById('sp-fb');
  if(fb){fb.style.color='var(--red)';fb.innerHTML=`<strong>Time's up!</strong> &mdash; Answer: <strong>${c.answer}</strong>`;}
  setTimeout(()=>{sprintIdx++;renderSprintCase();},1800);
}
function endSprint(){
  const pct=Math.round((sprintScore/sprintMode)*100);
  savePerformance('sprint',pct);
  const grade=pct>=90?'A':pct>=80?'B':pct>=70?'C':pct>=60?'D':'F';
  const msg=pct>=80?'Excellent — board ready!':pct>=60?'Good — review missed topics.':'More practice needed.';
  document.getElementById('sprint-content').innerHTML=`<div class="sprint-result">
    <div class="sprint-score-big">${sprintScore}/${sprintMode}</div>
    <div style="font-family:var(--mono);font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--text3);margin-top:5px">Grade ${grade} &middot; ${pct}%</div>
    <div style="font-size:14px;color:var(--text2);margin-top:12px">${msg}</div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:22px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="startSprint()">&#8635; Sprint Again</button>
      <button class="btn btn-ghost" onclick="initSprint()">Change Mode</button>
    </div>
  </div>`;
}

// ── QUIZ ──
let quizOrder=[],quizIdx=0,quizScore=0,quizAnswered=false,quizMissed=[];
function shuffleQuiz(){quizOrder=[...QUIZ_SOURCE.keys()].sort(()=>Math.random()-.5);}
function renderQuiz(){
  if(!quizOrder.length) shuffleQuiz();
  const prog=document.getElementById('quiz-prog');if(prog) prog.style.width=Math.round((quizIdx/QUIZ_SOURCE.length)*100)+'%';
  const counter=document.getElementById('quiz-counter');
  const live=document.getElementById('quiz-score-live');
  const card=document.getElementById('quiz-card');
  if(quizIdx>=QUIZ_SOURCE.length){
    const pct=Math.round((quizScore/QUIZ_SOURCE.length)*100);
    savePerformance('quiz',pct);
    const grade=pct>=90?'A':pct>=80?'B':pct>=70?'C':pct>=60?'D':'F';
    const msg=pct>=80?'Excellent — ready for Boards!':pct>=60?'Good work — review missed topics.':'Review toxidromes and try again.';
    card.innerHTML=`<div class="quiz-result">
      <div class="quiz-score-big">${quizScore}/${QUIZ_SOURCE.length}</div>
      <div class="quiz-grade">Grade ${grade} &middot; ${pct}%</div>
      <div class="quiz-msg">${msg}</div>
      ${quizMissed.length?`<div style="margin-top:16px;padding:10px 14px;background:var(--blue-dim);border:1px solid var(--blue-mid);border-radius:var(--r);font-size:12px;color:var(--text2)"><strong>Review these topics:</strong> ${[...new Set(quizMissed)].join(', ')}</div>`:''}
      <div class="quiz-actions">
        <button class="btn btn-primary" onclick="restartQuiz()">&#8635; Restart</button>
        <button class="btn btn-ghost" onclick="showTab('toxidromes')">Review Toxidromes</button>
      </div>
    </div>`;
    renderPerfChart('quiz-perf-canvas','quiz');
    if(counter) counter.textContent='Complete';
    return;
  }
  if(counter) counter.textContent=`Question ${quizIdx+1} of ${QUIZ_SOURCE.length}`;
  if(live) live.textContent=`Score: ${quizScore}`;
  const q=QUIZ_SOURCE[quizOrder[quizIdx]];quizAnswered=false;
  card.innerHTML=`<div class="quiz-q">${q.q}</div>
    <div class="quiz-opts">${q.opts.map((o,i)=>`<button class="quiz-opt" onclick="answerQuiz(${i})"><span class="opt-key">${String.fromCharCode(65+i)}</span>${o}</button>`).join('')}</div>
    <div class="quiz-exp" id="quiz-exp"><strong>Explanation:</strong> ${q.exp}</div>
    <div class="quiz-nav"><button class="btn btn-primary" id="quiz-next" onclick="nextQuestion()" style="display:none">Next &rarr;</button></div>`;
}
function answerQuiz(chosen){
  if(quizAnswered)return;quizAnswered=true;
  const q=QUIZ_SOURCE[quizOrder[quizIdx]];
  document.querySelectorAll('.quiz-opt').forEach(o=>o.disabled=true);
  document.querySelectorAll('.quiz-opt')[chosen].classList.add(chosen===q.ans?'correct':'wrong');
  if(chosen!==q.ans){
    document.querySelectorAll('.quiz-opt')[q.ans].classList.add('correct');
    if(q.topic) quizMissed.push(q.topic);
    recordSRSMiss(q.topic||'');
  }
  if(chosen===q.ans) quizScore++;
  document.getElementById('quiz-exp').classList.add('show');
  const nb=document.getElementById('quiz-next');if(nb) nb.style.display='inline-block';
  const live=document.getElementById('quiz-score-live');if(live) live.textContent=`Score: ${quizScore}`;
}
function nextQuestion(){quizIdx++;renderQuiz();}
function restartQuiz(){quizIdx=0;quizScore=0;quizAnswered=false;quizMissed=[];shuffleQuiz();renderQuiz();}

// Quiz keyboard shortcuts
document.addEventListener('keydown',e=>{
  const practicePanel=document.getElementById('panel-practice');
  if(!practicePanel||!practicePanel.classList.contains('active'))return;
  const quizSection=document.getElementById('practice-quiz');
  if(!quizSection||!quizSection.classList.contains('active'))return;
  if(quizIdx>=QUIZ_SOURCE.length)return;
  if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  const k=e.key.toUpperCase();
  if(!quizAnswered&&['A','B','C','D'].includes(k)){
    const i=k.charCodeAt(0)-65;
    const opts=document.querySelectorAll('.quiz-opt');
    if(opts[i]) setTimeout(()=>answerQuiz(i),60);
  }
  if(quizAnswered&&(e.key==='Enter'||e.key===' ')){e.preventDefault();nextQuestion();}
});

// ── FAVORITES ──
function toggleFav(name){
  if(favorites.has(name)){favorites.delete(name);showToast('Removed from favorites');}
  else{favorites.add(name);showToast('Added to favorites ★');}
  localStorage.setItem('tp-favs',JSON.stringify([...favorites]));
  renderToxList();
  renderFavoritesSection();
}
function renderFavoritesSection(){
  const existing=document.getElementById('fav-section');if(existing)existing.remove();
  if(!favorites.size)return;
  const sec=document.createElement('div');sec.id='fav-section';sec.className='fav-section';
  sec.innerHTML=`<div class="fav-section-title">★ Quick Access</div><div class="tox-list" id="fav-list"></div>`;
  const toxList=document.getElementById('tox-list');
  toxList.parentNode.insertBefore(sec,toxList);
  const fl=document.getElementById('fav-list');
  [...favorites].forEach(name=>{
    const t=TOXIDROMES.find(x=>x.name===name);if(!t)return;
    const col=CAT_COLORS[t.category]||'#C0392B';
    const row=document.createElement('div');row.className='tox-row';
    row.innerHTML=`<div class="tox-row-main">
      <div class="tox-row-stripe" style="background:${col}"></div>
      <div class="tox-row-info"><div class="tox-row-name">${t.name}</div></div>
      <span class="vbadge vbadge-up" style="font-size:10px">★</span>
    </div>`;
    row.onclick=()=>{
      document.querySelectorAll('.tox-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');showDetailPanel(buildToxDetail(t),t.name);
    };
    fl.appendChild(row);
  });
}

// ── TOAST ──
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2000);
}

// ── GLOBAL SEARCH ──
function globalSearch(q){
  const dd=document.getElementById('gsearch-dd');
  if(!q.trim()){dd.classList.remove('open');return;}
  const s=q.toLowerCase();
  const toxHits=TOXIDROMES.filter(t=>[t.name,t.agents,t.symptoms,t.catLabel].some(x=>x.toLowerCase().includes(s))).slice(0,5);
  const antHits=ANTIDOTES.filter(a=>[a.drug,a.indication].some(x=>x.toLowerCase().includes(s))).slice(0,4);
  let html='';
  if(toxHits.length){
    html+=`<div class="gsearch-section"><span class="gsearch-section-label">Toxidromes</span>`;
    toxHits.forEach(t=>{const col=CAT_COLORS[t.category]||'#C0392B';html+=`<div class="gsearch-item" onclick="gsearchGo('tox','${t.name.replace(/'/g,"\\'")}')"><div class="gsearch-item-dot" style="background:${col}"></div><div><div class="gsearch-item-name">${t.name}</div><div class="gsearch-item-sub">${t.catLabel}</div></div></div>`;});
    html+='</div>';
  }
  if(antHits.length){
    html+=`<div class="gsearch-section"><span class="gsearch-section-label">Antidotes</span>`;
    antHits.forEach(a=>{html+=`<div class="gsearch-item" onclick="gsearchGo('ant','${a.drug.replace(/'/g,"\\'")}')"><div class="gsearch-item-dot" style="background:var(--teal)"></div><div><div class="gsearch-item-name">${a.drug}</div><div class="gsearch-item-sub">${a.indication.substring(0,40)}</div></div></div>`;});
    html+='</div>';
  }
  if(!html) html='<div class="gsearch-empty">No matches found</div>';
  dd.innerHTML=html;dd.classList.add('open');
}
function openGsearch(){const v=document.getElementById('gsearch').value;if(v.trim())document.getElementById('gsearch-dd').classList.add('open');}
function closeGsearch(){document.getElementById('gsearch-dd').classList.remove('open');}
function gsearchGo(type,name){
  document.getElementById('gsearch').value='';closeGsearch();
  if(type==='tox'){
    showTab('toxidromes');
    setTimeout(()=>{const t=TOXIDROMES.find(x=>x.name===name);if(t) showDetailPanel(buildToxDetail(t),t.name);},80);
  } else if(type==='ant'){
    showTab('antidotes');
    setTimeout(()=>{const inp=document.getElementById('ant-search');if(inp){inp.value=name;filterAntidotes();}},80);
  }
}

// ── POISON CONTROL (from original) ──
function callPoison(){
  if(confirm('Call AIIMS Poison Control Centre?\n\n011-26589391\n\nThis will open your phone dialler.'))
    window.location.href='tel:01126589391';
}

// ── PRINT CARD ──
function printCard(){
  document.body.classList.add('print-card-only');
  window.print();
  document.body.classList.remove('print-card-only');
}

// ── RECENT HISTORY ──
let recentViewed=JSON.parse(localStorage.getItem('tp-recent')||'[]');
function addToRecent(name){
  recentViewed=recentViewed.filter(n=>n!==name);
  recentViewed.unshift(name);
  recentViewed=recentViewed.slice(0,6);
  localStorage.setItem('tp-recent',JSON.stringify(recentViewed));
  renderRecentSection();
}
function renderRecentSection(){
  const existing=document.getElementById('recent-section');if(existing)existing.remove();
  if(!recentViewed.length)return;
  const toxList=document.getElementById('tox-list');
  const sec=document.createElement('div');sec.id='recent-section';sec.className='recent-section';
  sec.innerHTML=`<div class="recent-label">Recently Viewed</div>
    <div class="recent-pills">${recentViewed.map(n=>`<button class="recent-pill" onclick="openToxByName('${n.replace(/'/g,"\\'")}')">${n}</button>`).join('')}</div>`;
  toxList.parentNode.insertBefore(sec,toxList);
}

// ── PERFORMANCE TRACKING ──
function savePerformance(type,pct){
  const key='tp-perf-'+type;
  const arr=JSON.parse(localStorage.getItem(key)||'[]');
  arr.push({pct,ts:Date.now()});
  if(arr.length>20) arr.shift();
  localStorage.setItem(key,JSON.stringify(arr));
}
function renderPerfChart(canvasId,type){
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const arr=JSON.parse(localStorage.getItem('tp-perf-'+type)||'[]');
  const W=canvas.offsetWidth||320;const H=80;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  if(!arr.length){
    ctx.fillStyle='rgba(128,128,128,0.5)';ctx.font='12px DM Sans,sans-serif';ctx.textAlign='center';
    ctx.fillText('No data yet — complete a '+type,W/2,H/2);return;
  }
  const pad=12;const iw=W-pad*2;const ih=H-pad*2;
  ctx.clearRect(0,0,W,H);
  // 80% guideline
  ctx.strokeStyle='rgba(128,128,128,0.15)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  const y80=pad+ih*(1-0.8);
  ctx.beginPath();ctx.moveTo(pad,y80);ctx.lineTo(W-pad,y80);ctx.stroke();
  ctx.setLineDash([]);
  // line + dots
  const xs=arr.map((_,i)=>pad+i*(iw/Math.max(arr.length-1,1)));
  const ys=arr.map(p=>pad+ih*(1-p.pct/100));
  ctx.strokeStyle='var(--green,#0B4D3B)';ctx.lineWidth=2;ctx.beginPath();
  xs.forEach((x,i)=>{if(i===0)ctx.moveTo(x,ys[i]);else ctx.lineTo(x,ys[i]);});
  ctx.stroke();
  xs.forEach((x,i)=>{ctx.fillStyle='var(--green,#0B4D3B)';ctx.beginPath();ctx.arc(x,ys[i],3,0,Math.PI*2);ctx.fill();});
}
function clearPerf(type){
  localStorage.removeItem('tp-perf-'+type);
  renderPerfChart(type+'-perf-canvas',type);
  showToast('History cleared');
}

// ── SPACED REPETITION ──
function recordSRSMiss(name){
  if(!name)return;
  const missed=JSON.parse(localStorage.getItem('tp-srs')||'{}');
  missed[name]=(missed[name]||0)+1;
  localStorage.setItem('tp-srs',JSON.stringify(missed));
}
function getSRSWeight(name){
  const missed=JSON.parse(localStorage.getItem('tp-srs')||'{}');
  return missed[name]||0;
}

// ── RUMACK-MATTHEW NOMOGRAM ──
function renderNomogram(){
  const apapVal=+document.getElementById('cf-apap')?.value||0;
  const hrsVal=+document.getElementById('cf-hrs')?.value||0;
  const wrap=document.getElementById('calc-results');if(!wrap)return;
  // Remove old nomogram if exists
  const old=document.getElementById('nomo-canvas-container');if(old)old.remove();
  const cont=document.createElement('div');cont.id='nomo-canvas-container';cont.className='nomo-wrap';
  cont.innerHTML=`<div class="nomo-title">Rumack-Matthew Nomogram</div>
    <div class="nomo-canvas-wrap"><canvas id="nomo-cvs" class="nomo-canvas" height="220"></canvas></div>
    <div id="nomo-result" class="nomo-result nomo-grey">Enter APAP level and hours post-ingestion above, then click Calculate</div>`;
  wrap.appendChild(cont);
  const canvas=document.getElementById('nomo-cvs');if(!canvas)return;
  const W=canvas.offsetWidth||380;canvas.width=W;canvas.height=220;
  const ctx=canvas.getContext('2d');
  const pl=48,pr=16,pt=16,pb=32;
  const iw=W-pl-pr;const ih=220-pt-pb;
  const maxH=24,maxL=350;
  function tx(h){return pl+(h/maxH)*iw;}
  function ty(l){return pt+((maxL-l)/maxL)*ih;}
  // Treatment line: 150 at 4h, halving every 4h
  const treatLine=[];for(let t=4;t<=24;t+=0.5){treatLine.push({t,lvl:150*Math.pow(0.5,(t-4)/4)});}
  // Background zones
  ctx.fillStyle='rgba(192,57,43,0.07)';ctx.beginPath();
  ctx.moveTo(tx(4),ty(150));
  treatLine.forEach(p=>ctx.lineTo(tx(p.t),ty(p.lvl)));
  ctx.lineTo(tx(24),ty(0));ctx.lineTo(tx(4),ty(0));ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(15,110,86,0.07)';ctx.beginPath();
  ctx.moveTo(tx(4),ty(150));
  treatLine.forEach(p=>ctx.lineTo(tx(p.t),ty(p.lvl)));
  ctx.lineTo(tx(24),ty(maxL));ctx.lineTo(tx(4),ty(maxL));ctx.closePath();ctx.fill();
  // Grid
  ctx.strokeStyle='rgba(128,128,128,0.12)';ctx.lineWidth=1;
  [50,100,150,200,250,300].forEach(l=>{ctx.beginPath();ctx.moveTo(pl,ty(l));ctx.lineTo(W-pr,ty(l));ctx.stroke();});
  [4,8,12,16,20,24].forEach(t=>{ctx.beginPath();ctx.moveTo(tx(t),pt);ctx.lineTo(tx(t),pt+ih);ctx.stroke();});
  // Axes
  ctx.strokeStyle='rgba(128,128,128,0.4)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(pl,pt);ctx.lineTo(pl,pt+ih);ctx.lineTo(pl+iw,pt+ih);ctx.stroke();
  // Axis labels
  ctx.fillStyle='rgba(128,128,128,0.8)';ctx.font='9px DM Mono,monospace';ctx.textAlign='center';
  [0,4,8,12,16,20,24].forEach(t=>{ctx.fillText(t,tx(t),pt+ih+12);});
  ctx.textAlign='right';
  [50,100,150,200,250,300].forEach(l=>{ctx.fillText(l,pl-4,ty(l)+3);});
  ctx.save();ctx.translate(12,pt+ih/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.fillText('APAP mcg/mL',0,0);ctx.restore();
  ctx.textAlign='center';ctx.fillText('Hours post-ingestion',pl+iw/2,220-2);
  // Treatment line
  ctx.strokeStyle='#C0392B';ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.beginPath();
  treatLine.forEach((p,i)=>{if(i===0)ctx.moveTo(tx(p.t),ty(p.lvl));else ctx.lineTo(tx(p.t),ty(p.lvl));});
  ctx.stroke();ctx.setLineDash([]);
  ctx.font='bold 9px DM Mono,monospace';
  ctx.fillStyle='#C0392B';ctx.textAlign='left';ctx.fillText('TREAT ABOVE LINE',tx(4.2),ty(160));
  ctx.fillStyle='#0F6E56';ctx.fillText('SAFE BELOW LINE',tx(4.2),ty(70));
  // Plot patient
  if(apapVal>0&&hrsVal>=4&&hrsVal<=24){
    const px=tx(hrsVal);const py=ty(apapVal);
    ctx.fillStyle='#1A1A1A';ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,2.5,0,Math.PI*2);ctx.fill();
    const threshold=150*Math.pow(0.5,(hrsVal-4)/4);
    const res=document.getElementById('nomo-result');
    if(apapVal>threshold){res.className='nomo-result nomo-treat';res.textContent=`TREAT — Level ${apapVal} mcg/mL at ${hrsVal}h is ABOVE threshold (${threshold.toFixed(0)} mcg/mL). Start NAC.`;}
    else{res.className='nomo-result nomo-safe';res.textContent=`SAFE — Level ${apapVal} mcg/mL at ${hrsVal}h is below threshold (${threshold.toFixed(0)} mcg/mL). Continue monitoring.`;}
  } else if(apapVal>0||hrsVal>0){
    const res=document.getElementById('nomo-result');res.className='nomo-result nomo-grey';
    res.textContent=hrsVal<4?'Nomogram valid only at ≥4h post-ingestion.':'Enter both APAP level and hours post-ingestion to plot.';
  }
}

// ── PWA / SERVICE WORKER ──
let deferredPwa=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredPwa=e;
  setTimeout(()=>{if(!localStorage.getItem('tp-pwa-dismissed'))document.getElementById('pwa-prompt').classList.add('show');},3000);
});
window.addEventListener('online',()=>document.getElementById('offline-banner').classList.remove('show'));
window.addEventListener('offline',()=>document.getElementById('offline-banner').classList.add('show'));
if(!navigator.onLine) document.getElementById('offline-banner').classList.add('show');
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}

// ── KEYBOARD SHORTCUTS ──
const KB_MAP={t:'toxidromes',a:'antidotes',c:'calculator',x:'compare',e:'environmental',p:'tools',q:'practice'};
document.addEventListener('keydown',e=>{
  if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(k==='escape'){clearDetailPanel();return;}
  if(k==='/'){e.preventDefault();document.getElementById('gsearch')?.focus();return;}
  if(KB_MAP[k]){e.preventDefault();showTab(KB_MAP[k]);return;}
});

// ── SCROLL TO TOP ──
window.addEventListener('scroll',()=>{
  document.getElementById('back-top').classList.toggle('show',window.scrollY>300);
},{passive:true});

// ── INIT ──
window.addEventListener('DOMContentLoaded',()=>{
  renderToxList();
  renderFavoritesSection();
  renderEnvList();
  renderAntidotes();
  renderCalcList();
  populateCmpSelects();
  renderBuilderChips();
  renderMatcher();
  shuffleQuiz();
  renderQuiz();
  pwReset();
  renderRecentSection();
  renderPerfChart('quiz-perf-canvas','quiz');
  renderPerfChart('sprint-perf-canvas','sprint');

  // PWA install button
  const pwaBtn=document.getElementById('pwa-install');
  if(pwaBtn) pwaBtn.onclick=async()=>{
    if(deferredPwa){
      deferredPwa.prompt();
      const{outcome}=await deferredPwa.userChoice;
      if(outcome==='accepted') document.getElementById('pwa-prompt').classList.remove('show');
      deferredPwa=null;
    }
  };
  const pwaDismiss=document.querySelector('#pwa-prompt .btn-ghost');
  if(pwaDismiss) pwaDismiss.addEventListener('click',()=>{localStorage.setItem('tp-pwa-dismissed','1');});

  // Restore tab from URL hash
  const h=location.hash.slice(1);
  const validTabs=['toxidromes','antidotes','calculator','compare','environmental','tools','practice'];
  if(validTabs.includes(h)) showTab(h);

  // Pause SVG animations when tab hidden
  document.addEventListener('visibilitychange',()=>{
    document.querySelectorAll('animate').forEach(a=>{
      if(document.hidden) a.setAttribute('repeatCount','0');
      else a.setAttribute('repeatCount','indefinite');
    });
  });
});
