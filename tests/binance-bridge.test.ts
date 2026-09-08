import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveBinanceModel} from '../src/binance-bridge.js';
import {D,type Plan} from '../src/core.js';
const input=()=>JSON.parse(readFileSync('examples/binance-read.json','utf8'));
const candidate=JSON.parse(readFileSync('examples/external-agent-run.json','utf8')).output as Plan;
test('Binance snapshot drives exact price and quantity grids without enabling exchange execution',()=>{
  const raw=input();raw.quote.price='751.237';
  const result=deriveBinanceModel(raw,candidate);
  assert.equal(result.mandate.limitPrice,'751.23');
  assert.equal(D(result.mandate.goal)%D(result.mandate.filters.step),0n);
  assert.equal(result.mandate.environment,'simulator');assert.equal(result.mandate.feeBps,10);
  assert.ok(result.provenance.unmappedFilters.includes('PERCENT_PRICE_BY_SIDE'));
  assert.notEqual(result.provenance.inputHash,deriveBinanceModel(input(),candidate).provenance.inputHash);
});
test('bridge rejects mismatched, inactive, missing, duplicate and disabled market metadata',()=>{
  for(const mutate of [
    (r:ReturnType<typeof input>)=>{r.quote.symbol='BTCUSDT';},
    (r:ReturnType<typeof input>)=>{r.exchangeInfo.symbols[0].status='BREAK';},
    (r:ReturnType<typeof input>)=>{r.exchangeInfo.symbols[0].filters=[];},
    (r:ReturnType<typeof input>)=>{r.exchangeInfo.symbols[0].filters.push(r.exchangeInfo.symbols[0].filters[0]);},
    (r:ReturnType<typeof input>)=>{r.exchangeInfo.symbols[0].filters[0].tickSize='0';},
    (r:ReturnType<typeof input>)=>{r.host='https://api.binance.com';}
  ]){const raw=input();mutate(raw);assert.throws(()=>deriveBinanceModel(raw,candidate));}
});
