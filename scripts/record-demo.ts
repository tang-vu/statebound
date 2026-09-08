import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {verify} from '../src/evidence.js';
type Scene={id:string;text:string};
const scenes=JSON.parse(readFileSync('submission/scenes.json','utf8')) as Scene[];
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'test-results/demo-video',size:{width:1440,height:900}},reducedMotion:'reduce'});
const page=await context.newPage();const timings:{id:string;start:number;end:number;text:string;audio:string}[]=[];
const begin=performance.now();
try {
  await page.goto('http://127.0.0.1:4381');await page.getByRole('button',{name:'Confirm this mandate'}).waitFor();
  for(const scene of scenes) {
    if(scene.id==='intro'){await page.getByRole('button',{name:'Confirm this mandate'}).click();await page.locator('#workspace').scrollIntoViewIfNeeded();}
    if(scene.id==='failure'){await page.getByRole('button',{name:'Find a failure'}).click();await page.getByRole('heading',{name:'30 USDT can leave a 20 USDT mandate.'}).waitFor({timeout:30000});}
    if(scene.id==='knowledge'){await page.locator('.timeline-row').first().click();await page.locator('.knowledge').scrollIntoViewIfNeeded();}
    if(scene.id==='repair'){
      const disclosure=page.getByText('External AI repair · recorded Codex run & new candidates',{exact:true});await disclosure.click();await page.getByRole('button',{name:'Load recorded Codex candidate'}).click();await page.getByRole('button',{name:'Validate candidate & recheck'}).click();await page.getByRole('heading',{name:'No violation within the checked bound.'}).waitFor({timeout:30000});await disclosure.click();await page.locator('.investigation').scrollIntoViewIfNeeded();
    }
    if(scene.id==='recover'){await page.getByRole('button',{name:'Replay recoverable case'}).click();await page.getByRole('heading',{name:'No violation within the checked bound.'}).waitFor({timeout:30000});await page.locator('.timeline-title').scrollIntoViewIfNeeded();}
    if(scene.id==='ambiguity'){await page.getByRole('button',{name:'Replay ambiguity',exact:true}).click();await page.getByRole('heading',{name:'No violation within the checked bound.'}).waitFor({timeout:30000});await page.locator('.outcome').scrollIntoViewIfNeeded();await page.screenshot({path:'submission/ambiguity.png',fullPage:true});}
    if(scene.id==='evidence'){
      await page.locator('.integration').scrollIntoViewIfNeeded();const pending=page.waitForEvent('download');await page.getByRole('link',{name:'Export evidence'}).click();const download=await pending;await download.saveAs('submission/demo-evidence.json');const result=verify(JSON.parse(readFileSync('submission/demo-evidence.json','utf8')));writeFileSync('submission/verifier-output.json',JSON.stringify(result,null,2));await page.getByRole('button',{name:'Verify this export'}).click();await page.getByText('Verified: replay and bounded search recomputed.',{exact:true}).waitFor({timeout:30000});
    }
    if(scene.id==='binance') {await page.goto('http://127.0.0.1:4382/#binance');await page.locator('#binance').scrollIntoViewIfNeeded();}
    if(scene.id==='closing') {await page.goto('http://127.0.0.1:4382/?case=repair&step=6#lab');await page.locator('.lab-body').waitFor({state:'visible'});await page.locator('[data-case="repair"]').click();await page.getByRole('button',{name:'Jump to outcome'}).click();await page.locator('.lab-stage').scrollIntoViewIfNeeded();}
    const audio=`.runtime/mimo/${scene.id}.wav`;
    const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',audio],{encoding:'utf8',windowsHide:true}).trim());
    const start=(performance.now()-begin)/1000;console.log(`Recording ${scene.id}: ${duration.toFixed(1)}s`);
    await page.waitForTimeout(duration*1000+500);timings.push({id:scene.id,start,end:start+duration,text:scene.text,audio});
  }
}finally{const video=page.video()!;await context.close();mkdirSync('submission',{recursive:true});await video.saveAs('submission/demo-raw.webm');await browser.close();writeFileSync('submission/recording-timing.json',JSON.stringify(timings,null,2));}
await import('./mux-mimo.js');
