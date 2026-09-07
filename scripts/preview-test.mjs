import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {get} from 'node:http';
const base=process.argv[2]??'http://127.0.0.1:4382';
if(!['http://127.0.0.1:4382','https://statebound.tangvu.dev'].includes(base))throw Error('Unsupported preview target');
const publicCheck=base.startsWith('https:');
const landing=await fetch(base);
assert.match(landing.headers.get('cache-control')??'',/no-store/);
const markup=await landing.text();
const revision=markup.match(/data-asset-version="([a-f0-9]{16})"/)?.[1];
assert.ok(revision,'Preview carries a content-derived asset revision');
for(const asset of ['style.css','demo.js','demo.mp4'])assert.ok(markup.includes(`/${asset}?v=${revision}`),`${asset} is versioned`);
assert.equal((await fetch(`${base}/healthz`).then(r=>r.json())).writes,false);
for(const path of ['/api/session','/api/runs','/.env','/.runtime/statebound.db','/scripts/preview.mjs','/../package.json'])assert.equal((await fetch(`${base}${path}`)).status,404,path);
const hostStatus=host=>new Promise((resolve,reject)=>get(base,{headers:{Host:host}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject));
if(!publicCheck){assert.equal(await hostStatus('evil.example'),403);assert.equal(await hostStatus('statebound.tangvu.dev'),200);}
assert.equal((await fetch(`${base}/api/runs`,{method:'POST',body:'{}'})).status,405);
const ranged=await fetch(`${base}/demo.mp4`,{headers:{Range:'bytes=0-1023'}});assert.equal(ranged.status,206);assert.equal((await ranged.arrayBuffer()).byteLength,1024);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const downloaded=Buffer.from(await fetch(`${base}/evidence.json`).then(r=>r.arrayBuffer()));
assert.equal(digest(downloaded),digest(readFileSync('submission/demo-evidence.json')));
const chapters=await fetch(`${base}/chapters.json`).then(r=>r.json());
assert.equal(chapters.chapters.length,7);
assert.ok(chapters.chapters.every((chapter,i)=>chapter.time>=0&&chapter.time<chapters.duration&&(i===0||chapter.time>chapters.chapters[i-1].time)));
if(publicCheck){mkdirSync('.runtime',{recursive:true});writeFileSync('.runtime/public-evidence.json',downloaded);}
const browser=await chromium.launch();const errors=[];
try {
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
    page.on('response',response=>{if(response.status()>=400&&new URL(response.url()).pathname!=='/favicon.ico')errors.push(`${response.status()} ${new URL(response.url()).pathname}`);});
    page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('404 (Not Found)'))errors.push(message.text());});
    await page.goto(base);await page.locator('video').evaluate(async video=>{await video.play();});
    await page.waitForFunction(()=>document.querySelector('video').currentTime>0);
    await page.locator('video').evaluate(video=>{video.currentTime=45;});
    await page.waitForFunction(()=>{const video=document.querySelector('video');return video.currentTime>=45&&video.readyState>=3;});
    await page.getByRole('group',{name:'Demo chapters'}).getByRole('button').nth(1).click();
    await page.waitForFunction(time=>{const video=document.querySelector('video');return video.currentTime>=time&&video.currentTime<time+5&&video.readyState>=3;},chapters.chapters[1].time);
    assert.equal(await page.getByRole('group',{name:'Demo chapters'}).getByRole('button').nth(1).getAttribute('aria-current'),'true');
    await page.locator('video').evaluate(video=>video.pause());
    await page.getByRole('button',{name:'02 / Repair & recheck'}).click();assert.equal(await page.locator('#status').textContent(),'NO_VIOLATION_WITHIN_BOUND');
    await page.getByRole('button',{name:'03 / Durable execution'}).click();assert.equal(await page.locator('#artifact').getAttribute('href'),`/evidence.json?v=${revision}`);assert.equal(await page.locator('#screenshot').getAttribute('src'),`/ambiguity.png?v=${revision}`);
    assert.equal(new URL(await page.locator('#full-screenshot').getAttribute('href'),base).pathname,'/ambiguity.png');
    const opened=page.waitForEvent('popup');await page.getByRole('link',{name:'Open current evidence screenshot at full size'}).click();const fullImage=await opened;await fullImage.waitForLoadState();assert.equal(new URL(fullImage.url()).pathname,'/ambiguity.png');await fullImage.close();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
    mkdirSync('submission',{recursive:true});await page.screenshot({path:`submission/${publicCheck?'public':'preview'}-${viewport.width}.png`,fullPage:true});await page.close();
  }
  // Missing assets fail through the response listener; only favicon is optional.
  assert.deepEqual(errors,[]);
  writeFileSync(`submission/${publicCheck?'public':'preview'}-validation.json`,JSON.stringify({at:new Date().toISOString(),base,passed:true,evidenceSha256:digest(downloaded),checks:['allowlisted files only','no operator API','write methods denied',...(publicCheck?['public HTTPS']:['host allowlist']),'video byte range, actual playback and seeking','downloaded evidence matches local artifact','evidence tabs','desktop and mobile no overflow'],viewports:[1440,390]},null,2)+'\n');
  console.log('Preview HTTP and browser gates passed, including versioned assets, active chapters and full-size evidence.');
}finally{await browser.close();}
