import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { InputSchema,acceptRepair,bundle,verify } from '../src/evidence.js';
import { PlanSchema,hash } from '../src/core.js';
// Structured candidate authored by the active Codex session after inspecting the
// CLI counterexample. This file preserves the output, not a model-provider call.
const original=InputSchema.parse(JSON.parse(readFileSync('examples/vulnerable.json','utf8')));
const candidate=PlanSchema.parse({...original.plan,id:'codex-reconcile-v1',start:'acquire',nodes:[
  {id:'acquire',op:'submit',operation:'acquire',quantity:'remaining',next:'terminal'},
  {id:'terminal',op:'branch',guard:{field:'lastTerminal',equals:true},yes:'goal',no:'reconcile'},
  {id:'reconcile',op:'query',next:'terminal'},
  {id:'goal',op:'branch',guard:{field:'goalMet',equals:true},yes:'complete',no:'acquire'},
  {id:'complete',op:'complete'}
]});
const result=acceptRepair(original.mandate,original.plan,candidate);
const evidence=bundle(original.mandate,candidate,'guarded','external_agent',original.plan);
mkdirSync('examples',{recursive:true});
writeFileSync('examples/codex-repaired.json',JSON.stringify({mandate:original.mandate,plan:candidate},null,2));
const diagnostic=JSON.parse(readFileSync('examples/counterexample.json','utf8')).payload.result.counterexample as {effect:unknown;observation:unknown;after:unknown}[];
writeFileSync('examples/external-agent-run.json',JSON.stringify({agent:'external Codex session',generation:'Development-session candidate, stored for replay. No live model API in web app.',input:{...original,deliveredTrace:diagnostic.map(e=>({effect:e.effect,observation:e.observation,knowledge:e.after}))},output:candidate,rationale:'Query the original ambiguous attempt until terminal evidence. Retain exposure on stale or missing evidence. Only acquire remaining quantity after reconciliation. Preserve mandate and all check bounds.',candidateHash:hash(candidate),validation:result,evidence},null,2));
console.log(JSON.stringify(verify(evidence),null,2));
