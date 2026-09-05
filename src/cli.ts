import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { fixture,templateRepair,validate } from './core.js';
import { check,runScenario } from './checker.js';
import { bundle,verify,InputSchema,acceptRepair } from './evidence.js';
const [command,file,candidateFile]=process.argv.slice(2);
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8')) as unknown;
try {
  if(command==='demo') {
    const {mandate,plan}=fixture();const repaired=templateRepair(plan);
    const baseline=check(mandate,plan,'baseline');const guarded=check(mandate,plan);const fixed=acceptRepair(mandate,plan,repaired);
    if(baseline.status!=='COUNTEREXAMPLE_FOUND') throw Error('Expected computed violation');
    mkdirSync('examples',{recursive:true});
    writeFileSync('examples/vulnerable.json',JSON.stringify({mandate,plan},null,2));
    writeFileSync('examples/template-repaired.json',JSON.stringify({mandate,plan:repaired},null,2));
    const evidence=bundle(mandate,plan,'baseline','fixture');writeFileSync('examples/counterexample.json',JSON.stringify(evidence,null,2));
    console.log(JSON.stringify({baseline,guarded,repaired:fixed,recoverable:runScenario(mandate,repaired,'guarded',{fill:'full',reply:'lost'}).world.agent.status,permanent:runScenario(mandate,repaired,'guarded',{fill:'full',reply:'lost'},'notFound').world.agent.status,verification:verify(evidence)},null,2));
  } else if(command==='check') {const {mandate,plan}=InputSchema.parse(read(file));validate(mandate,plan);console.log(JSON.stringify(check(mandate,plan),null,2));}
  else if(command==='verify'||command==='replay') console.log(JSON.stringify(verify(read(file),command==='verify'),null,2));
  else if(command==='repair') {
    const original=InputSchema.parse(read(file));const candidate=InputSchema.parse(read(candidateFile));
    if(JSON.stringify(original.mandate)!==JSON.stringify(candidate.mandate)) throw Error('Mandate immutable');
    acceptRepair(original.mandate,original.plan,candidate.plan);
    const evidence=bundle(original.mandate,candidate.plan,'guarded','external_agent',original.plan);
    mkdirSync('.runtime',{recursive:true});writeFileSync('.runtime/external-repair.json',JSON.stringify({input:original,output:candidate,provenance:'external_agent',evidence},null,2));console.log(JSON.stringify(verify(evidence),null,2));
  } else throw Error('Commands: demo | check input.json | repair original.json candidate.json | verify bundle.json | replay bundle.json');
} catch(e) {console.error(e instanceof Error?e.message:'Command failed');process.exitCode=1;}
