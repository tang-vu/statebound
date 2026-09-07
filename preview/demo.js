const views={
  failure:{status:'COUNTEREXAMPLE_FOUND',title:'A lost reply does not undo a fill.',description:'The synthetic order spends 15 USDT. Its acknowledgement is lost, then stale balance evidence triggers another 15 USDT order. The 30 USDT debit exceeds the confirmed 20 USDT budget.',artifact:'/counterexample.json',label:'Download counterexample JSON ↗',image:'/counterexample.png',alt:'Workbench showing the computed counterexample'},
  repair:{status:'NO_VIOLATION_WITHIN_BOUND',title:'Reconcile the original attempt. Then buy the remainder.',description:'A guard alone blocks the unsafe retry but can miss the goal. The repaired graph queries the original attempt, consumes decisive evidence and sizes the remaining acquisition. Checks cover the declared finite IOC model; permanently missing evidence stays unresolved.',artifact:'/evaluation.json',label:'Inspect all evaluation outcomes ↗',image:'/repaired.png',alt:'Workbench showing the checked repaired graph'},
  execution:{status:'DURABLE REPLAY / UNRESOLVED',title:'A restart does not erase exposure.',description:'The recorded ambiguity replay preserves the attempt and pending debit in SQLite. Shared transition semantics and action-bound approvals constrain execution. The independent verifier replays the evidence and reruns the declared bounded search. No real exchange order was submitted.',artifact:'/evidence.json',label:'Download durable replay evidence ↗',image:'/repaired.png',alt:'Actual Statebound workbench with repair and replay controls'}
};
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{
  const view=views[button.dataset.view];
  for(const other of document.querySelectorAll('[data-view]'))other.setAttribute('aria-pressed',String(other===button));
  for(const id of ['status','title','description'])document.getElementById(id).textContent=view[id];
  const artifact=document.getElementById('artifact');artifact.href=view.artifact;artifact.textContent=view.label;
  const screenshot=document.getElementById('screenshot');screenshot.src=view.image;screenshot.alt=view.alt;
});
