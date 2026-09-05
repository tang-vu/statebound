import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { D,F,fixture,templateRepair,observe,hash,cost,validate,transition,initial,exposure,remaining } from '../src/core.js';
import { check,runScenario } from '../src/checker.js';
import { bundle,verify,acceptRepair } from '../src/evidence.js';
import { replay,sound,deliver } from '../src/simulator.js';
import {compileRequest} from '../src/mandate-compiler.js';
test('narrow natural request derives a reviewable goal and never widens infeasible budget',()=>{
  const r=compileRequest('buy around 15 USDT of BNB, maximum total debit 20 USDT');assert.equal(r.mandate.goal,'0.025');assert.equal(r.mandate.budget,'20');assert.equal(r.review.maximumOrderDebit,'15');assert.equal(r.review.requiresUserConfirmation,true);
  assert.throws(()=>compileRequest('buy around 15 USDT of BNB, maximum total debit 10 USDT'));
  assert.throws(()=>compileRequest('buy around 0.1 USDT of BNB, maximum total debit 20 USDT'));
});
test('parameterized baseline violates independent concrete fill sum; guards refuse retry',()=>{
  for(const goal of ['0.02','0.025','0.03']) {
    const {mandate:m,plan:p}=fixture('20',goal);const r=check(m,p,'baseline');assert.equal(r.status,'COUNTEREXAMPLE_FOUND');
    const replayed=replay(m,p,'baseline',r.scenario);
    const independent=replayed.world.exchange.orders.reduce((n,o)=>n+D(o.quantity)*600n,0n);
    assert.ok(independent>D(m.budget));assert.equal(F(independent),r.counterexample.at(-1)?.actualDebit);
    const guarded=runScenario(m,p,'guarded',{fill:'full',reply:'lost'});assert.equal(guarded.world.agent.status,'REFUSED');assert.equal(exposure(guarded.world.agent.k),F(D(goal)*600n));
  }
});
test('repair progresses after accepted and unaccepted lost sends; permanent ambiguity remains reserved',()=>{
  const {mandate:m,plan:p}=fixture();const fixed=templateRepair(p);const r=acceptRepair(m,p,fixed);assert.equal(r.complete,true);
  for(const fill of ['full','half','absent'] as const) {
    const x=runScenario(m,fixed,'guarded',{fill,reply:'lost'});assert.equal(x.world.agent.status,'COMPLETE');assert.ok(sound(x.world));
  }
  const x=runScenario(m,fixed,'guarded',{fill:'full',reply:'lost'},'notFound');assert.equal(x.world.agent.status,'UNRESOLVED');assert.equal(exposure(x.world.agent.k),'15');
});
test('duplicate, stale balance, out-of-order and partial observations preserve monotonic accounting',()=>{
  const k={invalid:false,orders:[{id:'a',max:'15',debit:'0',net:'0',terminal:false,seq:-1,states:['NEW']}]};
  const partial=observe(k,{kind:'order',id:'a',debit:'7.5',net:'0.0125',terminal:false,seq:1});assert.equal(exposure(partial),'15');
  const full={kind:'order' as const,id:'a',debit:'15',net:'0.025',terminal:true,seq:2};const final=observe(partial,full);
  assert.deepEqual(observe(final,full),final);assert.deepEqual(observe(final,{kind:'balance'}),final);
  assert.deepEqual(observe(final,{kind:'order',id:'a',debit:'0',net:'0',terminal:false,seq:0}),final);
  assert.equal(observe(final,{...full,debit:'0',seq:3}).invalid,true);
});
test('fixed point and rounded fees property corpus',()=>{
  fc.assert(fc.property(fc.bigInt({min:0n,max:100000000000000n}),x=>assert.equal(D(F(x)),x)),{seed:719,numRuns:500});
  fc.assert(fc.property(fc.integer({min:1,max:10000}),fc.integer({min:0,max:100}),(lots,bps)=>{
    const {mandate:m}=fixture();m.feeBps=bps;const q=F(BigInt(lots)*10000n);const c=cost(m,q);
    const independentPrincipal=BigInt(lots)*6000000n;
    assert.equal(D(c.principal),independentPrincipal);assert.equal(D(c.fee),(independentPrincipal*BigInt(bps)+9999n)/10000n);
    m.feeAsset='base';assert.ok(D(cost(m,remaining(m,'0')).net)>=D(m.goal));
  }),{seed:223,numRuns:200});
  assert.throws(()=>D('1e3'));assert.throws(()=>D('-1'));assert.throws(()=>D('0.123456789'));
});
test('historical partial observations respect lot steps and independently computed prefix fees',()=>{
  const {mandate:m}=fixture('20','0.025',10);
  const sent=deliver(m,{orders:[]},{kind:'submit',id:'a',quantity:'0.025',max:'15.015'},{fill:'full',reply:'lost'});
  const prefix=deliver(m,sent.exchange,{kind:'query',id:'a'},{read:'partial'}).observation!;
  assert.equal(prefix.net,'0.0125');assert.equal(prefix.debit,'7.5075');assert.equal(D(prefix.net!)%D(m.filters.step),0n);
  const odd=deliver(m,{orders:[]},{kind:'submit',id:'b',quantity:'0.0125',max:'7.5075'},{fill:'full',reply:'lost'});
  const rounded=deliver(m,odd.exchange,{kind:'query',id:'b'},{read:'partial'}).observation!;assert.equal(rounded.net,'0.0062');assert.equal(rounded.debit,'3.72372');
});
test('knowledge overapproximates generated observations, executor inputs have no hidden state',()=>{
  fc.assert(fc.property(fc.constantFrom('full','half','none','absent'),fc.constantFrom('delivered','lost'),fc.constantFrom('fresh','stale','notFound','partial'),(fill,reply,read)=>{
    const {mandate:m,plan:p}=fixture();const x=runScenario(m,templateRepair(p),'guarded',{fill,reply},read);assert.ok(sound(x.world));
    for(const e of x.events) assert.ok(D(e.possibleDebit)>=D(e.actualDebit));
  }),{seed:551,numRuns:100});
  const {mandate:m,plan:p}=fixture();const t=transition(m,p,initial(p),'guarded');assert.ok(!JSON.stringify(t.state).includes('exchange'));assert.ok(!JSON.stringify(t.state).includes('fill'));
});
test('limits, tampering, malicious plan and defective guard never pass',()=>{
  const {mandate:m,plan:p}=fixture();assert.equal(check(m,p,'guarded',{maxStates:1,timeoutMs:1000}).status,'INCONCLUSIVE');
  assert.equal(check(m,{...p,maxSteps:1}).status,'INCONCLUSIVE');
  assert.throws(()=>validate({...m,budget:'30'},p));assert.throws(()=>validate(m,{...p,evil:'fetch'}));
  assert.throws(()=>validate(m,{...p,nodes:[{id:'oops',op:'shell',next:'oops'}]}));
  assert.throws(()=>acceptRepair(m,p,{...templateRepair(p),maxSteps:48}));
  assert.throws(()=>acceptRepair(m,p,{...p,start:'stop',nodes:[{id:'stop',op:'pause'}]}));
  // Guard mutation: per-order-only admission is detected as a concrete financial defect.
  assert.equal(check(m,p,'baseline').status,'COUNTEREXAMPLE_FOUND');
});
test('evidence requires exact deterministic trace and recomputed search',()=>{
  const {mandate:m,plan:p}=fixture();const b=bundle(m,p,'baseline','fixture');assert.equal(verify(b).verified,true);
  const modified=structuredClone(b);modified.payload.result.counterexample.pop();assert.throws(()=>verify(modified));modified.manifest=hash(modified.payload);assert.throws(()=>verify(modified));
  const claimedLive={...b,payload:{...b.payload,dataSource:'live Binance'}};claimedLive.manifest=hash(claimedLive.payload);assert.throws(()=>verify(claimedLive));
  const missing=structuredClone(b);missing.payload.result.durationMs=-1;missing.manifest=hash(missing.payload);assert.throws(()=>verify(missing));
});
