import { type Mandate,type Plan,D,validate,transition,hash,VERSION,capabilities } from './core.js';
import { start,step,choices,sound,concreteDebit,stateKey,MODEL,type Event,type World,type Choice } from './simulator.js';
export type Bounds={maxStates:number;timeoutMs:number};
export const DEFAULT_BOUNDS:Bounds={maxStates:30000,timeoutMs:10000};
export type Result={status:'COUNTEREXAMPLE_FOUND'|'NO_VIOLATION_WITHIN_BOUND'|'INCONCLUSIVE'|'UNSUPPORTED';reason:string;states:number;transitions:number;durationMs:number;bounds:Bounds;inputHash:string;complete:boolean;outcomes:Record<string,number>;counterexample:Event[];scenario:Choice[];maxDepth:number};
export const binding=(m:Mandate,p:Plan)=>hash({m,p,version:VERSION,model:MODEL,capabilities});
export function check(m:Mandate,p:Plan,mode:'baseline'|'guarded'='guarded',bounds=DEFAULT_BOUNDS):Result {
  const begin=performance.now();const r:Result={status:'NO_VIOLATION_WITHIN_BOUND',reason:'Exhaustive finite discrete IOC model only',states:0,transitions:0,durationMs:0,bounds,inputHash:binding(m,p),complete:false,outcomes:{},counterexample:[],scenario:[],maxDepth:0};
  const finish=()=>{r.durationMs=Math.round((performance.now()-begin)*100)/100;return r;};
  try{validate(m,p);}catch(e){r.status='UNSUPPORTED';r.reason=e instanceof Error?e.message:'Invalid schema';return finish();}
  if(!Number.isInteger(bounds.maxStates)||bounds.maxStates<1||bounds.maxStates>100000||bounds.timeoutMs<1||bounds.timeoutMs>60000) {r.status='UNSUPPORTED';r.reason='Invalid checker bounds';return finish();}
  type Entry={world:World;parent:number;event:Event|null};
  const queue:Entry[]=[{world:start(p),parent:-1,event:null}];const visited=new Set([stateKey(queue[0].world)]);let cursor=0;let violation=-1;let incomplete=false;
  while(cursor<queue.length) {
    if(queue.length>bounds.maxStates||performance.now()-begin>bounds.timeoutMs) {incomplete=true;r.reason='State or wall-time limit reached';break;}
    const idx=cursor++;const {world}=queue[idx];r.states++;r.maxDepth=Math.max(r.maxDepth,world.agent.step);
    if(!sound(world)) {r.status='INCONCLUSIVE';r.reason='MODEL_DEFECT: hidden state excluded from knowledge';return finish();}
    if(D(concreteDebit(world.exchange))>D(m.budget)||D(concreteDebit(world.exchange))+D(m.reserve)>D(m.initialQuote)) {violation=idx;break;}
    if(world.agent.status!=='RUNNING') {r.outcomes[world.agent.status]=(r.outcomes[world.agent.status]??0)+1;if(world.agent.status==='HORIZON') incomplete=true;continue;}
    const effect=transition(m,p,world.agent,mode).effect;
    for(const choice of choices(effect)) {
      const t=step(m,p,world,mode,choice);r.transitions++;
      const key=stateKey(t.world);if(visited.has(key)) continue;visited.add(key);queue.push({world:t.world,parent:idx,event:t.event});
    }
  }
  if(violation>=0) {
    r.status='COUNTEREXAMPLE_FOUND';r.reason=`Cumulative quote-equivalent debit exceeds mandate or reserve floor`;
    for(let i=violation;queue[i].parent>=0;i=queue[i].parent) r.counterexample.unshift(queue[i].event!);
    r.scenario=r.counterexample.map(e=>e.choice);
  } else if(incomplete) {r.status='INCONCLUSIVE';if(cursor===queue.length) r.reason='A reachable path exhausted the step horizon';}
  else r.complete=true;
  return finish();
}
export function runScenario(m:Mandate,p:Plan,mode:'baseline'|'guarded',first:Choice,read: 'fresh'|'stale'|'notFound'|'partial'='fresh') {
  validate(m,p);let world=start(p);const events:Event[]=[];let sends=0;
  for(let i=0;i<=p.maxSteps && world.agent.status==='RUNNING';i++) {
    const effect=transition(m,p,world.agent,mode).effect;
    const choice:Choice=effect.kind==='submit'?(sends++===0?first:{fill:'full',reply:'delivered'}):effect.kind==='query'?{read}:{tick:true};
    const t=step(m,p,world,mode,choice);world=t.world;events.push(t.event);
    if(!sound(world)) throw Error('MODEL_DEFECT');
  }
  return {world,events};
}
