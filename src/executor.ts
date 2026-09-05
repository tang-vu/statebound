import { type Mandate,type Plan,type State,type Effect,type Observation,initial,transition,observe,validate } from './core.js';
import { binding,check } from './checker.js';
import { Ledger,type Approval } from './ledger.js';
export interface RuntimeAdapter {id:'simulator-ioc-v1';effect(effect:Effect):Promise<Observation|null>}
export type Checkpoint={binding:string;state:State;pending:string|null;stopped:boolean};
function ingest(m:Mandate,state:State,effect:Effect,observation:Observation|null) {
  if(!observation)return;
  if(observation.account!==m.account||observation.symbol!==m.symbol||observation.environment!==m.environment||('id' in effect&&observation.id!==effect.id)) {state.k.invalid=true;state.reason='Observation scope or correlation mismatch';return;}
  state.k=observe(state.k,observation);
}
export async function execute(m:Mandate,p:Plan,ledger:Ledger,run:string,adapter:RuntimeAdapter,approve:(effect:Effect)=>Promise<Approval>,stopped:()=>boolean=()=>false,onEvent:(state:State,effect:Effect,observation:Observation|null)=>void=()=>{}) {
  validate(m,p);if(adapter.id!==p.adapter) throw Error('Adapter mismatch');
  const prior=ledger.loadExecution(run) as Checkpoint|undefined;
  if(prior&&prior.binding!==binding(m,p)) throw Error('Execution binding changed');
  if(!prior&&check(m,p).status!=='NO_VIOLATION_WITHIN_BOUND') throw Error('Execution needs complete check');
  ledger.lease(m.account,run);let state=prior?.state??initial(p);let halted=prior?.stopped??false;const begin=Date.now();
  try {
    // A prepared attempt may or may not have left this process. Only read-only reconciliation is admissible.
    if(prior?.pending) {
      const effect={kind:'query' as const,id:prior.pending};const observation=await adapter.effect(effect);ingest(m,state,effect,observation);
      ledger.reconcile(m.account,state);
      if(state.k.invalid||state.k.orders.some(b=>!b.terminal)) {state.status='UNRESOLVED';state.reason='Recovered ambiguous attempt retains reservation';}
      ledger.checkpoint(run,{binding:binding(m,p),state,pending:null,stopped:halted});
    }
    while(state.status==='RUNNING') {
      halted=halted||stopped()||Date.now()-begin>p.maxDurationMs||Date.now()>=Date.parse(m.expiresAt);
      const t=transition(m,p,state,'guarded');
      if(t.effect.kind==='submit'&&halted) {state.status='UNRESOLVED';state.reason='Stopped or expired; pending effects are not cancelled';break;}
      ledger.lease(m.account,run);
      if(t.effect.kind==='submit') {
        const approval=await approve(t.effect);
        if(stopped()) {state.status='UNRESOLVED';state.reason='Stopped before dispatch';break;}
        if(!ledger.prepare(m,p,run,t.effect,approval,state)) {state.status='UNRESOLVED';state.reason='Existing attempt tombstone prevents reuse';break;}
      }
      state=t.state;
      let observation:Observation|null=null;
      try {observation=await adapter.effect(t.effect);} catch {observation={kind:'timeout',id:'id' in t.effect?t.effect.id:undefined,account:m.account,symbol:m.symbol,environment:m.environment};}
      ingest(m,state,t.effect,observation);
      ledger.reconcile(m.account,state);
      ledger.transaction(()=>{ledger.checkpoint(run,{binding:binding(m,p),state,pending:null,stopped:halted});ledger.event(run,{state,effect:t.effect,observation});});
      onEvent(state,t.effect,observation);
    }
    ledger.checkpoint(run,{binding:binding(m,p),state,pending:null,stopped:halted});return state;
  } finally {ledger.release(m.account,run);}
}
