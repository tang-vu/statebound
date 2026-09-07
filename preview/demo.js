const assetUrl=path=>`${path}?v=${document.documentElement.dataset.assetVersion??'local'}`;
const views={
  failure:{status:'COUNTEREXAMPLE_FOUND',title:'A lost reply does not undo a fill.',description:'The synthetic order spends 15 USDT. Its acknowledgement is lost, then stale balance evidence triggers another 15 USDT order. The 30 USDT debit exceeds the confirmed 20 USDT budget.',artifact:'/counterexample.json',label:'Download counterexample JSON ↗',image:'/counterexample.png',alt:'Workbench showing the computed counterexample'},
  repair:{status:'NO_VIOLATION_WITHIN_BOUND',title:'Reconcile the original attempt. Then buy the remainder.',description:'A guard alone blocks the unsafe retry but can miss the goal. The repaired graph queries the original attempt, consumes decisive evidence and sizes the remaining acquisition. Checks cover the declared finite IOC model; permanently missing evidence stays unresolved.',artifact:'/evaluation.json',label:'Inspect all evaluation outcomes ↗',image:'/repaired.png',alt:'Workbench showing the checked repaired graph'},
  execution:{status:'DURABLE REPLAY / UNRESOLVED',title:'A restart does not erase exposure.',description:'The recorded ambiguity replay preserves the attempt and pending debit in SQLite. Shared transition semantics and action-bound approvals constrain execution. The independent verifier replays the evidence and reruns the declared bounded search. No real exchange order was submitted.',artifact:'/evidence.json',label:'Download durable replay evidence ↗',image:'/ambiguity.png',alt:'Actual Statebound workbench showing unresolved exposure after a durable ambiguity replay'}
};
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{
  const view=views[button.dataset.view];
  for(const other of document.querySelectorAll('[data-view]'))other.setAttribute('aria-pressed',String(other===button));
  for(const id of ['status','title','description'])document.getElementById(id).textContent=view[id];
  const artifact=document.getElementById('artifact');artifact.href=assetUrl(view.artifact);artifact.textContent=view.label;
  const screenshot=document.getElementById('screenshot');screenshot.src=assetUrl(view.image);screenshot.alt=view.alt;
  document.getElementById('full-screenshot').href=assetUrl(view.image);
});

const video=document.querySelector('video');
const videoStatus=document.querySelector('.video-status');
const timeLabel=seconds=>Math.floor(seconds/60).toString().padStart(2,'0')+':'+Math.floor(seconds%60).toString().padStart(2,'0');
video.addEventListener('loadedmetadata',()=>{if(Number.isFinite(video.duration))document.querySelector('[data-duration]').textContent=timeLabel(video.duration);});
video.addEventListener('error',()=>{videoStatus.hidden=false;videoStatus.textContent='The recording could not load. Reload this page to try again; the evidence downloads remain available below.';});
fetch(assetUrl('/chapters.json')).then(response=>{if(!response.ok)throw Error('Chapters unavailable');return response.json();}).then(({chapters})=>{
  const container=document.querySelector('.video-chapters');
  const buttons=[];
  for(const chapter of chapters){
    const button=document.createElement('button');const time=document.createElement('span');time.textContent=timeLabel(chapter.time);button.append(time,chapter.label);
    button.addEventListener('click',async()=>{video.currentTime=chapter.time;updateChapter();try{await video.play();videoStatus.hidden=true;}catch{videoStatus.hidden=false;videoStatus.textContent='Chapter selected. Press play in the video to continue.';}});
    container.append(button);buttons.push(button);
  }
  const updateChapter=()=>{let active=0;for(let i=0;i<chapters.length;i++)if(video.currentTime+0.05>=chapters[i].time)active=i;buttons.forEach((button,i)=>{if(i===active)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});};
  video.addEventListener('timeupdate',updateChapter);video.addEventListener('seeked',updateChapter);updateChapter();
}).catch(()=>{ /* Native video controls remain usable without chapter metadata. */ });
