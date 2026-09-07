import express from 'express';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const app=express();app.disable('x-powered-by');
const port=Number(process.env.PORT??4382);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const allowed=new Set([`127.0.0.1:${port}`,`localhost:${port}`,'statebound.tangvu.dev']);
app.use((req,res,next)=>{
  if(!allowed.has(req.headers.host))return void res.sendStatus(403);
  // Preserve the reviewed artifacts; also prevents automatic edge analytics injection.
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate, no-transform');
  res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});
  if(req.method!=='GET'&&req.method!=='HEAD')return void res.status(405).set('Allow','GET, HEAD').end();
  next();
});
// Explicit allowlist: never mount the repository, runtime directory, or operator API.
const files={
  '/':'preview/index.html','/style.css':'preview/style.css','/demo.js':'preview/demo.js','/chapters.json':'preview/chapters.json',
  '/lab.js':'preview/lab.js','/replay-gallery.json':'preview/replay-gallery.json',
  '/demo.mp4':'submission/demo.mp4','/counterexample.png':'submission/counterexample.png',
  '/repaired.png':'submission/repaired.png','/ambiguity.png':'submission/ambiguity.png','/evidence.json':'submission/demo-evidence.json',
  '/counterexample.json':'examples/counterexample.json','/evaluation.json':'examples/evaluation.json',
  '/verifier.json':'submission/verifier-output.json'
};
app.get('/healthz',(_req,res)=>res.json({status:'ok',mode:'recorded-simulator-preview',writes:false}));
// Version all public assets together so a reload cannot reuse an earlier design.
// Recompute at service startup; restart the preview after updating its assets.
const absolute=file=>fileURLToPath(new URL(`../${file}`,import.meta.url));
const digest=createHash('sha256');
for(const file of Object.values(files))digest.update(file).update(readFileSync(absolute(file)));
const lab=readFileSync(absolute('preview/lab.html'),'utf8');digest.update(lab);
const revision=digest.digest('hex').slice(0,16);
const html=readFileSync(absolute(files['/']),'utf8')
  .replace('<!-- EVIDENCE_LAB -->',lab)
  .replace('<html ',`<html data-asset-version="${revision}" `)
  .replace(/(href|src|poster)="(\/[^"?#]+)"/g,(match,attribute,path)=>files[path]?`${attribute}="${path}?v=${revision}"`:match);
app.get('/',(_req,res)=>res.set('Cache-Control','no-store, no-transform').type('html').send(html));
for(const [route,file] of Object.entries(files))if(route!=='/')app.get(route,(_req,res)=>res.sendFile(absolute(file)));
app.use((_req,res)=>res.sendStatus(404));
const server=app.listen(port,'127.0.0.1',()=>{console.log(`Statebound recorded preview: http://127.0.0.1:${port}`);process.send?.('ready');});
server.requestTimeout=15000;server.headersTimeout=10000;
const stop=()=>{server.close(()=>process.exit(0));server.closeIdleConnections();setTimeout(()=>process.exit(0),3500).unref();};
process.on('SIGINT',stop);process.on('SIGTERM',stop);process.on('message',message=>{if(message==='shutdown')stop();});
