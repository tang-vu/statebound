import { mkdirSync,writeFileSync } from 'node:fs';
import { officialRead,binanceCapabilities } from '../src/binance.js';
mkdirSync('examples',{recursive:true});mkdirSync('docs',{recursive:true});
try {
  const version=await officialRead('--version');
  const tickerHelp=await officialRead('ticker-help');const orderHelp=await officialRead('order-help');
  const quote=await officialRead('ticker-price');const exchangeInfo=await officialRead('exchange-info');
  const record={status:'OBSERVED READ',route:'Binance Skills Hub → official Binance CLI',version,observedAt:new Date().toISOString(),environment:'testnet',host:'https://testnet.binance.vision',dataSource:'recorded Binance response',authentication:'public data; empty keys; no profile lookup',capabilities:binanceCapabilities,quote,exchangeInfo,calls:[['spot','ticker-price','--symbol','BNBUSDT'],['spot','exchange-info','--symbol','BNBUSDT']],source:'https://github.com/binance/binance-skills-hub/tree/257d287079cfac7d9a173078fc574e8fd7bbf212/skills/binance/binance'};
  writeFileSync('examples/binance-read.json',JSON.stringify(record,null,2));writeFileSync('docs/BINANCE_CLI_HELP.txt',`${version}\n\n${tickerHelp}\n\n${orderHelp}\n`);console.log(JSON.stringify({status:record.status,route:record.route,version,observedAt:record.observedAt,quote,execution:binanceCapabilities.execution},null,2));
}catch(e){console.error(JSON.stringify({status:'BLOCKED',reason:e instanceof Error?e.message:'Official read failed',execution:'UNSUPPORTED'}));process.exitCode=1;}
