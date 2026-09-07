import express from 'express';
import { fileURLToPath } from 'node:url';
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
  '/':'preview/index.html','/style.css':'preview/style.css','/demo.js':'preview/demo.js',
  '/demo.mp4':'submission/demo.mp4','/counterexample.png':'submission/counterexample.png',
  '/repaired.png':'submission/repaired.png','/evidence.json':'submission/demo-evidence.json',
  '/counterexample.json':'examples/counterexample.json','/evaluation.json':'examples/evaluation.json',
  '/verifier.json':'submission/verifier-output.json'
};
app.get('/healthz',(_req,res)=>res.json({status:'ok',mode:'recorded-simulator-preview',writes:false}));
for(const [route,file] of Object.entries(files))app.get(route,(_req,res)=>res.sendFile(fileURLToPath(new URL(`../${file}`,import.meta.url))));
app.use((_req,res)=>res.sendStatus(404));
const server=app.listen(port,'127.0.0.1',()=>{console.log(`Statebound recorded preview: http://127.0.0.1:${port}`);process.send?.('ready');});
server.requestTimeout=15000;server.headersTimeout=10000;
const stop=()=>{server.close(()=>process.exit(0));server.closeIdleConnections();setTimeout(()=>process.exit(0),3500).unref();};
process.on('SIGINT',stop);process.on('SIGTERM',stop);process.on('message',message=>{if(message==='shutdown')stop();});
