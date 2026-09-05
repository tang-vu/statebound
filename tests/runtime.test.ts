import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fixture,templateRepair,hash} from '../src/core.js';
import {durableSimulation} from '../src/runtime-simulator.js';
import {bundle,verify} from '../src/evidence.js';
test('durable runtime trace is identical to checker semantics and independently exportable',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'statebound-runtime-'));
  try {
    for(const ambiguity of [false,true]){
      const {mandate:m,plan:original}=fixture();const p=templateRepair(original);
      const runtime=await durableSimulation(m,p,join(dir,`${ambiguity}.db`),ambiguity);
      assert.equal(runtime.state.status,ambiguity?'UNRESOLVED':'COMPLETE');assert.equal(runtime.ledgerExposure,'15');
      const evidence=bundle(m,p,'guarded','template repair',original);
      evidence.payload.executions.push({scenario:runtime.events.map(e=>e.choice),events:runtime.events,status:runtime.state.status,approvalMode:runtime.approvalMode});evidence.manifest=hash(evidence.payload);
      assert.equal(verify(evidence).verified,true);
      const second=await durableSimulation(m,p,join(dir,`${ambiguity}.db`),ambiguity);assert.equal(second.events.length,0);assert.equal(second.ledgerExposure,'15');
    }
  }finally{rmSync(dir,{recursive:true});}
});
