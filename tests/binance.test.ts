import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testnetHost,admitExchangeWrite,officialRead } from '../src/binance.js';
test('testnet isolation rejects absent, alternate, lookalike hosts and all writes',async()=>{
  for(const host of [undefined,'','https://api.binance.com','https://testnet.binance.vision.evil.test','https://testnet.binance.vision/','http://testnet.binance.vision'])assert.throws(()=>testnetHost(host));
  assert.equal(testnetHost('https://testnet.binance.vision'),'https://testnet.binance.vision');assert.throws(()=>admitExchangeWrite());
  await assert.rejects(()=>officialRead('ticker-price','BNBUSDT; echo bad'));
});
