import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const timings=JSON.parse(readFileSync('submission/recording-timing.json','utf8')) as {id:string;start:number;end:number;text:string;audio:string}[];
const speed=1.35;
const stamp=(n:number)=>{const ms=Math.round(n*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
const duration=(timings.at(-1)!.end+1)/speed;
const labels:Record<string,string>={intro:'The mandate',failure:'Find the failure',knowledge:'Inspect exposure',repair:'Check the repair',recover:'Recoverable replay',ambiguity:'Unresolved exposure',evidence:'Verify the evidence'};
writeFileSync('preview/chapters.json',JSON.stringify({duration,chapters:timings.map(t=>({time:t.start/speed,label:labels[t.id]??t.id}))},null,2)+'\n');
const captions=[`1\n00:00:00,000 --> ${stamp(duration)}\n{\\an8}AI narration | Actual app | Recorded Codex repair | 1.35x playback\n`];
const assStamp=(n:number)=>stamp(n).replace(/^0/,'').replace(',', '.').slice(0,-1);
const dialogues=[`Dialogue: 0,0:00:00.00,${assStamp(duration)},Disclosure,,0,0,0,,AI narration | Actual app | Recorded Codex repair | 1.35x playback`];
for(const t of timings){const sentences=t.text.match(/[^.!?]+[.!?]+/g)??[t.text];let time=t.start;const total=sentences.reduce((n,s)=>n+s.length,0);for(const s of sentences){const end=time+(t.end-t.start)*s.length/total;captions.push(`${captions.length+1}\n${stamp(time/speed)} --> ${stamp(end/speed)}\n${s.trim()}\n`);dialogues.push(`Dialogue: 0,${assStamp(time/speed)},${assStamp(end/speed)},Caption,,0,0,0,,${s.trim()}`);time=end;}}
writeFileSync('submission/captions.srt',captions.join('\n'));
writeFileSync('submission/captions.ass',`[Script Info]\nScriptType: v4.00+\nPlayResX: 1440\nPlayResY: 900\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Caption,Arial,24,&H00FFFFFF,&H00FFFFFF,&H00101010,&H99000000,0,0,0,0,100,100,0,0,3,2,0,2,80,80,26,1\nStyle: Disclosure,Arial,14,&H00E8E8E8,&H00FFFFFF,&H00101010,&H99000000,0,0,0,0,100,100,0,0,3,1,0,8,20,20,48,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${dialogues.join('\n')}\n`);
const args=['-hide_banner','-y','-i','submission/demo-raw.webm'];for(const t of timings)args.push('-i',t.audio);
const filters=timings.map((t,i)=>`[${i+1}:a]adelay=${Math.round(t.start*1000)}:all=1[a${i}]`);filters.push(timings.map((_,i)=>`[a${i}]`).join('')+`amix=inputs=${timings.length}:normalize=0,atempo=${speed}[audio]`);
args.push('-filter_complex',filters.join(';'),'-map','0:v','-map','[audio]','-vf',`setpts=PTS/${speed},tpad=stop_mode=clone:stop_duration=3,subtitles=submission/captions.ass`,'-t',String(duration),'-c:v','libx264','-preset','fast','-crf','23','-c:a','aac','-movflags','+faststart','submission/demo.mp4');
try{execFileSync('ffmpeg',args,{windowsHide:true,stdio:['ignore','ignore','pipe'],maxBuffer:1024*1024});}catch(e){if(e&&typeof e==='object'&&'stderr' in e)writeFileSync('.runtime/mux-error.log',String(e.stderr));throw e;}
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,codec_type','-of','json','submission/demo.mp4'],{windowsHide:true,encoding:'utf8'}));
writeFileSync('submission/video-validation.json',JSON.stringify({probe,speed,disclosure:'1.35x playback, standard Windows synthetic voice, actual browser recording, recorded Codex candidate. Final frame extended briefly for narration tail.',verifiedDecode:false},null,2));
console.log(`Narrated video created: ${probe.format.duration}s. Decode and visual checks remain.`);
