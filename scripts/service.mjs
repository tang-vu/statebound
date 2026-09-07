// PM2 supervises this launcher; only a small environment reaches the application.
import { spawn } from 'node:child_process';
const mode=process.argv[2];
if(!['workbench','preview'].includes(mode))throw Error('Expected workbench or preview');
const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','Path'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
env.NODE_ENV='production';
env.PORT=mode==='workbench'?'4381':'4382';
const child=spawn(process.execPath,mode==='workbench'?['--import','tsx','src/server.ts']:['scripts/preview.mjs'],{cwd:new URL('..',import.meta.url),env,stdio:['ignore','inherit','inherit','ipc'],windowsHide:true});
child.on('message',message=>{if(message==='ready')process.send?.('ready');});
child.on('error',()=>process.exit(1));
child.on('exit',code=>process.exit(code??1));
const stop=()=>{if(child.connected)child.send('shutdown');setTimeout(()=>child.kill(),4000).unref();};
process.on('SIGINT',stop);process.on('SIGTERM',stop);process.on('message',message=>{if(message==='shutdown')stop();});
