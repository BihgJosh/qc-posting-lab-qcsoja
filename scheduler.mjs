export const AREAS = ['Service managers', 'Main auditorium', 'Children section', 'Overflow tent', 'Overflow', 'Outside', 'Observation', 'QC timer', 'Timers'];
const aliases = { 'children section':'Children section', 'children':'Children section', 'overflow':'Overflow tent', 'overflow tent':'Overflow tent', 'outside':'Outside', 'observation':'Observation', 'observer':'Observation', 'qc timer':'QC timer', 'timer':'QC timer' };
const norm = v => String(v ?? '').trim().toLowerCase();
const day = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v)) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
export function validateData(raw) {
  if (!raw || !Array.isArray(raw.members) || !Array.isArray(raw.posts) || !Array.isArray(raw.observers)) throw Error('Expected members, posts and observers arrays.');
  if (raw.members.length > 2000 || raw.posts.length + raw.observers.length > 50000) throw Error('Import exceeds the test limit.');
  const keys = new Set();
  const members = raw.members.map(m => {
    if (!m.name || !m.email || !Array.isArray(m.eligibleAreas) || m.eligibleAreas.some(a => !AREAS.includes(a))) throw Error('Each member needs name, email and eligibleAreas from the listed locations.');
    const email = norm(m.email);
    if (keys.has(email)) throw Error('Duplicate member email. Use canonical Team Data identities.');
    keys.add(email); return {name:String(m.name), email, eligibleAreas:m.eligibleAreas};
  });
  return {members, posts:raw.posts, observers:raw.observers};
}
export function recommend(raw, {date, services, unavailable = [], maxLoad = 2}) {
  const data = validateData(raw);
  if (!day(date) || !Array.isArray(services) || !services.length || new Set(services).size !== services.length) throw Error('Choose a valid date and unique services.');
  if (!Number.isInteger(maxLoad) || maxLoad < 1 || maxLoad > 4) throw Error('Maximum load must be between one and four.');
  const evidence = new Map(); const seen = new Set(); let accepted = 0, excluded = 0;
  const add = (row, type) => {
    const area = type === 'observer' ? 'Observation' : aliases[norm(row.area)];
    const email = norm(row.reporter_email); const member = data.members.find(m => m.email === email);
    const name = type === 'observer' ? row.observer_name : row.reporter_name;
    const id = `${type}|${row.report_date}|${row.service}|${area}|${email}`;
    if (!area || !member || !day(row.report_date) || row.report_date >= date || norm(name) !== norm(member.name) || (row.submitted_by_email && norm(row.submitted_by_email) !== email) || row.headcount_only || row.assignment_override || seen.has(id)) {excluded++; return;}
    seen.add(id); accepted++;
    const key = `${email}|${area}`; evidence.set(key,(evidence.get(key)||0)+1);
  };
  data.posts.forEach(r=>add(r,'post')); data.observers.forEach(r=>add(r,'observer'));
  const absent = new Set(unavailable.map(norm)); const loads = new Map(); const used = new Set(); const assignments = [];
  for (const service of services) {
    // Fill locations with fewer eligible people first; a service cannot double-book a member.
    const eligibleCount = area => data.members.filter(m=>m.eligibleAreas.includes(area)&&!absent.has(m.email)).length;
    const strongestEvidence = area => Math.max(0,...data.members.filter(m=>m.eligibleAreas.includes(area)&&!absent.has(m.email)).map(m=>evidence.get(`${m.email}|${area}`)||0));
    const areas = [...AREAS].sort((a,b) => eligibleCount(a)-eligibleCount(b) || strongestEvidence(b)-strongestEvidence(a));
    for (const area of areas) {
      const candidates = data.members.filter(m=>m.eligibleAreas.includes(area)&&!absent.has(m.email)&&!used.has(`${service}|${m.email}`)&&(loads.get(m.email)||0)<maxLoad)
        .sort((a,b)=>(loads.get(a.email)||0)-(loads.get(b.email)||0) || (evidence.get(`${b.email}|${area}`)||0)-(evidence.get(`${a.email}|${area}`)||0) || a.email.localeCompare(b.email));
      const member=candidates[0]; const count=member ? evidence.get(`${member.email}|${area}`)||0 : 0;
      if(member){loads.set(member.email,(loads.get(member.email)||0)+1);used.add(`${service}|${member.email}`);}
      assignments.push({service,area,member:member||null,evidence:count,reason:member ? `${count} matching past report${count===1?'':'s'}; eligible; ${loads.get(member.email)} of ${maxLoad} allowed services.` : 'No eligible available member fits the load limit.'});
    }
  }
  return {date,assignments,accepted,excluded,unfilled:assignments.filter(a=>!a.member).length,loads:Object.fromEntries(loads)};
}

