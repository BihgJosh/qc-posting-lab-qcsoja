import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {recommendPostings} from './scheduler.mjs';
const template=JSON.parse(fs.readFileSync(new URL('./posting-template.json',import.meta.url),'utf8')).postings;
const data=JSON.parse(fs.readFileSync(new URL('./sample-data.json',import.meta.url),'utf8'));
const options={date:'2026-10-04',day:'Sunday',postings:template,maxLoad:2};
test('matches saved matrix, counts and paired-service coverage without conflicts',()=>{
 const r=recommendPostings(data,options);assert.equal(r.required,44);assert.equal(r.assigned,44);assert.equal(r.gaps.length,0);assert.equal(r.postings.length,6);
 assert.ok(Object.values(r.loads).every(n=>n<=2));assert.equal(Object.values(r.loads).reduce((a,b)=>a+b,0),48);
 for(const token of ['1st','2nd','3rd','4th']){const emails=r.postings.flatMap(p=>p.rows.filter(row=>row.label.includes(token)).flatMap(row=>row.assignments.flat().map(m=>m.email)));assert.equal(emails.length,12);assert.equal(new Set(emails).size,emails.length);}
 for(const p of r.postings)for(const row of p.rows)row.assignments.forEach((list,i)=>assert.equal(list.length,row.capacities[i]));
});
test('paired rows require two services of capacity and unavailable leaders excluded',()=>{
 const r=recommendPostings(data,{...options,maxLoad:1});assert.ok(r.gaps.filter(g=>['Service managers','QC timer'].includes(g.area)).length===4);
 const unavailable=data.members.filter(m=>m.eligibleAreas.includes('Service managers')).map(m=>m.email);
 const limited=recommendPostings(data,{...options,unavailable});assert.equal(limited.gaps.filter(g=>g.area==='Service managers').length,2);
 assert.ok(!limited.postings.flatMap(p=>p.rows.flatMap(row=>row.assignments.flat())).some(m=>unavailable.includes(m.email)));
});
test('multiple members per cell supported and not double-booked',()=>{
 const postings=structuredClone(template).filter(p=>p.day==='Sunday'&&p.name==='Children section');postings[0].rows[0].capacities=[3,2];
 const r=recommendPostings(data,{...options,postings});assert.equal(r.postings[0].rows[0].assignments[0].length,3);assert.equal(r.postings[0].rows[0].assignments[1].length,2);assert.equal(new Set(r.postings[0].rows[0].assignments.flat().map(m=>m.email)).size,5);
});
test('preserves empty Thursday layout and rejects invalid dates/counts',()=>{
 const r=recommendPostings(data,{...options,date:'2026-10-01',day:'Thursday'});assert.equal(r.required,0);assert.equal(r.postings.length,6);assert.equal(r.postings[0].name,'Main auditorium');
 assert.throws(()=>recommendPostings(data,{...options,date:'2026-02-30'}));assert.throws(()=>recommendPostings(data,{...options,date:'2026-10-01'}));
 const bad=structuredClone(template);bad.find(p=>p.day==='Sunday').rows[0].capacities[0]=1.5;assert.throws(()=>recommendPostings(data,{...options,postings:bad}));
});
test('future, proxy, duplicate and correction evidence excluded',()=>{
 const p=data.posts[0];const r=recommendPostings({...data,posts:[p,p,{...p,report_date:'2026-10-04'},{...p,submitted_by_email:'proxy@example.invalid'},{...p,headcount_only:true}],observers:[]},options);assert.equal(r.accepted,1);assert.equal(r.excluded,4);
});
