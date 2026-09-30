import {recommendPostings,validateData} from './scheduler.mjs';
const $=id=>document.getElementById(id);let data,draft,template;
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function members(){ $('members').replaceChildren();for(const m of data.members){const label=make('label','member');const box=make('input');box.type='checkbox';box.checked=true;box.value=m.email;const text=make('span','',m.name);text.append(make('small','',m.eligibleAreas.join(' · ')));label.append(box,text);$('members').append(label);box.addEventListener('change',invalidate);}}
function invalidate(){draft=null;$('export').disabled=true;$('schedule').replaceChildren(make('p','muted','Inputs changed. Generate a new draft to review these settings.'));$('stats').replaceChildren();$('evidence').textContent='';}
function requirements(){
 $('requirements').replaceChildren();
 for(const p of template.postings.filter(p=>p.day===$('day').value)){
  const detail=make('details','capacity-section');const total=()=>p.rows.reduce((n,r)=>n+r.capacities.reduce((a,b)=>a+b,0),0);const summary=make('summary','',`${p.name} · ${total()} required`);detail.append(summary);
  const wrap=make('div','matrix-scroll'),table=make('table','matrix'),head=make('thead'),hr=make('tr');hr.append(make('th','','Service'));p.columns.forEach(c=>hr.append(make('th','',c)));head.append(hr);table.append(head);const body=make('tbody');
  for(const r of p.rows){const tr=make('tr');tr.append(make('th','',r.label));p.columns.forEach((c,i)=>{const td=make('td'),input=make('input');input.type='number';input.min='0';input.max='20';input.step='1';input.value=r.capacities[i];input.setAttribute('aria-label',`${p.name}, ${r.label}, ${c}, required members`);input.addEventListener('input',()=>{r.capacities[i]=Number(input.value);summary.textContent=`${p.name} · ${total()} required`;invalidate();});td.append(input);tr.append(td);});body.append(tr);}table.append(body);wrap.append(table);detail.append(wrap);$('requirements').append(detail);
 }
}
function render(){
 $('stats').replaceChildren();for(const [value,label] of [[draft.assigned,'MEMBER ENTRIES'],[draft.required,'REQUIRED ENTRIES'],[draft.gaps.length,'UNFILLED ENTRIES']]){const stat=make('div','stat');stat.append(make('b','',value),make('span','',label));$('stats').append(stat);}
 $('evidence').textContent=`${draft.accepted} past reports used · ${draft.excluded} excluded · ${Object.keys(draft.loads).length} unique members assigned. Paired rows appear under both services and count toward both service loads.`;
 $('schedule').replaceChildren();
 for(const [index,service] of draft.services.entries()){
  const applies=r=>draft.day==='Thursday'?r.label.toLowerCase().includes('thursday'):r.label.includes(service.split(' ')[0]);
  const locations=draft.postings.map(p=>({p,rows:p.rows.filter(applies)})).filter(({rows})=>rows.some(r=>r.capacities.some(n=>n>0)));
  const assigned=locations.reduce((n,{rows})=>n+rows.reduce((t,r)=>t+r.assignments.reduce((v,list)=>v+list.length,0),0),0),required=locations.reduce((n,{rows})=>n+rows.reduce((t,r)=>t+r.capacities.reduce((a,b)=>a+b,0),0),0);
  const detail=make('details','service-board');detail.open=index===0;const summary=make('summary'),info=make('span','service-info');info.append(make('strong','',service),make('small','',`${assigned} assignments across ${locations.length} locations · ${required-assigned} gaps`));summary.append(make('span','service-number',index+1),info,make('span','chevron','⌄'));detail.append(summary);
  const content=make('div','service-content');if(!locations.length)content.append(make('p','empty','No members requested for this service. Set the section counts above.'));
  for(const {p,rows} of locations){const section=make('section','board-location'),count=rows.reduce((n,r)=>n+r.assignments.reduce((t,list)=>t+list.length,0),0),needed=rows.reduce((n,r)=>n+r.capacities.reduce((a,b)=>a+b,0),0);section.append(make('h3','',`${p.name} · ${count}/${needed} members`),make('p','location-role',p.role));
   for(const r of rows){if(r.label.includes('&'))section.append(make('p','paired',`Applies to ${r.label}`));const columns=make('div','position-grid');p.columns.forEach((column,i)=>{if(!r.capacities[i])return;const position=make('div','board-position');position.append(make('h4','',`${column} · ${r.assignments[i].length}/${r.capacities[i]}`));for(const member of r.assignments[i]){const card=make('div','member-pass'),initials=member.name.split(/\s+/).slice(0,2).map(v=>v[0]).join(''),text=make('div');text.append(make('strong','',member.name),make('small','',draft.reasons[`${r.id}|${i}|${member.email}`]));card.append(make('span','avatar',initials),text);position.append(card);}for(let gap=r.assignments[i].length;gap<r.capacities[i];gap++)position.append(make('div','gap-card','Member needed'));columns.append(position);});section.append(columns);}content.append(section);
  }detail.append(content);$('schedule').append(detail);
 }
 $('export').disabled=false;
}
function generate(){try{draft=recommendPostings(data,{date:$('date').value,day:$('day').value,postings:template.postings,maxLoad:Number($('max').value),unavailable:[...$('members').querySelectorAll('input:not(:checked)')].map(e=>e.value)});$('error').textContent='';render();}catch(e){$('error').textContent=e.message;invalidate();}}
async function demo(){data=validateData(await(await fetch('sample-data.json',{cache:'no-store'})).json());$('source').textContent='Synthetic demonstration data · fictional members';members();generate();}
$('import').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>10000000)throw Error('Choose a JSON export below 10 MB.');data=validateData(JSON.parse(await f.text()));$('source').textContent=`Imported export · ${data.members.length} members · ${data.posts.length+data.observers.length} reports`;members();generate();}catch(err){$('error').textContent=err.message;}finally{e.target.value='';}});
for(const id of ['date','max'])$(id).addEventListener('change',invalidate);
$('day').addEventListener('change',()=>{requirements();invalidate();});
$('restore').addEventListener('click',async()=>{template=await(await fetch('posting-template.json',{cache:'no-store'})).json();requirements();invalidate();});
$('generate').addEventListener('click',generate);$('reset').addEventListener('click',demo);
$('export').addEventListener('click',()=>{if(!draft)return;const url=URL.createObjectURL(new Blob([JSON.stringify({...draft,status:'DRAFT_REQUIRES_REVIEW',model:'rules-baseline-v0.2',source:$('source').textContent},null,2)],{type:'application/json'}));const a=make('a');a.href=url;a.download=`qc-posting-draft-${draft.date}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
(async()=>{template=await(await fetch('posting-template.json',{cache:'no-store'})).json();requirements();await demo();})().catch(e=>$('error').textContent=e.message);
