/* Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/stickers.json')));
const mime = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer((req,res) => {
  if (!req.url.startsWith('/repository-name/')) {res.writeHead(404);res.end();return;}
  const local = decodeURIComponent(req.url.split('?')[0].slice('/repository-name/'.length)) || 'index.html';
  const file = path.resolve(root,local);
  if (!file.startsWith(root + path.sep)) {res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,body)=> {res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':body);});
});
(async () => {
  await new Promise(resolve=>server.listen(8766,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto('http://127.0.0.1:8766/repository-name/');
  await page.waitForFunction(()=>document.querySelectorAll('.sticker').length===136);
  assert.equal(await page.locator('.pack-filter').count(),4);
  for (const pack of data.packs) {
    await page.locator(`.pack-filter[data-pack="${pack.id}"]`).click();
    assert.equal(await page.locator('.sticker').count(),pack.count);
    await page.locator('#search').fill('hug');
    assert.ok(await page.locator('.sticker').count()>0);
    assert.ok((await page.locator('.sticker').evaluateAll(nodes=>nodes.map(n=>n.dataset.pack))).every(id=>id===pack.id));
    await page.locator('#search').fill('');
  }
  await page.locator('.pack-filter[data-pack=all]').click();
  for (const query of ['hug','hugging','kiss','kissing','❤️','😭','sleeping','coffee','обійми']) {
    await page.locator('#search').fill(query); assert.ok(await page.locator('.sticker').count()>0,query);
  }
  // Every emoji assigned to every sticker must retrieve that sticker.
  for (const emoji of new Set(data.stickers.flatMap(s=>s.emoji))) {
    await page.locator('#search').fill(emoji);
    const ids = new Set(await page.locator('.sticker').evaluateAll(nodes=>nodes.map(n=>n.dataset.id)));
    for (const sticker of data.stickers.filter(s=>s.emoji.includes(emoji))) assert.ok(ids.has(sticker.id),`${emoji} must match ${sticker.id}`);
  }
  await page.locator('#search').fill('zzzzzz-no-matches'); assert.ok(await page.locator('#empty').isVisible());
  await page.locator('#reset').click(); assert.equal(await page.locator('.sticker').count(),136);
  for (const width of [360,375,390,412,430,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No overflow at ${width}`);
    await page.locator('.sticker').first().click();
    assert.ok(await page.locator('#preview').isVisible());
    assert.ok(await page.locator('#preview-media img').evaluate(img=>img.complete&&img.naturalWidth>0));
    await page.locator('#next').click(); assert.equal(await page.locator('#preview-position').textContent(),'2 / 136');
    await page.keyboard.press('Escape'); assert.ok(!(await page.locator('#preview').isVisible()));
    await page.waitForFunction(()=>document.querySelector('.sticker')===document.activeElement);
  }
  await page.setViewportSize({width:812,height:375});
  await page.locator('.sticker').first().click();
  await page.locator('#close-preview').click();
  assert.ok(!(await page.locator('#preview').isVisible()));
  // Test every original asset, independent of image lazy loading.
  for (const sticker of data.stickers) {
    const response=await page.request.get(`http://127.0.0.1:8766/repository-name/${sticker.file}`); assert.equal(response.status(),200);
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{document.activeElement.blur();window.scrollTo({top:0,behavior:'instant'});});
  await page.screenshot({path:'/tmp/sticker-mobile.png',fullPage:false});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'/tmp/sticker-desktop.png',fullPage:false});
  assert.deepEqual(errors,[]);
  console.log('PASS: 136 assets, 3 packs, filters, keyword variants, every assigned emoji, empty/reset, preview, focus return, 8 viewport widths, landscape, repository subpath, no browser errors.');
  await browser.close(); server.close();
})().catch(error=>{console.error(error);server.close();process.exit(1);});
