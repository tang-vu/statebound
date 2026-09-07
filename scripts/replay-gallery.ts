import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fixture,hash,validate,confirmed,type Plan} from '../src/core.js';
import {runScenario} from '../src/checker.js';
import {replay,MODEL} from '../src/simulator.js';

// Precomputed simulator traces, not a public execution endpoint or a new benchmark.
const {mandate,plan:original}=fixture();
const candidate=JSON.parse(readFileSync('examples/external-agent-run.json','utf8')).output as Plan;
const repaired={...candidate,mandateHash:hash(mandate)};
validate(mandate,repaired);
const definitions=[
  {id:'blind',label:'Blind retry',plan:original,mode:'baseline',read:'fresh',expected:'UNRESOLVED',debit:'30',summary:'A stale balance triggers another purchase. Two fills exceed the mandate.',conditions:'First order fills; reply is lost; the original plan reads a stale balance.'},
  {id:'guard',label:'Guard only',plan:original,mode:'guarded',read:'fresh',expected:'REFUSED',debit:'15',summary:'The exposure guard refuses the second purchase. Spend is contained, but the goal remains unconfirmed.',conditions:'The same lost reply and stale balance, with aggregate exposure admission enabled.'},
  {id:'repair',label:'Reconciled',plan:repaired,mode:'guarded',read:'fresh',expected:'COMPLETE',debit:'15',summary:'The repair queries the original attempt. Terminal evidence confirms the goal without another purchase.',conditions:'First order fills; reply is lost; the order query returns terminal evidence.'},
  {id:'unknown',label:'Still unknown',plan:repaired,mode:'guarded',read:'notFound',expected:'UNRESOLVED',debit:'15',summary:'Inconclusive lookups exhaust the read bound. Possible exposure stays reserved and progress remains unresolved.',conditions:'First order fills; reply is lost; subsequent order lookups remain inconclusive.'}
] as const;
const cases=definitions.map(definition=>{
  const run=runScenario(mandate,definition.plan,definition.mode,{fill:'full',reply:'lost'},definition.read);
  const choices=run.events.map(event=>event.choice);
  const recomputed=replay(mandate,definition.plan,definition.mode,choices);
  assert.equal(hash(recomputed.events),hash(run.events));
  assert.equal(run.world.agent.status,definition.expected);
  assert.equal(run.events.at(-1)?.actualDebit,definition.debit);
  return {id:definition.id,label:definition.label,summary:definition.summary,conditions:definition.conditions,plan:definition.plan,mode:definition.mode,terminal:run.world.agent.status,traceHash:hash(run.events),events:run.events.map(event=>({...event,confirmedDebit:confirmed(event.after)}))};
});
const payload={version:1,model:MODEL,source:'Precomputed simulator traces; replayed through the shared interpreter',mandate,cases};
const output={...payload,manifest:hash(payload)};
const file='preview/replay-gallery.json';
if(process.argv.includes('--check')){
  assert.deepEqual(JSON.parse(readFileSync(file,'utf8')),output,'Saved gallery must match regenerated simulator traces');
  console.log('All four gallery cases reproduce exactly, including status, debit and trace hashes.');
}else{
  writeFileSync(file,JSON.stringify(output,null,2)+'\n');
  console.log('Generated four verified simulator gallery cases.');
}
