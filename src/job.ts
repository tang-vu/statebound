import { parentPort,workerData } from 'node:worker_threads';
import { check,runScenario } from './checker.js';
import { bundle,acceptRepair,type Provenance } from './evidence.js';
import { type Mandate,type Plan,templateRepair,hash } from './core.js';
import {durableSimulation} from './runtime-simulator.js';
import {mkdirSync} from 'node:fs';
const data=workerData as {id:string;mandate:Mandate;plan:Plan;mode:'baseline'|'guarded';action:'check'|'repair'|'replay';provenance:Provenance;candidate?:Plan;ambiguity?:boolean};
try {
  parentPort!.postMessage({kind:'progress',phase:'Validating input and exploring the finite graph'});
  let plan=data.plan;let provenance=data.provenance;
  if(data.action==='repair') {plan=data.candidate??templateRepair(plan);provenance=data.candidate?'manual':'template repair';acceptRepair(data.mandate,data.plan,plan);}
  const mode=data.action==='repair'?'guarded':data.mode;
  const result=check(data.mandate,plan,mode);
  parentPort!.postMessage({kind:'progress',phase:'Search finished',states:result.states,transitions:result.transitions});
  const simulation=runScenario(data.mandate,plan,mode,{fill:'full',reply:'lost'},data.ambiguity?'notFound':'fresh');
  mkdirSync('.runtime/executions',{recursive:true});
  const runtime=data.action==='replay'?await durableSimulation(data.mandate,plan,`.runtime/executions/${data.id}.db`,data.ambiguity):null;
  const events=runtime?.events??(result.counterexample.length?result.counterexample:simulation.events);
  for(const event of events) parentPort!.postMessage({kind:'trace',event});
  const evidence=bundle(data.mandate,plan,mode,provenance,data.plan);
  if(runtime) {evidence.payload.executions.push({scenario:events.map(e=>e.choice),events,status:runtime.state.status,approvalMode:runtime.approvalMode});evidence.manifest=hash(evidence.payload);}
  parentPort!.postMessage({kind:'complete',result,plan,provenance,events,outcome:runtime?.state.status??simulation.world.agent.status,evidence,runtime:runtime?{ledgerExposure:runtime.ledgerExposure,approvalMode:runtime.approvalMode}:null});
}catch(e){parentPort!.postMessage({kind:'error',message:e instanceof Error?e.message:'Job failed'});}
