import { type Mandate,type Plan,type State,type Observation,type Effect,D,F,cost,hash,initial,observe,sum,transition,exposure } from './core.js';

export const MODEL='ioc-discrete-v1';
export type Choice={fill:'full'|'half'|'none'|'absent';reply:'delivered'|'lost'}|{read:'fresh'|'stale'|'notFound'|'partial'}|{tick:true};
export type Order={id:string;quantity:string;debit:string;net:string;principal:string;fee:string;feeAsset:string;accepted:boolean;status:'FILLED'|'EXPIRED'|'ABSENT'};
export type ExchangeState={orders:Order[]};
export type World={agent:State;exchange:ExchangeState};
export type Event={step:number;node:string;effect:Effect;choice:Choice;observation:Observation|null;hiddenEvents:Order[];before:State['k'];after:State['k'];actualDebit:string;possibleDebit:string;status:State['status'];reason:string};
export const start=(p:Plan):World=>({agent:initial(p),exchange:{orders:[]}});
export function choices(effect:Effect):Choice[] {
  if(effect.kind==='submit') return (['full','half','none','absent'] as const).flatMap(fill=>(['delivered','lost'] as const).map(reply=>({fill,reply})));
  if(effect.kind==='query') return ['fresh','stale','notFound','partial'].map(read=>({read}) as Choice);
  return [{tick:true}];
}
export function concreteDebit(e:ExchangeState) {return sum(e.orders.map(o=>o.debit));}
export function sound(w:World):boolean {
  return w.exchange.orders.every(o=>{const b=w.agent.k.orders.find(x=>x.id===o.id);return b&&D(b.debit)<=D(o.debit)&&D(b.net)<=D(o.net)&&D(o.debit)<=D(b.terminal?b.debit:b.max)&&(!b.terminal||D(b.net)===D(o.net));});
}
export function step(m:Mandate,p:Plan,w0:World,mode:'baseline'|'guarded',choice:Choice):{world:World;event:Event} {
  const w=structuredClone(w0);
  // Only the public agent state enters the interpreter. Exchange state is adapter-owned.
  const t=transition(m,p,w.agent,mode);w.agent=t.state;
  const effect=t.effect;
  const delivery=deliver(m,w.exchange,effect,choice);w.exchange=delivery.exchange;
  const {observation,hiddenEvents}=delivery;
  if(observation) w.agent.k=observe(w.agent.k,observation);
  const event:Event={step:w.agent.step,node:w0.agent.node,effect,choice,observation,hiddenEvents,before:w0.agent.k,after:w.agent.k,actualDebit:concreteDebit(w.exchange),possibleDebit:exposure(w.agent.k),status:w.agent.status,reason:w.agent.reason};
  return {world:w,event};
}
export function deliver(m:Mandate,exchange0:ExchangeState,effect:Effect,choice:Choice) {
  const exchange=structuredClone(exchange0);let observation:Observation|null=null;const hiddenEvents:Order[]=[];
  if(effect.kind==='submit') {
    if(!('fill' in choice)) throw Error('Invalid submit choice');
    let quantity=choice.fill==='full'?effect.quantity:choice.fill==='half'?F((D(effect.quantity)/2n/D(m.filters.step))*D(m.filters.step)):'0';
    let accepted=choice.fill!=='absent';
    if(D(cost(m,quantity).debit)+D(concreteDebit(exchange))>D(m.initialQuote)) {quantity='0';accepted=false;}
    const c=cost(m,quantity);
    const order:Order={id:effect.id,quantity,...c,accepted,status:!accepted?'ABSENT':quantity===effect.quantity?'FILLED':'EXPIRED'};
    exchange.orders.push(order);hiddenEvents.push(order);
    observation=choice.reply==='lost'?{kind:'timeout',id:effect.id}:orderObservation(order);
  } else if(effect.kind==='query') {
    if(!('read' in choice)) throw Error('Invalid read choice');
    const o=exchange.orders.find(x=>x.id===effect.id);
    if(!o)return {exchange,observation:{kind:'notFound',id:effect.id,definitive:true,seq:2,account:m.account,symbol:m.symbol,environment:m.environment} as Observation,hiddenEvents};
    if(choice.read==='fresh') observation=orderObservation(o);
    else if(choice.read==='partial'&&D(o.debit)>0n) observation={kind:'order',id:o.id,debit:F(D(o.debit)/2n),net:F(D(o.net)/2n),terminal:false,seq:0,status:'PARTIALLY_FILLED'};
    else observation=choice.read==='notFound'?{kind:'notFound',id:o.id,definitive:false}:{kind:'order',id:o.id,debit:'0',net:'0',terminal:false,seq:-1,status:'NEW'};
  } else if(effect.kind==='balance') observation={kind:'balance',snapshot:'synthetic-initial-v1'}; // Deliberately stale initial account snapshot, no order evidence.
  if(observation)observation={...observation,account:m.account,symbol:m.symbol,environment:m.environment};
  return {exchange,observation,hiddenEvents};
}
function orderObservation(o:Order):Observation {return o.accepted?{kind:'order',id:o.id,debit:o.debit,net:o.net,terminal:true,seq:2,status:o.status}:{kind:'notFound',id:o.id,definitive:true,seq:2};}
export function replay(m:Mandate,p:Plan,mode:'baseline'|'guarded',scenario:Choice[]) {
  let world=start(p);const events:Event[]=[];
  for(const choice of scenario) {if(world.agent.status!=='RUNNING') throw Error('Trailing replay events');const t=step(m,p,world,mode,choice);world=t.world;events.push(t.event);if(!sound(world)) throw Error('MODEL_DEFECT: knowledge excludes reality');}
  return {world,events};
}
export const stateKey=(w:World)=>hash(w);
