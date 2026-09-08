import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {deriveBinanceModel} from '../src/binance-bridge.js';
import {hash,cost,type Plan} from '../src/core.js';
import {bundle,verify,acceptRepair} from '../src/evidence.js';
import {runScenario} from '../src/checker.js';
import {replay} from '../src/simulator.js';

const input=JSON.parse(readFileSync('examples/binance-read.json','utf8'));
const candidate=JSON.parse(readFileSync('examples/external-agent-run.json','utf8')).output as Plan;
const {mandate,plan,repaired,provenance}=deriveBinanceModel(input,candidate);
acceptRepair(mandate,plan,repaired);
const baseline=bundle(mandate,plan,'baseline','fixture');
const repair=bundle(mandate,repaired,'guarded','external_agent',plan);
assert.equal(baseline.payload.result.status,'COUNTEREXAMPLE_FOUND');
for(const item of [baseline,repair]){item.payload.result.durationMs=0;item.manifest=hash(item.payload);verify(item);}
const traces=([['blind',plan,'baseline','fresh'],['repaired',repaired,'guarded','fresh'],['unresolved',repaired,'guarded','notFound']] as const).map(([id,p,mode,read])=>{
  const run=runScenario(mandate,p,mode,{fill:'full',reply:'lost'},read);
  assert.equal(hash(replay(mandate,p,mode,run.events.map(e=>e.choice)).events),hash(run.events));
  return {id,status:run.world.agent.status,debit:run.events.at(-1)!.actualDebit,events:run.events};
});
assert.equal(traces[1].status,'COMPLETE');assert.equal(traces[2].status,'UNRESOLVED');
const payload={version:1,route:'Binance Skills Hub -> official Binance CLI -> derived synthetic model -> check -> recorded external AI repair -> recheck -> replay',provenance,mandate,maximumOrderDebit:cost(mandate,mandate.goal).debit,baseline,repair,traces};
const output={payload,manifest:hash(payload)};
const file='submission/binance-workflow.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(file,'utf8')),output,'Regenerate Binance workflow after changing its inputs');
else writeFileSync(file,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({verified:true,observedAt:provenance.observedAt,price:mandate.limitPrice,quantity:mandate.goal,maximumOrderDebit:output.payload.maximumOrderDebit,baseline:baseline.payload.result.status,repair:repair.payload.result.status,traces:traces.map(({id,status,debit})=>({id,status,debit})),manifest:output.manifest},null,2));
