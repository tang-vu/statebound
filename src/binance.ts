import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { decimal } from './core.js';
const exec=(executable:string,args:string[],options:Parameters<typeof execFile>[2])=>new Promise<{stdout:string;stderr:string}>((resolve,reject)=>{
  const child=execFile(executable,args,options as import('node:child_process').ExecFileOptionsWithStringEncoding,(error,stdout,stderr)=>error?reject(Error('Official CLI failed or timed out')):resolve({stdout:String(stdout),stderr:String(stderr)}));
  child.stdin?.end();
});
export const binanceCapabilities={id:'official-binance-cli-2.1.1-read',publicQuotes:true,symbolFilters:true,accountFreshness:false,boundedWrite:false,stableLookup:false,feeBound:false,hostConfirmation:'not connected',writeRetries:'unverified',environment:'testnet-public-read',execution:'UNSUPPORTED'};
export function testnetHost(value:unknown) {if(value!=='https://testnet.binance.vision')throw Error('Only exact verified testnet host is accepted');return value;}
export function admitExchangeWrite():never {throw Error('UNSUPPORTED: no certified testnet write adapter. Mainnet unavailable.');}
export async function officialRead(command:'ticker-price'|'exchange-info'|'--version'|'ticker-help'|'order-help',symbol='BNBUSDT') {
  z.enum(['ticker-price','exchange-info','--version','ticker-help','order-help']).parse(command);
  z.string().regex(/^[A-Z0-9]{2,16}USDT$/).parse(symbol);
  const args=command==='--version'?['--version']:command==='ticker-help'?['spot','ticker-price','--help']:command==='order-help'?['spot','new-order','--help']:['spot',command,'--symbol',symbol];
  const host=testnetHost('https://testnet.binance.vision');
  // Explicit empty keys select environment configuration before profile lookup in
  // official utils.rs. No inherited Binance credentials, profiles or endpoint defaults.
  const env:NodeJS.ProcessEnv={PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,BINANCE_API_KEY:'',BINANCE_SECRET_KEY:'',BINANCE_API_ENV:'testnet',BINANCE_SPOT_BASE_PATH:host};
  let executable=process.env.STATEBOUND_BINANCE_CLI;let argv=args;
  if(!executable&&process.platform==='win32') {
    const local=resolve('.tools/binance-cli-x86_64-unknown-linux-gnu/binance-cli');if(!existsSync(local))throw Error('Official CLI not installed locally. See docs/BINANCE_INTEGRATION.md');
    const wslPath=`/mnt/${local[0].toLowerCase()}${local.slice(2).replaceAll('\\','/')}`;
    executable='wsl.exe';argv=['-d','Ubuntu','--','env','-i','PATH=/usr/bin:/bin','BINANCE_API_KEY=','BINANCE_SECRET_KEY=','BINANCE_API_ENV=testnet',`BINANCE_SPOT_BASE_PATH=${host}`,wslPath,...args];
  }
  if(!executable)throw Error('Set STATEBOUND_BINANCE_CLI to an installed official executable');
  const {stdout,stderr}=await exec(executable,argv,{env,shell:false,windowsHide:true,timeout:20000,maxBuffer:1024*1024});
  if(stderr.trim())throw Error('Official CLI emitted an error; inspect locally without sharing credentials');
  if(command.includes('help')||command==='--version')return stdout.trim();
  const raw:unknown=JSON.parse(stdout);
  if(command==='ticker-price')return z.strictObject({symbol:z.literal(symbol),price:decimal}).parse(raw);
  return z.object({timezone:z.string(),serverTime:z.number(),symbols:z.array(z.object({symbol:z.string(),status:z.string(),filters:z.array(z.object({filterType:z.string()}).passthrough())}).passthrough())}).passthrough().parse(raw);
}
