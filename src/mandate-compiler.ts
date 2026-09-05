import {fixture,D,F,SCALE,hash,cost,validate,type Mandate} from './core.js';
// Intentionally narrow and reviewable grammar, not unrestricted language parsing.
export function compileRequest(request:string,reference?:Mandate) {
  const matched=/^buy around ((?:0|[1-9][0-9]*)(?:\.[0-9]{1,8})?) USDT of ([A-Z0-9]{2,12}), maximum total debit ((?:0|[1-9][0-9]*)(?:\.[0-9]{1,8})?) USDT$/i.exec(request.trim());
  if(!matched)throw Error('Use: buy around 15 USDT of BNB, maximum total debit 20 USDT');
  const [,target,base,budget]=matched;const {mandate,plan}=fixture();const m={...(reference??mandate),budget,symbol:`${base.toUpperCase()}USDT`};
  const quantity=F((D(target)*SCALE/D(m.limitPrice)/D(m.filters.step))*D(m.filters.step));
  m.goal=cost(m,quantity).net;const p={...plan,mandateHash:hash(m),nodes:plan.nodes.map(n=>n.op==='submit'?{...n,quantity}:n)};
  validate(m,p);
  return {mandate:m,plan:p,review:{requestedPrincipal:target,derivedGrossQuantity:quantity,derivedNetGoal:m.goal,maximumOrderDebit:cost(m,quantity).debit,referenceSource:m.quote.source,requiresUserConfirmation:true}};
}
