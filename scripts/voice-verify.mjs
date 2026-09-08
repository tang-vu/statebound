import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const scenes=JSON.parse(readFileSync('submission/scenes.json','utf8'));
const normalize=text=>text.replace(/^(?:think>\s*)?(?:<chinese>\s*)?(?:\d+\.\s*)?/i,'').toLowerCase().replace(/state[- ]bound/g,'statebound').replace(/look-up/g,'lookup').replace(/m c p/g,'mcp').replace(/[^a-z0-9\s]/g,' ').trim().split(/\s+/);
const distance=(a,b)=>{let row=b.map((_,i)=>i+1);row.unshift(0);for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next.push(Math.min(row[j+1]+1,next[j]+1,row[j]+Number(a[i]!==b[j])));row=next;}return row.at(-1);};
const results=scenes.map(scene=>{
  const folder='.runtime/mimo/';const raw=JSON.parse(readFileSync(`${folder}${scene.id}-asr.json`,'utf8'));
  const expected=normalize(scene.text),observed=normalize(raw.text);const edits=distance(expected,observed);const ratio=edits/expected.length;
  assert.ok(ratio<=0.08,`${scene.id}: ASR differs too much (${edits} edits)`);
  const file=`${folder}${scene.id}.wav`;
  const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8',windowsHide:true}).trim());
  const wordsPerMinute=expected.length/duration*60;assert.ok(wordsPerMinute>95&&wordsPerMinute<190,`${scene.id}: pacing needs review`);
  return {id:scene.id,expected:scene.text,asrTranscript:raw.text,wordEdits:edits,wordErrorRatio:ratio,duration,wordsPerMinute,audioSha256:createHash('sha256').update(readFileSync(file)).digest('hex'),tailEdit:scene.id==='binance'?'Trimmed at 17.85s after complete script and before unwanted speech':scene.id==='closing'?'Trimmed at 15.65s after complete script and before unwanted speech':'none'};
});
writeFileSync('submission/voice-validation.json',JSON.stringify({provider:'Xiaomi MiMo',ttsModel:'mimo-v2.5-tts',voice:'Dean',asrModel:'mimo-v2.5-asr',passed:true,method:'ASR text comparison, manual transcript review, duration and pace checks. ASR may introduce punctuation and token errors; it is not a human listening test.',rejectedTakes:'Initial ambiguity and Binance takes contained extra transcript content and were discarded. Final Binance and closing tails were trimmed at measured pauses and retranscribed.',scenes:results},null,2)+'\n');
console.log(JSON.stringify(results.map(({id,wordEdits,duration,wordsPerMinute})=>({id,wordEdits,duration,wordsPerMinute:Math.round(wordsPerMinute)})),null,2));