export function recommendPostings(raw, {date, day:serviceDay, postings, unavailable=[], maxLoad=2}) {
 const data=validateData(raw);
 if(!day(date)||!['Sunday','Thursday'].includes(serviceDay)||!Number.isInteger(maxLoad)||maxLoad<1||maxLoad>4)throw Error('Select a valid date, service day and maximum load.');
 const services=serviceDay==='Sunday'?['1st Service','2nd Service','3rd Service','4th Service']:['Thursday Service'];
 if(new Date(`${date}T12:00:00Z`).getUTCDay()!==(serviceDay==='Sunday'?0:4))throw Error('Service date must match the selected Sunday or Thursday.');
 const output=postings.filter(p=>p.day===serviceDay).map(p=>({...p,columns:[...p.columns],rows:p.rows.map(r=>({...r,capacities:[...r.capacities],assignments:p.columns.map(()=>[])}))}));
 const slots=[];
 for(const p of output){if(!AREAS.includes(p.name)||!p.columns.length)throw Error('Unknown posting section or empty position columns.');for(const r of p.rows){
  if(r.capacities.length!==p.columns.length||r.capacities.some(n=>!Number.isInteger(n)||n<0||n>20))throw Error('Each position requires between 0 and 20 members.');
  const covers=services.filter(s=>serviceDay==='Thursday'?r.label.toLowerCase().includes('thursday'):r.label.includes(s.split(' ')[0]));
  if(!covers.length)throw Error(`Unsupported service row: ${r.label}`);
  r.capacities.forEach((n,column)=>{for(let index=0;index<n;index++)slots.push({p,r,column,index,covers});});
 }}
 if(slots.length>500)throw Error('Reduce total required member entries below 501 for this test.');
 const absent=new Set(unavailable.map(norm)),loads=new Map(),used=new Set(),gaps=[],reasons={},evidence=new Map(),seen=new Set();let accepted=0,excluded=0;
 for(const [type,records] of [['post',data.posts],['observer',data.observers]])for(const row of records){
  const email=norm(row.reporter_email),member=data.members.find(m=>m.email===email),area=type==='observer'?'Observation':aliases[norm(row.area)],name=type==='observer'?row.observer_name:row.reporter_name;
  const key=`${type}|${row.report_date}|${row.service}|${area}|${email}`;
  if(!area||!member||!day(row.report_date)||row.report_date>=date||norm(name)!==norm(member.name)||(row.submitted_by_email&&norm(row.submitted_by_email)!==email)||row.headcount_only||row.assignment_override||seen.has(key)){excluded++;continue;}
  seen.add(key);accepted++;const k=`${email}|${area}`;evidence.set(k,(evidence.get(k)||0)+1);
 }
 const areaForEvidence=p=>p.name==='Overflow'?'Overflow tent':p.name==='Timers'?'QC timer':p.name;
 const eligible=(m,slot)=>m.eligibleAreas.includes(slot.p.name)&&!absent.has(m.email)&&slot.covers.length+(loads.get(m.email)||0)<=maxLoad&&!slot.covers.some(s=>used.has(`${s}|${m.email}`));
 while(slots.length){
  slots.sort((a,b)=>data.members.filter(m=>eligible(m,a)).length-data.members.filter(m=>eligible(m,b)).length||b.covers.length-a.covers.length);
  const slot=slots.shift(),area=areaForEvidence(slot.p);
  const candidates=data.members.filter(m=>eligible(m,slot)).sort((a,b)=>(loads.get(a.email)||0)-(loads.get(b.email)||0)||(evidence.get(`${b.email}|${area}`)||0)-(evidence.get(`${a.email}|${area}`)||0)||a.email.localeCompare(b.email));
  const member=candidates[0];
  if(!member){gaps.push({postingId:slot.p.id,rowId:slot.r.id,column:slot.column,position:slot.p.columns[slot.column],covers:slot.covers,area:slot.p.name});continue;}
  slot.r.assignments[slot.column].push({name:member.name,email:member.email});loads.set(member.email,(loads.get(member.email)||0)+slot.covers.length);slot.covers.forEach(s=>used.add(`${s}|${member.email}`));
  const count=evidence.get(`${member.email}|${area}`)||0;
  reasons[`${slot.r.id}|${slot.column}|${member.email}`]=`${count} matching past report${count===1?'':'s'} · eligible · covers ${slot.covers.length} service${slot.covers.length===1?'':'s'}`;
 }
 const required=output.reduce((n,p)=>n+p.rows.reduce((t,r)=>t+r.capacities.reduce((a,b)=>a+b,0),0),0);
 return {date,day:serviceDay,postings:output,reasons,gaps,required,assigned:required-gaps.length,accepted,excluded,loads:Object.fromEntries(loads),services};
}
