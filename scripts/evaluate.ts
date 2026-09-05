import { readFileSync,writeFileSync } from 'node:fs';
import { fixture,hash,type Plan,D } from '../src/core.js';
import { runScenario,check } from '../src/checker.js';
import { concreteDebit } from '../src/simulator.js';
// Prespecified parameter and fault corpus. Run only after freezing the candidate.
// This is a separate regression corpus, not a blinded model benchmark.
const candidate=(JSON.parse(readFileSync('examples/codex-repaired.json','utf8')) as {plan:Plan}).plan;
const rows=[];
for(const [goal,budget,bps] of [['0.017','16',10],['0.031','25',25],['0.047','38',5]] as const) {
  const {mandate:m,plan:p}=fixture(budget,goal,bps);const repaired={...candidate,mandateHash:hash(m)};
  for(const [name,plan,mode] of [['baseline',p,'baseline'],['guarded-original',p,'guarded'],['repaired',repaired,'guarded']] as const) {
    const counts={cases:0,violations:0,complete:0,unresolved:0,refused:0,incomplete:0};
    for(const fill of ['full','half','none','absent'] as const) for(const reply of ['delivered','lost'] as const) for(const read of ['fresh','notFound'] as const) {
      const r=runScenario(m,plan,mode,{fill,reply},read);counts.cases++;
      if(D(concreteDebit(r.world.exchange))>D(m.budget)) counts.violations++;
      if(r.world.agent.status==='COMPLETE')counts.complete++;else if(r.world.agent.status==='UNRESOLVED')counts.unresolved++;else if(r.world.agent.status==='REFUSED')counts.refused++;else counts.incomplete++;
    }
    const bounded=check(m,plan,mode);rows.push({goal,budget,feeBps:bps,variant:name,...counts,checker:{status:bounded.status,states:bounded.states,transitions:bounded.transitions}});
    if(name==='repaired'&&(counts.violations||counts.incomplete||!counts.complete||bounded.status!=='NO_VIOLATION_WITHIN_BOUND'))throw Error('Unexpected repaired regression');
  }
}
writeFileSync('examples/evaluation.json',JSON.stringify({candidateHash:hash(candidate),denominator:'16 deterministic scenarios per variant per mandate; 3 mandates. Safety and progress counted separately.',rows},null,2));
console.table(rows.map(({checker,...row})=>({...row,checker:checker.status})));
