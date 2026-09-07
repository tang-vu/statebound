import { z } from 'zod';

export const VERSION = 'statebound-1';
export const decimal = z.string().regex(/^(0|[1-9][0-9]{0,11})(\.[0-9]{1,8})?$/);

const id = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/).refine(x=>!['constructor','prototype','__proto__'].includes(x));
export const MandateSchema = z.strictObject({
  version:z.literal(VERSION),id,createdAt:z.string().datetime(),expiresAt:z.string().datetime(),
  account:id,environment:z.literal('simulator'),symbol:z.string().regex(/^[A-Z0-9]{2,16}USDT$/),quoteAsset:z.literal('USDT'),side:z.literal('BUY'),orderType:z.literal('LIMIT_IOC'),
  budget:decimal,reserve:decimal,initialQuote:decimal,goal:decimal,tolerance:decimal,
  maxOrders:z.number().int().min(1).max(4),maxReads:z.number().int().min(1).max(6),
  quote:z.strictObject({price:decimal,at:z.string().datetime(),maxAgeMs:z.number().int().positive().max(86400000),source:z.literal('synthetic fixture')}),
  limitPrice:decimal,feeAsset:z.enum(['quote','base']),feeBps:z.number().int().min(0).max(100),
  filters:z.strictObject({step:decimal,tick:decimal,minQty:decimal,maxQty:decimal,minNotional:decimal})
});
export type Mandate = z.infer<typeof MandateSchema>;
const edge = {next:id};
export const NodeSchema = z.discriminatedUnion('op',[
  z.strictObject({id,op:z.literal('submit'),operation:id,quantity:z.union([decimal,z.literal('remaining')]),...edge}),
  z.strictObject({id,op:z.literal('query'),...edge}),z.strictObject({id,op:z.literal('balance'),...edge}),
  z.strictObject({id,op:z.literal('wait'),...edge}),
  z.strictObject({id,op:z.literal('branch'),guard:z.strictObject({field:z.enum(['goalMet','lastTerminal','hasUnknown']),equals:z.boolean()}),yes:id,no:id}),
  z.strictObject({id,op:z.enum(['complete','pause'])})
]);
export const PlanSchema=z.strictObject({version:z.literal(VERSION),id,mandateHash:z.string().regex(/^[a-f0-9]{64}$/),snapshot:z.literal('synthetic-initial-v1'),adapter:z.literal('simulator-ioc-v1'),maxSteps:z.number().int().min(1).max(48),maxDurationMs:z.number().int().min(1).max(60000),start:id,nodes:z.array(NodeSchema).min(1).max(32)});
export type Plan=z.infer<typeof PlanSchema>;
