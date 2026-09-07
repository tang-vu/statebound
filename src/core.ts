import { createHash } from 'node:crypto';
import {VERSION,decimal,MandateSchema,PlanSchema,type Mandate,type Plan} from './schema.js';
export {VERSION,decimal,MandateSchema,NodeSchema,PlanSchema,type Mandate,type Plan} from './schema.js';

export const SCALE = 100000000n;
export const D = (s: string): bigint => { decimal.parse(s); const [a,b=''] = s.split('.'); return BigInt(a)*SCALE+BigInt(b.padEnd(8,'0')); };
export const F = (v: bigint): string => { if(v<0n) throw Error('Negative amount'); return `${v/SCALE}.${(v%SCALE).toString().padStart(8,'0')}`.replace(/\.?0+$/,'').replace(/^$/,'0'); };
export const ceilDiv = (a: bigint,b: bigint) => (a+b-1n)/b;
export const mul = (a: string,b: string) => F(ceilDiv(D(a)*D(b),SCALE));
export const sum = (xs: string[]) => F(xs.reduce((a,b)=>a+D(b),0n));
export function canonical(value: unknown): string {
  if(value===null || typeof value!=='object') return JSON.stringify(value);
  if(Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}
export const hash = (x: unknown) => createHash('sha256').update(canonical(x)).digest('hex');
export const capabilities = {id:'simulator-ioc-v1',version:VERSION,boundedPrice:true,lookup:true,completeAbsence:true,feeBound:true,retry:'none',environment:'simulator'} as const;
export function validate(m0:unknown,p0:unknown):{m:Mandate;p:Plan} {
  const m=MandateSchema.parse(m0),p=PlanSchema.parse(p0);
  if(p.mandateHash!==hash(m)) throw Error('Mandate binding mismatch');
  const ids=new Set(p.nodes.map(n=>n.id));
  if(ids.size!==p.nodes.length || !ids.has(p.start)) throw Error('Invalid graph identity');
  for(const n of p.nodes) for(const target of ('next' in n?[n.next]:'yes' in n?[n.yes,n.no]:[])) if(!ids.has(target)) throw Error('Dangling edge');
  if(D(m.filters.step)===0n||D(m.filters.tick)===0n||D(m.limitPrice)===0n||D(m.goal)===0n||D(m.tolerance)>=D(m.goal)) throw Error('Invalid financial bounds');
  if(D(m.limitPrice)%D(m.filters.tick)!==0n || D(m.limitPrice)>D(m.quote.price)) throw Error('Unsupported price rule: limit must not exceed reference');
  if(Date.parse(m.expiresAt)<=Date.parse(m.createdAt)) throw Error('Invalid expiry');
  if(Date.parse(m.createdAt)<Date.parse(m.quote.at)||Date.parse(m.createdAt)-Date.parse(m.quote.at)>m.quote.maxAgeMs) throw Error('Stale reference');
  if(D(m.initialQuote)<D(m.reserve)||D(m.filters.minQty)>D(m.filters.maxQty)) throw Error('Invalid account or filters');
  const qty=remaining(m,'0'); validateOrder(m,qty);
  if(D(cost(m,qty).debit)>D(m.budget)||D(cost(m,qty).debit)>D(m.initialQuote)-D(m.reserve)) throw Error('Infeasible mandate');
  for(const n of p.nodes) if(n.op==='submit'&&n.quantity!=='remaining') validateOrder(m,n.quantity);
  return {m,p};
}
export function cost(m:Mandate,qty:string) {
  const principal=mul(qty,m.limitPrice);
  const fee=F(ceilDiv(D(m.feeAsset==='quote'?principal:qty)*BigInt(m.feeBps),10000n));
  return {principal,fee,feeAsset:m.feeAsset==='quote'?'USDT':m.symbol.slice(0,-4),debit:sum([principal,m.feeAsset==='quote'?fee:mul(fee,m.limitPrice)]),net:F(D(qty)-(m.feeAsset==='base'?D(fee):0n))};
}
export function remaining(m:Mandate,confirmed:string) {
  const left=D(m.goal)>D(confirmed)?D(m.goal)-D(confirmed):0n;
  let raw=m.feeAsset==='base'?ceilDiv(left*10000n,10000n-BigInt(m.feeBps)):left;
  raw=ceilDiv(raw,D(m.filters.step))*D(m.filters.step);
  // Base fee rounding may require one additional lot.
  if(D(cost(m,F(raw)).net)<left) raw+=D(m.filters.step);
  return F(raw);
}
export function validateOrder(m:Mandate,q:string) {
  if(D(q)<D(m.filters.minQty)||D(q)>D(m.filters.maxQty)||D(q)%D(m.filters.step)!==0n||D(mul(q,m.limitPrice))<D(m.filters.minNotional)) throw Error('Order violates fixture filters');
}
export type Belief={id:string;max:string;debit:string;net:string;terminal:boolean;seq:number;states:string[]};
export type Observation={kind:'timeout'|'balance'|'notFound'|'order';id?:string;debit?:string;net?:string;terminal?:boolean;seq?:number;definitive?:boolean;status?:string;account?:string;symbol?:string;environment?:string;snapshot?:string};
export type Knowledge={orders:Belief[];invalid:boolean};
export function observe(k0:Knowledge,o:Observation):Knowledge {
  const k=structuredClone(k0);
  if(o.kind==='balance'||o.kind==='timeout'||(o.kind==='notFound'&&!o.definitive)) return k;
  const b=k.orders.find(x=>x.id===o.id);
  if(!b) {k.invalid=true;return k;}
  const seq=o.seq??0;
  if(seq<b.seq) return k;
  const debit=o.debit??'0',net=o.net??'0',terminal=o.kind==='notFound'?true:o.terminal??false;
  if(D(debit)<D(b.debit)||D(net)<D(b.net)||D(debit)>D(b.max)||(b.terminal&&(!terminal||D(debit)!==D(b.debit)||D(net)!==D(b.net)))) {k.invalid=true;return k;}
  b.debit=debit;b.net=net;b.terminal=terminal;b.seq=seq;b.states=terminal?[o.status??'ABSENT']:['PARTIALLY_FILLED','FILLED','EXPIRED'];
  return k;
}
export const confirmed=(k:Knowledge)=>sum(k.orders.map(b=>b.debit));
export const exposure=(k:Knowledge)=>sum(k.orders.map(b=>b.terminal?b.debit:b.max));
export const acquired=(k:Knowledge)=>sum(k.orders.map(b=>b.net));
export type State={node:string;step:number;reads:number;last:string|null;k:Knowledge;status:'RUNNING'|'COMPLETE'|'UNRESOLVED'|'REFUSED'|'HORIZON';reason:string};
export type Effect={kind:'submit';id:string;quantity:string;max:string}|{kind:'query';id:string}|{kind:'balance'}|{kind:'none'};
export const initial=(p:Plan):State=>({node:p.start,step:0,reads:0,last:null,k:{orders:[],invalid:false},status:'RUNNING',reason:''});
export function transition(m:Mandate,p:Plan,s0:State,mode:'baseline'|'guarded'):{state:State;effect:Effect} {
  const s=structuredClone(s0);let effect:Effect={kind:'none'};
  if(s.status!=='RUNNING') return {state:s,effect};
  if(s.step>=p.maxSteps) {s.status='HORIZON';return {state:s,effect};} s.step++;
  if(s.k.invalid) {s.status='UNRESOLVED';s.reason='Contradictory evidence';return {state:s,effect};}
  const n=p.nodes.find(n=>n.id===s.node)!;
  if(n.op==='branch') {
    const values={goalMet:D(acquired(s.k))+D(m.tolerance)>=D(m.goal),lastTerminal:s.k.orders.find(x=>x.id===s.last)?.terminal??false,hasUnknown:s.k.orders.some(x=>!x.terminal)};
    s.node=values[n.guard.field]===n.guard.equals?n.yes:n.no;
  } else if(n.op==='complete'||n.op==='pause') {
    s.status=n.op==='complete'&&D(acquired(s.k))+D(m.tolerance)>=D(m.goal)&&!s.k.orders.some(x=>!x.terminal)?'COMPLETE':'UNRESOLVED';
    s.reason=s.status==='COMPLETE'?'Acquisition goal confirmed':'Pending exposure or unmet acquisition goal';
  } else {
    if (!('next' in n)) throw Error('Unsupported node');
    s.node=n.next;
    if(n.op==='submit') {
      const q=n.quantity==='remaining'?remaining(m,acquired(s.k)):n.quantity;
      try {validateOrder(m,q);} catch {s.status='REFUSED';s.reason='Order violates filters';return {state:s,effect};}
      const max=cost(m,q).debit;
      if(s.k.orders.length>=m.maxOrders||D(max)>D(m.budget)||(mode==='guarded'&&(D(exposure(s.k))+D(max)>D(m.budget)||D(exposure(s.k))+D(max)>D(m.initialQuote)-D(m.reserve)))) {
        s.status='REFUSED';s.reason='Aggregate possible debit, reserve floor or order bound blocks this write';return {state:s,effect};
      }
      const id=`${n.operation}-${s.k.orders.length+1}`;s.last=id;
      s.k.orders.push({id,max,debit:'0',net:'0',terminal:false,seq:-1,states:['NOT_ACCEPTED','NEW','PARTIALLY_FILLED','FILLED','EXPIRED']});
      effect={kind:'submit',id,quantity:q,max};
    } else if(n.op==='query') {
      if(!s.last||s.reads>=m.maxReads) {s.status='UNRESOLVED';s.reason='Reconciliation bound reached';} else {s.reads++;effect={kind:'query',id:s.last};}
    } else if(n.op==='balance') effect={kind:'balance'};
  }
  return {state:s,effect};
}
export function fixture(budget='20',goal='0.025',feeBps=0):{mandate:Mandate;plan:Plan} {
  const mandate:Mandate={version:VERSION,id:'demo-mandate',createdAt:'2026-09-05T00:00:00.000Z',expiresAt:'2099-01-01T00:00:00.000Z',account:'synthetic-account',environment:'simulator',symbol:'BNBUSDT',quoteAsset:'USDT',side:'BUY',orderType:'LIMIT_IOC',budget,reserve:'0',initialQuote:'100',goal,tolerance:'0',maxOrders:3,maxReads:3,quote:{price:'600',at:'2026-09-05T00:00:00.000Z',maxAgeMs:60000,source:'synthetic fixture'},limitPrice:'600',feeAsset:'quote',feeBps,filters:{step:'0.0001',tick:'0.01',minQty:'0.0001',maxQty:'10',minNotional:'1'}};
  const plan:Plan={version:VERSION,id:'vulnerable-fixture',mandateHash:hash(mandate),snapshot:'synthetic-initial-v1',adapter:'simulator-ioc-v1',maxSteps:32,maxDurationMs:30000,start:'buy',nodes:[{id:'buy',op:'submit',operation:'acquire',quantity:goal,next:'goal'},{id:'goal',op:'branch',guard:{field:'goalMet',equals:true},yes:'done',no:'balance'},{id:'balance',op:'balance',next:'retry'},{id:'retry',op:'submit',operation:'retry',quantity:goal,next:'done'},{id:'done',op:'complete'}]};
  return {mandate,plan};
}
export function templateRepair(p:Plan):Plan {return {...p,id:'template-repair',start:'buy',nodes:[{id:'buy',op:'submit',operation:'acquire',quantity:'remaining',next:'goal'},{id:'goal',op:'branch',guard:{field:'goalMet',equals:true},yes:'settled',no:'settled'},{id:'settled',op:'branch',guard:{field:'lastTerminal',equals:true},yes:'progress',no:'query'},{id:'query',op:'query',next:'settled'},{id:'progress',op:'branch',guard:{field:'goalMet',equals:true},yes:'done',no:'buy'},{id:'done',op:'complete'}]};}
