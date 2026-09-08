// One user-directed speech operation per invocation; not an application endpoint.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const [operation,id]=process.argv.slice(2);
if(!['tts','asr'].includes(operation)||!id?.match(/^[a-z]+$/))throw Error('Expected tts|asr and a scene id');
const scenes=JSON.parse(readFileSync('submission/scenes.json','utf8'));
const scene=scenes.find(s=>s.id===id);if(!scene)throw Error('Unknown scene');
const key=process.env.MIMO_API_KEY;if(!key)throw Error('MIMO_API_KEY missing');
const base='https://token-plan-sgp.xiaomimimo.com/v1';
const context='Speak in clear natural American English as a thoughtful product demonstrator. Warm, grounded and confident, with crisp consonants and restrained emphasis. Conversational pace around 155 words per minute. Short pauses at sentence boundaries. Never rush technical terms. Say Statebound as State Bound, Binance as BY-nance, Codex as code-ex. Read spaced acronyms as individual letters. Read only the assistant text, exactly once. Stop immediately after its final sentence. Do not add any closing words, numbers, commentary, or improvised speech.';
const model=operation==='tts'?'mimo-v2.5-tts':'mimo-v2.5-asr';
const folder='.runtime/mimo';mkdirSync(folder,{recursive:true});
const audioPath=`${folder}/${id}.wav`;
const data=operation==='asr'?readFileSync(audioPath).toString('base64'):'';
if(data.length>10*1024*1024)throw Error('Audio exceeds documented ASR limit');
const body=operation==='tts'?{model,messages:[{role:'user',content:context},{role:'assistant',content:scene.speech??scene.text}],audio:{format:'wav',voice:'Dean'}}:{model,messages:[{role:'user',content:[{type:'input_audio',input_audio:{data:`data:audio/wav;base64,${data}`}}]}],asr_options:{language:'en'}};
try{
  const response=await fetch(`${base}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify(body),signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw Error(`MiMo ${operation} returned HTTP ${response.status}`);
  const result=await response.json();const message=result.choices?.[0]?.message;
  if(operation==='tts'){
    if(!message?.audio?.data)throw Error('MiMo returned no audio');
    const bytes=Buffer.from(message.audio.data,'base64');
    if(bytes.subarray(0,4).toString()!=='RIFF')throw Error('Expected WAV response');
    writeFileSync(audioPath,bytes);
    writeFileSync(`${folder}/${id}-tts.json`,JSON.stringify({model,voice:'Dean',context,text:scene.speech??scene.text,audioSha256:createHash('sha256').update(bytes).digest('hex'),createdAt:new Date().toISOString()},null,2));
    console.log(`TTS ${id}: saved ${bytes.length} audio bytes`);
  }else{
    if(typeof message?.content!=='string')throw Error('MiMo returned no transcript');
    writeFileSync(`${folder}/${id}-asr.json`,JSON.stringify({model,text:message.content,createdAt:new Date().toISOString()},null,2));
    console.log(`ASR ${id}: ${message.content}`);
  }
}catch(error){console.error(error instanceof Error?error.message:'MiMo speech request failed');process.exitCode=1;}
