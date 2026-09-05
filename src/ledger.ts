import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { type Mandate,type Plan,type Effect,type State,D,F,hash,exposure,transition,validate } from './core.js';
import { binding } from './checker.js';
import {z} from 'zod';

export type Approval={binding:string;account:string;expiresAt:string;actionHash:string};
const ApprovalSchema=z.strictObject({binding:z.string().regex(/^[a-f0-9]{64}$/),account:z.string().min(1).max(64),expiresAt:z.string().datetime(),actionHash:z.string().regex(/^[a-f0-9]{64}$/)});
export function approveAction(m:Mandate,p:Plan,effect:Effect,expiresAt=m.expiresAt):Approval {return {binding:binding(m,p),account:m.account,expiresAt,actionHash:hash(effect)};}
export class Ledger {
  db:DatabaseSync;
  constructor(path:string) {
    this.db=new DatabaseSync(path);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS leases(scope TEXT PRIMARY KEY,owner TEXT NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS attempts(scope TEXT NOT NULL,id TEXT NOT NULL,binding TEXT NOT NULL,maximum TEXT NOT NULL,debit TEXT NOT NULL,terminal INTEGER NOT NULL,phase TEXT NOT NULL,action TEXT NOT NULL,PRIMARY KEY(scope,id));
      CREATE TABLE IF NOT EXISTS approvals(scope TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(scope,id));
      CREATE TABLE IF NOT EXISTS requests(key TEXT PRIMARY KEY,input TEXT NOT NULL,run TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS events(run TEXT NOT NULL,seq INTEGER NOT NULL,body TEXT NOT NULL,PRIMARY KEY(run,seq));
      CREATE TABLE IF NOT EXISTS execution(id TEXT PRIMARY KEY,body TEXT NOT NULL);
    `);
  }
  transaction<T>(fn:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try{const value=fn();this.db.exec('COMMIT');return value;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  lease(scope:string,owner:string,now=Date.now()) {
    return this.transaction(()=>{const row=this.db.prepare('SELECT owner,expires FROM leases WHERE scope=?').get(scope) as {owner:string;expires:number}|undefined;
      if(row&&row.owner!==owner&&row.expires>now) throw Error('Account executor already active');
      this.db.prepare('INSERT INTO leases VALUES(?,?,?) ON CONFLICT(scope) DO UPDATE SET owner=excluded.owner,expires=excluded.expires').run(scope,owner,now+30000);
    });
  }
  release(scope:string,owner:string) {this.db.prepare('DELETE FROM leases WHERE scope=? AND owner=?').run(scope,owner);}
  request(key:string,input:unknown) {return this.transaction(()=>{
    const digest=hash(input);const old=this.db.prepare('SELECT input,run FROM requests WHERE key=?').get(key) as {input:string;run:string}|undefined;
    if(old) {if(old.input!==digest) throw Error('Idempotency key reused for different input');return {id:old.run,existing:true};}
    const id=randomUUID();this.db.prepare('INSERT INTO requests VALUES(?,?,?)').run(key,digest,id);return {id,existing:false};
  });}
  save(id:string,value:unknown) {this.db.prepare('INSERT INTO runs VALUES(?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(id,JSON.stringify(value));}
  get(id:string):unknown {const row=this.db.prepare('SELECT body FROM runs WHERE id=?').get(id) as {body:string}|undefined;return row?JSON.parse(row.body):undefined;}
  event(id:string,value:unknown) {this.db.prepare('INSERT INTO events SELECT ?,COALESCE(MAX(seq),0)+1,? FROM events WHERE run=?').run(id,JSON.stringify(value),id);}
  events(id:string):unknown[] {return this.db.prepare('SELECT seq,body FROM events WHERE run=? ORDER BY seq').all(id).map(r=>({seq:r.seq,event:JSON.parse(r.body as string)}));}
  checkpoint(id:string,state:unknown) {this.db.prepare('INSERT INTO execution VALUES(?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(id,JSON.stringify(state));}
  loadExecution(id:string):unknown {const row=this.db.prepare('SELECT body FROM execution WHERE id=?').get(id) as {body:string}|undefined;return row?JSON.parse(row.body):undefined;}
  prepare(m:Mandate,p:Plan,owner:string,effect:Extract<Effect,{kind:'submit'}>,approval:Approval,state:State,now=Date.now(),deadline=now+p.maxDurationMs) {
    validate(m,p);
    ApprovalSchema.parse(approval);
    if(approval.binding!==binding(m,p)||approval.account!==m.account||approval.actionHash!==hash(effect)||Date.parse(approval.expiresAt)<=now||Date.parse(m.expiresAt)<=now) throw Error('Approval invalid, changed or expired');
    const planned=transition(m,p,state,'guarded');if(hash(planned.effect)!==hash(effect)) throw Error('Action does not match interpreter');
    return this.transaction(()=>{
      const lease=this.db.prepare('SELECT owner,expires FROM leases WHERE scope=?').get(m.account) as {owner:string;expires:number}|undefined;
      if(!lease||lease.owner!==owner||lease.expires<=now) throw Error('No active executor lease');
      const existing=this.db.prepare('SELECT id FROM attempts WHERE scope=? AND id=?').get(m.account,effect.id);
      if(existing) return false; // Tombstone or ambiguous send. Never redispatch.
      const all=this.db.prepare('SELECT maximum,debit,terminal FROM attempts WHERE scope=?').all(m.account) as {maximum:string;debit:string;terminal:number}[];
      const pending=all.reduce((n,a)=>n+D(a.terminal?a.debit:a.maximum),0n);
      if(all.length>=m.maxOrders||pending+D(effect.max)>D(m.budget)||pending+D(effect.max)>D(m.initialQuote)-D(m.reserve)) throw Error('Durable aggregate reservation refuses write');
      if(D(exposure(planned.state.k))>D(m.budget)) throw Error('Kernel exposure exceeded');
      this.db.prepare('INSERT INTO attempts VALUES(?,?,?,?,?,?,?,?)').run(m.account,effect.id,binding(m,p),effect.max,'0',0,'prepared',JSON.stringify(effect));
      this.db.prepare('INSERT INTO approvals VALUES(?,?,?)').run(m.account,effect.id,JSON.stringify(approval));
      // Crash before or after adapter dispatch resumes this state by querying, never resending.
      this.checkpoint(owner,{binding:binding(m,p),state:planned.state,pending:effect.id,stopped:false,deadline});
      return true;
    });
  }
  reconcile(scope:string,state:State) {this.transaction(()=>{
    for(const b of state.k.orders) {
      const row=this.db.prepare('SELECT debit,maximum,terminal FROM attempts WHERE scope=? AND id=?').get(scope,b.id) as {debit:string;maximum:string;terminal:number}|undefined;
      if(!row) continue;
      if(D(b.debit)<D(row.debit)||D(b.debit)>D(row.maximum)||(row.terminal&&!b.terminal)) throw Error('Ledger evidence regression');
      this.db.prepare('UPDATE attempts SET debit=?,terminal=?,phase=? WHERE scope=? AND id=?').run(b.debit,b.terminal?1:0,b.terminal?'terminal':'ambiguous',scope,b.id);
    }
  });}
  reserved(scope:string) {const rows=this.db.prepare('SELECT maximum,debit,terminal FROM attempts WHERE scope=?').all(scope) as {maximum:string;debit:string;terminal:number}[];return F(rows.reduce((n,r)=>n+D(r.terminal?r.debit:r.maximum),0n));}
  approvals(scope:string):Approval[] {return this.db.prepare('SELECT body FROM approvals WHERE scope=? ORDER BY id').all(scope).map(r=>JSON.parse(r.body as string) as Approval);}
  close(){this.db.close();}
}
