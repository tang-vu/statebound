import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {get} from 'node:http';
const base='http://127.0.0.1:4382';
assert.equal((await fetch(`${base}/healthz`).then(r=>r.json())).writes,false);
for(const path of ['/api/session','/api/runs','/.env','/.runtime/statebound.db','/scripts/preview.mjs','/../package.json'])assert.equal((await fetch(`${base}${path}`)).status,404,path);
const hostStatus=host=>new Promise((resolve,reject)=>get(base,{headers:{Host:host}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject));
assert.equal(await hostStatus('evil.example'),403);
assert.equal(await hostStatus('statebound.tangvu.dev'),200);
assert.equal((await fetch(`${base}/api/runs`,{method:'POST',body:'{}'})).status,405);
const ranged=await fetch(`${base}/demo.mp4`,{headers:{Range:'bytes=0-1023'}});assert.equal(ranged.status,206);assert.equal((await ranged.arrayBuffer()).byteLength,1024);
const browser=await chromium.launch();const errors=[];
try {
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
    page.on('response',response=>{if(response.status()>=400&&new URL(response.url()).pathname!=='/favicon.ico')errors.push(`${response.status()} ${new URL(response.url()).pathname}`);});
    page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('404 (Not Found)'))errors.push(message.text());});
    await page.goto(base);await page.locator('video').evaluate(async video=>{await video.play();});
    await page.waitForFunction(()=>document.querySelector('video').currentTime>0);
    await page.getByRole('button',{name:'02 / Repair & recheck'}).click();assert.equal(await page.locator('#status').textContent(),'NO_VIOLATION_WITHIN_BOUND');
    await page.getByRole('button',{name:'03 / Durable execution'}).click();assert.equal(await page.locator('#artifact').getAttribute('href'),'/evidence.json');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
    mkdirSync('submission',{recursive:true});await page.screenshot({path:`submission/preview-${viewport.width}.png`,fullPage:true});await page.close();
  }
  // Missing assets fail through the response listener; only favicon is optional.
  assert.deepEqual(errors,[]);
  writeFileSync('submission/preview-validation.json',JSON.stringify({at:new Date().toISOString(),passed:true,checks:['allowlisted files only','no operator API','write methods denied','host allowlist','video byte range and actual playback','evidence tabs','desktop and mobile no overflow'],viewports:[1440,390]},null,2)+'\n');
  console.log('Preview HTTP and browser gates passed.');
}finally{await browser.close();}
