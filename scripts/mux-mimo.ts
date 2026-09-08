import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
const rawTimings=JSON.parse(readFileSync('submission/recording-timing.json','utf8')) as {id:string;start:number;end:number;text:string;audio:string}[];
// Keep the click and the resulting state; remove only the middle of long silent waits.
const cuts=rawTimings.flatMap((t,i)=>i&&t.start-rawTimings[i-1].end>3?[{start:rawTimings[i-1].end+1.2,end:t.start-1}]:[]);
const editedTime=(t:number)=>t-cuts.filter(c=>c.end<=t).reduce((sum,c)=>sum+c.end-c.start,0);
const timings=rawTimings.map(t=>({...t,start:editedTime(t.start),end:editedTime(t.end)}));
const duration=timings.at(-1)!.end+1;
const labels:Record<string,string>={intro:'The question',failure:'Find the failure',knowledge:'Inspect exposure',repair:'Check the AI repair',recover:'Confirm the goal',ambiguity:'Preserve uncertainty',evidence:'Verify independently',binance:'Binance inputs to verdict',closing:'Explore the evidence'};
const stamp=(n:number)=>{const ms=Math.round(n*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
const ass=(n:number)=>stamp(n).replace(/^0/,'').replace(',','.').slice(0,-1);
const cues:{start:number;end:number;text:string}[]=[];
const dialogues=[`Dialogue: 1,0:00:00.00,${ass(duration)},Disclosure,,0,0,0,,SIMULATOR / AI VOICE / RECORDED REPAIR / WAITS SHORTENED`];
for(const [i,t] of timings.entries()){
  const parts=(t.text.match(/[^.!?]+[.!?]+/g)??[t.text]).flatMap(s=>{
    const words=s.trim().split(/\s+/);const chunks:string[]=[];let chunk='';
    const count=Math.ceil(s.trim().length/95),target=Math.ceil(s.trim().length/count);
    for(const word of words){if(chunk&&(chunk+' '+word).length>target&&chunks.length<count-1){chunks.push(chunk);chunk=word;}else chunk+=(chunk?' ':'')+word;}
    if(chunk)chunks.push(chunk);return chunks;
  });
  const total=parts.reduce((n,s)=>n+s.length,0);let time=t.start;
  for(const part of parts){const end=time+(t.end-t.start)*part.length/total;cues.push({start:time,end,text:part});dialogues.push(`Dialogue: 0,${ass(time)},${ass(end)},Caption,,0,0,0,,${part}`);time=end;}
  dialogues.push(`Dialogue: 1,${ass(t.start)},${ass(timings[i+1]?.start??duration)},Chapter,,0,0,0,,STATEBOUND  /  ${String(i+1).padStart(2,'0')}  /  ${labels[t.id].toUpperCase()}`);
}
writeFileSync('submission/captions.srt',cues.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n'));
writeFileSync('submission/captions.ass',`[Script Info]\nScriptType: v4.00+\nPlayResX: 1440\nPlayResY: 900\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Caption,Segoe UI,25,&H00FFFFFF,&H00FFFFFF,&H00232D29,&H00232D29,0,0,0,0,100,100,0,0,3,9,0,2,160,160,28,1\nStyle: Chapter,Consolas,17,&H0077A9FF,&H00FFFFFF,&H00232D29,&H00232D29,0,0,0,0,100,100,0,0,1,0,0,7,28,28,16,1\nStyle: Disclosure,Consolas,12,&H00E9F3F5,&H00FFFFFF,&H00232D29,&H00232D29,0,0,0,0,100,100,0,0,1,0,0,9,28,28,19,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${dialogues.join('\n')}\n`);
const args=['-hide_banner','-y','-i','submission/demo-raw.webm'];for(const t of timings)args.push('-i',t.audio);
const filters=timings.map((t,i)=>`[${i+1}:a]adelay=${Math.round(t.start*1000)}:all=1[a${i}]`);
filters.push(timings.map((_,i)=>`[a${i}]`).join('')+`amix=inputs=${timings.length}:normalize=0,apad,loudnorm=I=-16:TP=-1.5:LRA=7[audio]`);
const segments=[{start:0,end:cuts[0]?.start??rawTimings.at(-1)!.end+1},...cuts.map((c,i)=>({start:c.end,end:cuts[i+1]?.start??rawTimings.at(-1)!.end+1}))];
filters.push(`[0:v]split=${segments.length}${segments.map((_,i)=>`[source${i}]`).join('')}`);
for(const [i,s] of segments.entries())filters.push(`[source${i}]trim=start=${s.start}:end=${s.end},setpts=PTS-STARTPTS[clip${i}]`);
filters.push(segments.map((_,i)=>`[clip${i}]`).join('')+`concat=n=${segments.length}:v=1:a=0,tpad=stop_mode=clone:stop_duration=3,drawbox=x=0:y=0:w=iw:h=52:color=0x292d23:t=fill,subtitles=submission/captions.ass[video]`);
args.push('-filter_complex',filters.join(';'),'-map','[video]','-map','[audio]','-t',String(duration),'-c:v','libx264','-preset','fast','-crf','20','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart','.runtime/mimo/rendered.mp4');
const render=spawnSync('ffmpeg',args,{windowsHide:true,encoding:'utf8',maxBuffer:4*1024*1024});writeFileSync('.runtime/mimo/render.log',render.stderr??'');
if(render.status!==0)throw Error('Video render failed; inspect local render.log');
execFileSync('ffmpeg',['-v','error','-i','.runtime/mimo/rendered.mp4','-f','null','-'],{stdio:'pipe',windowsHide:true});
copyFileSync('.runtime/mimo/rendered.mp4','submission/demo.mp4');
writeFileSync('submission/edit-decisions.json',JSON.stringify({method:'Original speed; remove only middle sections of long unvoiced waits, preserving click and result. No spoken content removed.',removedRawIntervals:cuts,rawTimings:'recording-timing.json',editedTimings:timings},null,2)+'\n');
writeFileSync('preview/chapters.json',JSON.stringify({duration,chapters:timings.map(t=>({time:t.start,label:labels[t.id]}))},null,2)+'\n');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,codec_type','-of','json','submission/demo.mp4'],{windowsHide:true,encoding:'utf8'}));
writeFileSync('submission/video-validation.json',JSON.stringify({probe,speed:1,narration:{provider:'Xiaomi MiMo',model:'mimo-v2.5-tts',voice:'Dean',asr:'mimo-v2.5-asr'},disclosure:'Actual browser recording, simulated orders, recorded Codex candidate, original narration speed, chapter labels and captions. Binance scene uses saved public testnet inputs.',verifiedDecode:true,checks:['Full audio/video decode exits 0','Nine narrated scenes including Binance workflow','Caption timing proportional within each scene; not word-aligned ASR timestamps','Voice loudness target -16 LUFS / -1.5 dBTP; final measurement stored separately']},null,2)+'\n');
console.log(`MiMo demo rendered and decoded: ${probe.format.duration}s`);
