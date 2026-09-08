import {z} from 'zod';
import {D,F,SCALE,decimal,fixture,hash,validate,cost,type Plan} from './core.js';

const filter=z.object({filterType:z.string()}).catchall(z.unknown());
const ReadSchema=z.object({
  status:z.literal('OBSERVED READ'),environment:z.literal('testnet'),host:z.literal('https://testnet.binance.vision'),
  observedAt:z.string().datetime(),version:z.string(),
  quote:z.object({symbol:z.literal('BNBUSDT'),price:decimal}),
  exchangeInfo:z.object({symbols:z.array(z.object({symbol:z.string(),status:z.string(),baseAsset:z.string(),quoteAsset:z.string(),orderTypes:z.array(z.string()),filters:z.array(filter)}))})
});

// Import a recorded public read into a NEW synthetic model, never a trading mandate.
// Unmapped venue rules remain explicit; this does not certify exchange admission.
export function deriveBinanceModel(raw:unknown,candidate:Plan){
  const read=ReadSchema.parse(raw);
  const matches=read.exchangeInfo.symbols.filter(s=>s.symbol===read.quote.symbol);
  if(matches.length!==1)throw Error('Expected exactly one matching symbol');
  const symbol=matches[0];
  if(symbol.status!=='TRADING'||symbol.baseAsset!=='BNB'||symbol.quoteAsset!=='USDT'||!symbol.orderTypes.includes('LIMIT'))throw Error('Unsupported symbol state');
  const pick=(kind:string)=>{const items=symbol.filters.filter(f=>f.filterType===kind);if(items.length!==1)throw Error(`Missing or duplicate ${kind}`);return items[0];};
  const price=z.object({tickSize:decimal,minPrice:decimal,maxPrice:decimal}).parse(pick('PRICE_FILTER'));
  const lot=z.object({stepSize:decimal,minQty:decimal,maxQty:decimal}).parse(pick('LOT_SIZE'));
  const notional=z.object({minNotional:decimal,maxNotional:decimal}).parse(pick('NOTIONAL'));
  const tick=D(price.tickSize),step=D(lot.stepSize);
  if(tick===0n||step===0n)throw Error('Disabled price or quantity grid is unsupported');
  const limit=D(read.quote.price)/tick*tick;
  if(limit===0n||limit<D(price.minPrice)||limit>D(price.maxPrice))throw Error('Price outside recorded bounds');
  const quantity=(D('15')*SCALE/limit)/step*step;
  if(quantity===0n)throw Error('Target below one lot');
  const {mandate,plan}=fixture('20',F(quantity),10);
  mandate.id='binance-derived-model';mandate.createdAt=read.observedAt;
  mandate.expiresAt=new Date(Date.parse(read.observedAt)+86400000).toISOString();
  mandate.quote={price:F(D(read.quote.price)),at:read.observedAt,maxAgeMs:60000,source:'synthetic fixture'};
  mandate.limitPrice=F(limit);
  mandate.filters={step:F(step),tick:F(tick),minQty:F(D(lot.minQty)),maxQty:F(D(lot.maxQty)),minNotional:F(D(notional.minNotional))};
  if(D(cost(mandate,mandate.goal).principal)>D(notional.maxNotional))throw Error('Target exceeds recorded notional maximum');
  plan.mandateHash=hash(mandate);
  const repaired={...candidate,mandateHash:hash(mandate)};
  validate(mandate,plan);validate(mandate,repaired);
  return {mandate,plan,repaired,provenance:{
    inputHash:hash(raw),observedAt:read.observedAt,version:read.version,host:read.host,
    imported:['ticker price','PRICE_FILTER tick/min/max','LOT_SIZE step/min/max','NOTIONAL min/max'],
    unmappedFilters:symbol.filters.filter(f=>!['PRICE_FILTER','LOT_SIZE','NOTIONAL'].includes(f.filterType)).map(f=>f.filterType),
    assumptions:{targetPrincipal:'15 USDT rounded down to a full lot',budget:'20 USDT',account:'synthetic 100 USDT',fee:'synthetic 10 bps in quote asset; not an account fee quote',execution:'finite simulated IOC fills and observations',freshness:'historical snapshot; read timestamp is not a live execution authorization'},
    limitation:'Recorded market data parameterizes a synthetic model. Dynamic venue filters, account permissions, liquidity and actual fees are not certified. Hosted MCP is not connected; no order is sent.'
  }};
}
