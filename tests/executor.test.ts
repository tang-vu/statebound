import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Ledger,approveAction } from '../src/ledger.js';
import { fixture,templateRepair,transition,initial,observe,type Effect } from '../src/core.js';
import { execute } from '../src/executor.js';
test('SQLite reservations survive reconnect; concurrent lease, duplicate keys and client tombstones',()=>{
  const dir=mkdtempSync(join(tmpdir(),'statebound-ledger-'));const path=join(dir,'test.db');let db=new Ledger(path);const other=new Ledger(path);
  try {
    const {mandate:m,plan:original}=fixture();const p=templateRepair(original);const state=initial(p);const t=transition(m,p,state,'guarded');assert.equal(t.effect.kind,'submit');if(t.effect.kind!=='submit') throw Error('fixture');
    db.lease(m.account,'run');assert.throws(()=>other.lease(m.account,'other'));
    const approval=approveAction(m,p,t.effect);assert.equal(db.prepare(m,p,'run',t.effect,approval,state),true);assert.equal(db.prepare(m,p,'run',t.effect,approval,state),false);
    assert.equal(db.reserved(m.account),'15');db.close();db=new Ledger(path);assert.equal(db.reserved(m.account),'15');
    assert.equal(db.prepare(m,p,'run',t.effect,approval,state),false);
    const key=db.request('key',{x:1});assert.equal(other.request('key',{x:1}).id,key.id);assert.throws(()=>db.request('key',{x:2}));
    t.state.k=observe(t.state.k,{kind:'order',id:t.effect.id,debit:'15',net:'0.025',terminal:true,seq:2});db.reconcile(m.account,t.state);assert.equal(db.prepare(m,p,'run',t.effect,approval,state),false);
  } finally {db.close();other.close();rmSync(dir,{recursive:true});}
});
test('approval binds exact action, account, plan and expiry',()=>{
  const db=new Ledger(':memory:');try {
    const {mandate:m,plan:p}=fixture();const s=initial(p);const e=transition(m,p,s,'guarded').effect;if(e.kind!=='submit') throw Error('fixture');db.lease(m.account,'r');const a=approveAction(m,p,e);
    for(const bad of [{...a,account:'other'},{...a,binding:'bad'},{...a,expiresAt:'2000-01-01T00:00:00Z'},{...a,actionHash:'bad'}]) assert.throws(()=>db.prepare(m,p,'r',e,bad,s));
    assert.throws(()=>db.prepare(m,{...p,id:'changed'},'r',e,a,s));assert.throws(()=>db.prepare(m,p,'r',{...e,quantity:'0.02'},a,s));
  } finally {db.close();}
});
test('runtime uses shared interpreter and recovers prepared send by lookup only',async()=>{
  for(const accepted of [true,false]) {
    const db=new Ledger(':memory:');try {
      const {mandate:m,plan:original}=fixture();const p=templateRepair(original);const state=initial(p);const e=transition(m,p,state,'guarded').effect;if(e.kind!=='submit') throw Error('fixture');
      db.lease(m.account,'crashed');db.prepare(m,p,'crashed',e,approveAction(m,p,e),state);
      const effects:Effect[]=[];
      const scope={account:m.account,symbol:m.symbol,environment:m.environment};
      const result=await execute(m,p,db,'crashed',{id:'simulator-ioc-v1',async effect(x){effects.push(x);if(x.kind==='query')return accepted?{...scope,kind:'order',id:x.id,debit:'15',net:'0.025',terminal:true,seq:2}:{...scope,kind:'notFound',id:x.id,definitive:true,seq:2};if(x.kind==='submit')return {...scope,kind:'order',id:x.id,debit:'15',net:'0.025',terminal:true,seq:2};return null;}},async x=>approveAction(m,p,x));
      assert.equal(effects[0].kind,'query');assert.equal(effects.filter(x=>x.kind==='submit').length,accepted?0:1);assert.equal(result.status,'COMPLETE');
    }finally{db.close();}
  }
});
test('stop before dispatch makes no writes and unresolved crash does not replay send',async()=>{
  const db=new Ledger(':memory:');try {
    const {mandate:m,plan:original}=fixture();const p=templateRepair(original);let writes=0;
    const state=await execute(m,p,db,'stopped',{id:'simulator-ioc-v1',async effect(e){if(e.kind==='submit')writes++;return null;}},async e=>approveAction(m,p,e),()=>true);
    assert.equal(state.status,'UNRESOLVED');assert.equal(writes,0);
  }finally{db.close();}
});
