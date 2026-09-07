const root=document.querySelector('.evidence-lab');
const find=selector=>root.querySelector(selector);
const set=(selector,text)=>{find(selector).textContent=text;};
const version=document.documentElement.dataset.assetVersion??'local';
const units=value=>{const [whole,fraction='']=value.split('.');return BigInt(whole)*100000000n+BigInt(fraction.padEnd(8,'0'));};
const decimal=value=>{const negative=value<0n;if(negative)value=-value;const fraction=String(value%100000000n).padStart(8,'0').replace(/0+$/,'');return `${negative?'-':''}${value/100000000n}${fraction?'.'+fraction:''}`;};
const action=event=>event.effect.kind==='submit'?`Submit ${event.effect.quantity} BNB`:event.effect.kind==='query'?'Query the original attempt':event.effect.kind==='balance'?'Read the account balance':event.status==='REFUSED'?'Refuse the retry':event.status==='COMPLETE'?'Confirm the acquisition goal':event.status==='UNRESOLVED'?'Stop with unresolved exposure':`Follow the ${event.node} branch`;
const observation=event=>!event.observation?'No new exchange observation.':event.observation.kind==='timeout'?'Delivered to agent: timeout. Execution is unknown.':event.observation.kind==='balance'?'Delivered to agent: stale initial balance.':event.observation.kind==='notFound'?`Delivered to agent: not found (${event.observation.definitive?'definitive':'inconclusive'}).`:`Delivered to agent: ${event.observation.status}, ${event.observation.terminal?'terminal evidence':'not yet terminal'}.`;

