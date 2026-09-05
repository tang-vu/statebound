import {type Mandate,type Plan,type Effect,initial,exposure} from './core.js';
import {deliver,concreteDebit,type ExchangeState,type Choice,type Event} from './simulator.js';
import {execute,type RuntimeAdapter} from './executor.js';
import {Ledger,approveAction} from './ledger.js';
export async function durableSimulation(m:Mandate,p:Plan,path:string,ambiguity=false) {
  const ledger=new Ledger(path);const run='simulated-execution';
  let exchange=(ledger.loadExecution('hidden-exchange') as ExchangeState|undefined)??{orders:[]};let last=initial(p);const events:Event[]=[];
  let choice:Choice={tick:true};let hiddenEvents:Event['hiddenEvents']=[];
  const adapter:RuntimeAdapter={id:'simulator-ioc-v1',async effect(effect:Effect){
    choice=effect.kind==='submit'?{fill:'full',reply:exchange.orders.length===0?'lost':'delivered'}:effect.kind==='query'?{read:ambiguity?'notFound':'fresh'}:{tick:true};
    const delivery=deliver(m,exchange,effect,choice);exchange=delivery.exchange;hiddenEvents=delivery.hiddenEvents;
    ledger.checkpoint('hidden-exchange',exchange);return delivery.observation;
  }};
  try {
    const state=await execute(m,p,ledger,run,adapter,async effect=>approveAction(m,p,effect),()=>false,(state,effect,observation)=>{
      events.push({step:state.step,node:last.node,effect,choice,observation,hiddenEvents,before:last.k,after:state.k,actualDebit:concreteDebit(exchange),possibleDebit:exposure(state.k),status:state.status,reason:state.reason});last=state;
    });
    return {state,events,approvals:ledger.approvals(m.account),ledgerExposure:ledger.reserved(m.account),approvalMode:'operator-requested simulator rehearsal; automatic exact-action approvals only for fake effects'};
  }finally{ledger.close();}
}
