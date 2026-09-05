import { z } from 'zod';
import { hash,validate,VERSION,MandateSchema,PlanSchema,type Mandate,type Plan,capabilities } from './core.js';
import { check,type Result,DEFAULT_BOUNDS,runScenario } from './checker.js';
import { replay,MODEL,type Event,type Choice } from './simulator.js';
export const InputSchema=z.strictObject({mandate:MandateSchema,plan:PlanSchema});
export type Provenance='fixture'|'manual'|'external_agent'|'template repair';
export function bundle(mandate:Mandate,plan:Plan,mode:'baseline'|'guarded',provenance:Provenance,original?:Plan) {
  validate(mandate,plan);const result=check(mandate,plan,mode);
  const payload={version:VERSION,model:MODEL,capabilities,mandate,plan,original:original??plan,mode,provenance,dataSource:'synthetic fixture',execution:'simulator',result,executions:[] as {scenario:Choice[];events:Event[];status:string;approvalMode:string}[]};
  return {payload,manifest:hash(payload)};
}
export type Bundle=ReturnType<typeof bundle>;
export function verify(raw:unknown,full=true) {
  const envelope=z.strictObject({payload:z.unknown(),manifest:z.string()}).parse(raw);
  if(hash(envelope.payload)!==envelope.manifest) throw Error('Integrity mismatch');
  const b=raw as Bundle;
  if(b.payload.version!==VERSION||b.payload.model!==MODEL||hash(b.payload.capabilities)!==hash(capabilities)) throw Error('Unsupported version/capabilities');
  const {mandate:m,plan:p,mode,result}=b.payload;
  if(!['baseline','guarded'].includes(mode)) throw Error('Invalid execution mode');
  validate(m,p);validate(m,b.payload.original);
  const rep=replay(m,p,mode,result.scenario);
  if(hash(rep.events)!==hash(result.counterexample)) throw Error('Replay events missing or altered');
  if(!Array.isArray(b.payload.executions))throw Error('Missing execution manifest');
  for(const execution of b.payload.executions) {
    const actual=replay(m,p,'guarded',execution.scenario);
    if(hash(actual.events)!==hash(execution.events)||actual.world.agent.status!==execution.status)throw Error('Execution trace or terminal status mismatch');
  }
  if(full) {
    const fresh=check(m,p,mode,result.bounds);
    const stable=(r:Result)=>({...r,durationMs:0});
    if(hash(stable(fresh))!==hash(stable(result))) throw Error('Recomputed coverage/verdict mismatch');
  }
  return {verified:true,scope:full?'replay and rerun finite bounded search':'trace only',status:result.status,manifest:b.manifest};
}
export function acceptRepair(m:Mandate,original:Plan,candidate:Plan) {
  validate(m,original);validate(m,candidate);
  for(const key of ['version','mandateHash','snapshot','adapter','maxSteps','maxDurationMs'] as const) if(candidate[key]!==original[key]) throw Error(`Repair changed protected ${key}`);
  const result=check(m,candidate,'guarded',DEFAULT_BOUNDS);
  if(result.status!=='NO_VIOLATION_WITHIN_BOUND'||!result.complete||!result.outcomes.COMPLETE) throw Error('Repair failed safety or progress gate');
  for(const fill of ['full','absent','half'] as const) {
    const r=runScenario(m,candidate,'guarded',{fill,reply:'lost'});
    // A terminal half fill may leave sub-minimum dust. It is not declared recoverable.
    if(fill!=='half'&&r.world.agent.status!=='COMPLETE')throw Error('Repair failed recoverable progress obligation');
  }
  return result;
}
