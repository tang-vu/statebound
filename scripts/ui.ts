import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch();
const errors:string[]=[];
mkdirSync('test-results',{recursive:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4381');
  const confirm=page.getByRole('button',{name:'Confirm this mandate'});
  await confirm.waitFor();
  const rect=await confirm.boundingBox();assert.ok(rect&&rect.y+rect.height<=900,'Primary mandate action is above the desktop fold');
  await page.getByRole('button',{name:'Edit JSON'}).click();
  const editor=page.getByRole('textbox',{name:'Plan JSON',exact:true});const original=await editor.inputValue();
  for(const invalid of ['{','{}','null','{"nodes":[{"op":"branch"}]}']){
    await editor.fill(invalid);await page.getByRole('button',{name:'Close JSON'}).click();
    await page.getByText('Invalid plan. Provide a complete typed plan with valid nodes. Your edits are preserved.').waitFor();
    assert.equal(await confirm.isDisabled(),true);await page.getByRole('button',{name:'Edit JSON'}).click();
  }
  await editor.fill(original);await page.getByRole('button',{name:'Close JSON'}).click();
  const budget=page.getByRole('textbox',{name:'Maximum total debit'});
  await budget.fill('-1');assert.equal(await confirm.isDisabled(),true);await budget.fill('20');
  await confirm.click();await page.getByRole('button',{name:'Find a failure'}).click();
  await page.getByRole('heading',{name:'30 USDT can leave a 20 USDT mandate.'}).waitFor({timeout:30000});
  const baseline=page.url();await page.getByRole('button',{name:'Check with guard',exact:true}).click();
  await page.getByRole('heading',{name:'No violation within the checked bound.'}).waitFor({timeout:30000});
  await page.goBack();await page.getByRole('heading',{name:'30 USDT can leave a 20 USDT mandate.'}).waitFor();assert.equal(page.url(),baseline);
  await page.goForward();await page.getByRole('heading',{name:'No violation within the checked bound.'}).waitFor();
  for(const width of [360,390,768,1440]){
    await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:4381');await confirm.waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px initial overflow`);
    if(width<700){
      await confirm.click();await page.getByRole('button',{name:'Find a failure'}).click();
      await page.getByRole('heading',{name:'30 USDT can leave a 20 USDT mandate.'}).waitFor({timeout:30000});
      await page.locator('.timeline-row').first().click();await page.getByRole('button',{name:/Inspect step 01/}).click();
      await page.locator('.knowledge').waitFor({state:'visible'});assert.match(await page.locator('.exposure').innerText(),/15/);
      assert.equal(await page.locator('.center').isVisible(),false);
      await page.screenshot({path:`test-results/ui-inspect-${width}.png`,fullPage:true});
      await page.getByRole('button',{name:'02 Check & repair'}).click();
      await page.getByRole('button',{name:'Apply template repair'}).click();
      await page.getByRole('heading',{name:'No violation within the checked bound.'}).waitFor({timeout:30000});
      assert.match(await page.locator('.outcome').innerText(),/COMPLETE/);
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px result overflow`);
    await page.screenshot({path:`test-results/ui-workbench-${width}.png`,fullPage:true});
  }
  const offline=await browser.newPage();offline.on('pageerror',e=>errors.push(e.message));
  await offline.route('**/api/session',route=>route.abort());await offline.goto('http://127.0.0.1:4381');
  await offline.getByRole('heading',{name:'Connection unavailable.'}).waitFor();
  await offline.unroute('**/api/session');await offline.getByRole('button',{name:'Retry connection'}).click();
  await offline.getByRole('button',{name:'Confirm this mandate'}).waitFor();
  await offline.keyboard.press('Tab');assert.equal(await offline.locator('.skip-link').evaluate(e=>e===document.activeElement),true);
  assert.deepEqual(errors,[]);
  const report={passed:true,viewports:[360,390,768,1440],checks:['desktop action above fold','malformed and incomplete JSON recovery','invalid mandate blocked','Back and Forward restore runs','mobile define/check/inspect/repair','no overflow','connection failure and retry','keyboard entry'],consoleErrors:errors};
  writeFileSync('submission/ui-validation.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
