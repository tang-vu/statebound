import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Worker } from 'node:worker_threads';
import { randomBytes } from 'node:crypto';
import { mkdirSync,existsSync,readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { fixture,MandateSchema,PlanSchema,validate } from './core.js';
import { Ledger } from './ledger.js';
import { verify } from './evidence.js';

const port=Number(process.env.PORT??4381);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
mkdirSync('.runtime',{recursive:true});const ledger=new Ledger('.runtime/statebound.db');
const app=express();const token=randomBytes(32).toString('hex');const origin=`http://127.0.0.1:${port}`;
const jobs=new Map<string,Worker>();
// A process restart cannot finish an in-flight worker. Preserve evidence and mark
// interrupted checks explicitly incomplete. Replays never resume an external send.
for(const row of ledger.db.prepare('SELECT id,body FROM runs').all()) {const run=JSON.parse(row.body as string);if(run.status==='RUNNING')ledger.save(row.id as string,{...run,status:'INTERRUPTED',kind:'error',message:'Server restarted during check; coverage incomplete. Start a fresh check.'});}
app.use((req,res,next)=>{
  if(req.headers.host!==`127.0.0.1:${port}`&&req.headers.host!==`localhost:${port}`)return void res.status(403).json({error:'Local host required'});
  const suppliedOrigin=req.headers.origin;
  if(suppliedOrigin&&suppliedOrigin!==origin&&suppliedOrigin!==`http://localhost:${port}`)return void res.status(403).json({error:'Origin rejected'});
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.path.startsWith('/api/')&&req.path!=='/api/session'&&!(req.headers.cookie??'').split(';').some(x=>x.trim()===`statebound=${token}`))return void res.status(401).json({error:'Local operator session required'});
  if(req.method==='POST'&&req.headers['x-statebound-action']!=='operator')return void res.status(403).json({error:'Operator action required'});
  next();
});
app.use(express.json({limit:'128kb'}));
app.get('/api/session',(_req,res)=>{res.cookie('statebound',token,{httpOnly:true,sameSite:'strict'});res.json({mode:'simulator',fixture:fixture(),integration:existsSync('examples/binance-read.json')?JSON.parse(readFileSync('examples/binance-read.json','utf8')):{status:'unavailable',reason:'Run npm run integration:inspect to discover the official CLI'},externalRepair:existsSync('examples/external-agent-run.json')?JSON.parse(readFileSync('examples/external-agent-run.json','utf8')):null});});
const RequestSchema=z.strictObject({mandate:MandateSchema,plan:PlanSchema,action:z.enum(['check','repair','replay']),mode:z.enum(['baseline','guarded']),candidate:PlanSchema.optional(),ambiguity:z.boolean().optional()});
app.post('/api/runs',(req,res)=>{
  try {
    const data=RequestSchema.parse(req.body);validate(data.mandate,data.plan);
    const key=z.string().uuid().parse(req.headers['idempotency-key']);
    if(jobs.size>=2)return void res.status(429).json({error:'Two checks already running. Wait or cancel a check.'});
    const request=ledger.request(key,data);
    if(request.existing)return void res.json({id:request.id});
    const id=request.id;ledger.save(id,{id,status:'RUNNING',input:data,startedAt:Date.now()});ledger.event(id,{kind:'started'});
    const worker=new Worker(new URL('./worker.mjs',import.meta.url),{workerData:{...data,id,provenance:data.plan.id==='vulnerable-fixture'?'fixture':'manual'}});
    jobs.set(id,worker);
    const finish=(message:unknown)=>{const old=ledger.get(id) as object;ledger.save(id,{...old,status:'FINISHED',...message as object});jobs.delete(id);};
    worker.on('message',(message:{kind:string})=>{ledger.event(id,message);if(message.kind==='complete'||message.kind==='error')finish(message);});
    worker.on('error',(error)=>{console.error('Checker worker:',error instanceof Error?error.message:'Unknown worker error');ledger.event(id,{kind:'error',message:'Checker worker failed; result is inconclusive'});finish({kind:'error',message:'Checker worker failed; result is inconclusive'});});
    worker.on('exit',code=>{if(jobs.has(id)){finish({kind:'error',message:`Checker stopped (${code}); result is inconclusive`});}});
    res.status(202).json({id});
  }catch(e){res.status(400).json({error:e instanceof z.ZodError?'Input does not match supported plan or mandate schema':e instanceof Error?e.message:'Invalid request'});}
});
const runId=z.string().uuid();
app.get('/api/runs/:id',(req,res)=>{const parsed=runId.safeParse(req.params.id);if(!parsed.success)return void res.sendStatus(404);const run=ledger.get(parsed.data);if(!run)return void res.sendStatus(404);res.json(run);});
app.get('/api/runs/:id/events',(req,res)=>{
  const id=runId.safeParse(req.params.id);if(!id.success||!ledger.get(id.data))return void res.sendStatus(404);
  res.setHeader('Content-Type','text/event-stream');res.setHeader('Cache-Control','no-cache');res.flushHeaders();let sent=0;
  const flush=()=>{const events=ledger.events(id.data);for(const event of events.slice(sent)){res.write(`data: ${JSON.stringify(event)}\n\n`);}sent=events.length;};
  flush();const timer=setInterval(flush,250);req.on('close',()=>clearInterval(timer));
});
app.post('/api/runs/:id/stop',async(req,res)=>{const id=runId.parse(req.params.id);await jobs.get(id)?.terminate();jobs.delete(id);const old=ledger.get(id);if(old)ledger.save(id,{...old as object,status:'CANCELLED',message:'Search cancelled; coverage incomplete'});ledger.event(id,{kind:'cancelled'});res.json({stopped:true});});
app.get('/api/runs/:id/export',(req,res)=>{
  const r=ledger.get(req.params.id) as {evidence?:unknown}|undefined;if(!r?.evidence)return void res.status(409).json({error:'Evidence incomplete'});
  try{verify(r.evidence,false);res.attachment(`statebound-${req.params.id}.json`).json(r.evidence);}catch{res.status(409).json({error:'Evidence integrity failed'});}
});
app.post('/api/runs/:id/verify',(req,res)=>{
  const id=runId.safeParse(req.params.id);if(!id.success)return void res.sendStatus(404);
  const run=ledger.get(id.data) as {evidence?:unknown}|undefined;if(!run?.evidence)return void res.status(409).json({error:'Evidence incomplete'});
  if(jobs.size>=2)return void res.status(429).json({error:'Wait for active checks to finish'});
  const worker=new Worker(new URL('./verify-worker.mjs',import.meta.url),{workerData:run.evidence});
  jobs.set(`verify-${id.data}`,worker);
  worker.once('message',message=>{jobs.delete(`verify-${id.data}`);res.json(message);});
  worker.once('error',()=>{jobs.delete(`verify-${id.data}`);res.status(409).json({error:'Independent recomputation failed'});});
});
if(existsSync('dist/index.html')) {app.use(express.static(resolve('dist')));app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/index.html')));}
else {const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{void err;void _next;res.status(400).json({error:'Request could not be processed'});});
app.listen(port,'127.0.0.1',()=>console.log(`Statebound: ${origin} | simulator only`));