async function initialize(){
  const response=await fetch(`/replay-gallery.json?v=${version}`);
  if(!response.ok)throw Error('Gallery unavailable');
  const gallery=await response.json();
  if(gallery.version!==1||gallery.cases.length!==4)throw Error('Unsupported gallery');
  const budget=units(gallery.mandate.budget);
  const axis=Math.max(Number(gallery.mandate.budget),...gallery.cases.flatMap(item=>item.events.map(event=>Math.max(Number(event.actualDebit),Number(event.possibleDebit)))));
  const query=new URL(location.href).searchParams;
  let active=gallery.cases.find(item=>item.id===query.get('case'))??gallery.cases[0];
  const requested=Number(query.get('step'));
  let index=Number.isInteger(requested)&&requested>0?Math.min(active.events.length-1,requested-1):0;
  const range=find('.lab-range');
  const buttons=[];
  for(const [i,item] of gallery.cases.entries()){
    const button=document.createElement('button');button.type='button';button.dataset.case=item.id;
    const number=document.createElement('span');number.textContent=`0${i+1}`;button.append(number,item.label);
    button.addEventListener('click',()=>{active=item;index=0;render(true);});
    buttons.push(button);find('.lab-cases').append(button);
  }
  function address(){const url=new URL(location.href);url.searchParams.set('case',active.id);url.searchParams.set('step',String(index+1));url.hash='lab';return url;}
  function render(updateUrl=false){
    const event=active.events[index];
    const over=units(event.actualDebit)>budget;
    const state=over?'BUDGET EXCEEDED':event.status==='RUNNING'?'IN PROGRESS':event.status;
    for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.case===active.id));
    range.max=String(active.events.length);range.value=String(index+1);
    range.setAttribute('aria-valuetext',`Step ${index+1} of ${active.events.length}: ${action(event)}`);
    set('.lab-step',`${String(index+1).padStart(2,'0')} / ${String(active.events.length).padStart(2,'0')}`);
    set('.lab-action',action(event));set('.lab-observation',observation(event));set('.lab-status',state);
    find('.lab-stage').dataset.state=state;
    set('.lab-possible',`${event.possibleDebit} USDT`);set('.lab-actual',`${event.actualDebit} USDT`);
    set('.lab-confirmed',`${event.confirmedDebit} USDT`);set('.lab-headroom',`${decimal(budget-units(event.possibleDebit))} USDT`);
    find('.lab-possible-bar').style.width=`${Number(event.possibleDebit)/axis*100}%`;
    find('.lab-actual-bar').style.width=`${Number(event.actualDebit)/axis*100}%`;
    for(const line of root.querySelectorAll('.lab-budget-line'))line.style.left=`${Number(gallery.mandate.budget)/axis*100}%`;
    set('.lab-budget-label',over?`${decimal(units(event.actualDebit)-budget)} USDT above the ${gallery.mandate.budget} USDT mandate.`:`Within the ${gallery.mandate.budget} USDT mandate. The marker shows its limit.`);
    let explanation='This control-flow step creates no additional exchange effect. Existing exposure is preserved.';
    if(event.observation?.kind==='timeout')explanation='The fill happened, but its reply did not arrive. No spend has been confirmed to the agent. The possible debit still consumes the mandate.';
    if(event.observation?.kind==='balance')explanation='An old balance is not terminal order evidence. It cannot release the reservation for the first attempt.';
    if(event.observation?.kind==='notFound')explanation='This lookup is inconclusive. The agent must continue accounting for a possible fill.';
    if(event.observation?.kind==='order'&&event.observation.terminal)explanation='Terminal order evidence reconciles the attempt. The agent can now account for confirmed spend and net acquisition.';
    if(event.status==='REFUSED')explanation='The guard blocks a purchase that would exceed possible exposure. Blocking a retry alone does not confirm the original acquisition.';
    if(event.status==='COMPLETE')explanation='The acquisition goal is confirmed, with no unresolved attempt. The repaired workflow completes without a duplicate purchase.';
    if(event.status==='UNRESOLVED')explanation='The workflow ends without confirmed progress. Pending exposure remains part of the mandate.';
    if(over)explanation='The blind retry has produced a second fill. Actual debit now exceeds the mandate, even though the first reply was missing.';
    set('.lab-explanation',explanation);set('.lab-conditions',active.conditions);
    const final=active.events.at(-1);
    set('.lab-ending',units(final.actualDebit)>budget?'Budget exceeded':active.terminal==='COMPLETE'?'Goal confirmed':active.terminal==='REFUSED'?'Retry refused':'Exposure unresolved');
    set('.lab-outcome',active.summary);
    set('.lab-trace-hash',`Trace hash: ${active.traceHash}`);
    find('.lab-prev').disabled=index===0;find('.lab-next').disabled=index===active.events.length-1;find('.lab-last').disabled=index===active.events.length-1;
    set('.lab-copy-status','');find('.lab-share-fallback').hidden=true;
    if(updateUrl)history.replaceState(null,'',address());
  }
  find('.lab-prev').addEventListener('click',()=>{index=Math.max(0,index-1);render(true);});
  find('.lab-next').addEventListener('click',()=>{index=Math.min(active.events.length-1,index+1);render(true);});
  find('.lab-last').addEventListener('click',()=>{index=active.events.length-1;render(true);});
  range.addEventListener('input',()=>{index=Number(range.value)-1;render(true);});
  find('.lab-share').addEventListener('click',async()=>{
    const url=address().href;
    try{await navigator.clipboard.writeText(url);set('.lab-copy-status','Step link copied.');}
    catch{const fallback=find('.lab-share-fallback');fallback.hidden=false;fallback.value=url;fallback.focus();fallback.select();set('.lab-copy-status','Select and copy the step link.');}
  });
  set('.lab-fixture',`${gallery.mandate.symbol} / ${gallery.mandate.budget} USDT BUDGET / ${gallery.mandate.feeBps} bps FEE`);
  set('.lab-bounds',`Model: ${gallery.model}. Bounds: ${gallery.mandate.maxOrders} orders, ${gallery.mandate.maxReads} reads, ${active.plan.maxSteps} steps. Fixed synthetic price: ${gallery.mandate.limitPrice} USDT.`);
  render();find('.lab-loading').hidden=true;find('.lab-body').hidden=false;
  if(location.hash==='#lab')requestAnimationFrame(()=>root.scrollIntoView({block:'start'}));
}
initialize().catch(()=>{set('.lab-loading','The interactive traces could not load. Reload to retry, or use the video and downloadable evidence below.');});
