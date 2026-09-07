import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const base=process.argv[2]??'http://127.0.0.1:4382';
if(!['http://127.0.0.1:4382','https://statebound.tangvu.dev'].includes(base))throw Error('Unsupported gallery target');
const recorded=JSON.parse(readFileSync('preview/replay-gallery.json','utf8'));
const remote=await fetch(`${base}/replay-gallery.json`).then(r=>r.json());assert.deepEqual(remote,recorded);
const browser=await chromium.launch();const errors=[];
try{
  for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('favicon'))errors.push(message.text());});
    await page.goto(`${base}/#lab`);await page.locator('.lab-body').waitFor({state:'visible'});
    assert.equal(await page.locator('.lab-confirmed').innerText(),'0 USDT');assert.equal(await page.locator('.lab-actual').innerText(),'15 USDT');assert.equal(await page.locator('.lab-headroom').innerText(),'5 USDT');
    for(const item of recorded.cases){
      await page.locator(`[data-case="${item.id}"]`).click();
      for(const [index,event] of item.events.entries()){
        assert.equal(await page.locator('.lab-possible').innerText(),`${event.possibleDebit} USDT`);
        assert.equal(await page.locator('.lab-actual').innerText(),`${event.actualDebit} USDT`);
        assert.equal(await page.locator('.lab-confirmed').innerText(),`${event.confirmedDebit} USDT`);
        if(index<item.events.length-1)await page.getByRole('button',{name:'Next replay step'}).click();
      }
      assert.equal(await page.getByRole('button',{name:'Next replay step'}).isDisabled(),true);
    }
    await page.locator('[data-case="blind"]').click();await page.getByRole('button',{name:'Jump to outcome'}).click();
    assert.equal(await page.locator('.lab-status').innerText(),'BUDGET EXCEEDED');assert.equal(await page.locator('.lab-headroom').innerText(),'-10 USDT');
    const slider=page.getByRole('slider',{name:'Execution step'});await slider.focus();await page.keyboard.press('Home');assert.equal(await slider.inputValue(),'1');await page.keyboard.press('ArrowRight');assert.equal(await slider.inputValue(),'2');
    await page.locator('[data-case="repair"]').click();await page.getByRole('button',{name:'Jump to outcome'}).click();assert.equal(await page.locator('.lab-status').innerText(),'COMPLETE');
    const deepLink=page.url();await page.reload();await page.locator('.lab-body').waitFor({state:'visible'});assert.equal(await page.locator('.lab-status').innerText(),'COMPLETE');assert.equal(page.url(),deepLink);
    // Force the accessible fallback instead of relying on browser clipboard permissions.
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(Error('Denied'))},configurable:true}));
    await page.getByRole('button',{name:'Copy this step'}).click();assert.equal(await page.getByRole('textbox',{name:'Link to this replay step'}).inputValue(),deepLink);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('[data-case="unknown"]').click();await page.getByRole('button',{name:'Jump to outcome'}).click();assert.equal(await page.locator('.lab-status').innerText(),'UNRESOLVED');assert.equal(await page.locator('.lab-possible').innerText(),'15 USDT');
    await page.locator('#lab').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/gallery-${base.startsWith('https')?'public':'local'}-${width}.png`,fullPage:true});
    await page.close();
  }
  const failed=await browser.newPage();await failed.route('**/replay-gallery.json*',route=>route.abort());await failed.goto(base);await failed.getByText('The interactive traces could not load.',{exact:false}).waitFor();assert.equal(await failed.locator('video').count(),1);await failed.close();
  assert.deepEqual(errors,[]);
  const report={passed:true,base,manifest:recorded.manifest,viewports:[390,1440],checks:['public artifact matches locally regenerated traces','all steps and monetary values match four cases','guard/refused versus repair/complete versus unresolved','keyboard stepping','deep-link reload','clipboard fallback','no overflow','load failure preserves recording'],consoleErrors:errors};
  writeFileSync(`submission/gallery-${base.startsWith('https')?'public':'local'}-validation.json`,JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
