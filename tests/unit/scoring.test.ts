import { describe, it, expect } from 'vitest';
import { seedWorkspace } from '../../src/domain/fixtures';
import { evaluate, priority } from '../../src/domain/scoring';
import { serviceSchema } from '../../src/domain/model';
const at='2026-09-26T12:00:00Z';
function fixture(){const w=seedWorkspace();const c=w.companies[0],s=w.services[0];const e=w.evidence.filter(e=>e.companyId===c.id&&e.serviceId===s.id).map(e=>({...e,eventDate:at,quality:1}));return {c,s,e};}
describe('deterministic evidence scoring',()=>{
  it('matches the whitepaper regression',()=>{expect(priority(90,60.4,0)).toBe(70.76);expect(Math.round(priority(90,60.4,0))).toBe(71);});
  it('does not inflate score for five syndicated copies',()=>{const {c,s,e}=fixture();const a=evaluate(c,s,e,at);expect(evaluate(c,s,[...e,...Array.from({length:5},(_,i)=>({...e[0],id:`copy-${i}`}))],at).P).toBe(a.P);});
  it('uses the fixed ICP denominator and reports unknown coverage',()=>{const {c,s,e}=fixture();const r=evaluate({...c,employees:null},s,e,at);expect(r.F).toBe(70);expect(r.K).toBe(70);expect(r.status).toBe('review');});
  it('does not convert missing evidence to no',()=>{const {c,s}=fixture();const r=evaluate(c,s,[],at);expect(r.C).toBe(0);expect(r.contributions.every(c=>c.answer==='unknown')).toBe(true);expect(r.status).toBe('review');});
  it('requires actual quotes in stored text',()=>{const {c,s,e}=fixture();const r=evaluate(c,s,e.map(e=>({...e,quote:'invented unsupported text'})),at);expect(r.R).toBe(0);expect(r.C).toBe(0);});
  it('abstains on contradictory evidence',()=>{const {c,s,e}=fixture();const r=evaluate(c,s,[...e,{...e[0],id:'contradiction',answer:'no'}],at);expect(r.contributions[0].answer).toBe('conflict');expect(r.contributions[0].points).toBe(0);expect(r.status).toBe('review');});
  it('unknown date factor is explicit',()=>{const {c,s,e}=fixture();const r=evaluate(c,s,[{...e[0],eventDate:null}],at);expect(r.contributions[0].decay).toBe(.25);});
  it('halves readiness after one half life',()=>{const {c,s,e}=fixture();const future=new Date(Date.parse(at)+s.questions[0].halfLife*86400000).toISOString();expect(evaluate(c,s,[e[0]],future).R).toBe(evaluate(c,s,[e[0]],at).R/2);});
  it('caps correlated groups',()=>{const {c,s,e}=fixture();s.questions=s.questions.map(q=>({...q,group:'same'}));s.groupCap=20;expect(evaluate(c,s,e,at).R).toBe(20);});
  it('disqualifies mandatory mismatches regardless of score',()=>{const {c,s,e}=fixture();expect(evaluate({...c,country:'Germany'},s,e,at).status).toBe('excluded');});
  it('blocks ambiguous identity',()=>{const {c,s,e}=fixture();expect(evaluate({...c,identity:'ambiguous'},s,e,at).status).toBe('review');});
  it('invalidates previous answers when question text changes',()=>{const {c,s,e}=fixture();s.questions[0].text='Is there a new acquisition?';expect(evaluate(c,s,e,at).contributions[0].answer).toBe('unknown');});
  it('caps penalties at thirty and distinguishes exclusion',()=>{const {c,s,e}=fixture();s.questions.push({...s.questions[0],id:'penalty',kind:'penalty',weight:100});const more={...e[0],id:'penalty-evidence',questionId:'penalty'};expect(evaluate(c,s,[...e,more],at).N).toBe(30);s.questions[3].kind='exclude';expect(evaluate(c,s,[...e,more],at).status).toBe('excluded');});
  it('rejects zero weights, duplicate IDs and invalid numeric criteria',()=>{const {s}=fixture();expect(serviceSchema.safeParse({...s,questions:s.questions.map(q=>({...q,weight:0}))}).success).toBe(false);expect(serviceSchema.safeParse({...s,questions:[s.questions[0],s.questions[0]]}).success).toBe(false);s.criteria[2].value='not-a-number';expect(serviceSchema.safeParse(s).success).toBe(false);});
  it('isolates company and service evidence',()=>{const {c,s,e}=fixture();expect(evaluate({...c,id:'other'},s,e,at).R).toBe(0);expect(evaluate(c,{...s,id:'other'},e,at).R).toBe(0);});
});
