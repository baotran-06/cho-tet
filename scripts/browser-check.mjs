import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createApp} from '../bridge/server.js';

const app=createApp();
let clock=Date.now();
app.world.now=()=>clock;
await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+app.server.address().port;
let browser;
try {
  browser=await chromium.launch({executablePath:process.env.XOM_TEST_CHROMIUM,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const errors=[];
  page.on('pageerror',error=>{errors.push(error.message);console.error(error.stack);});
  page.on('console',message=>{if(message.type()==='error')console.error(message.text());});
  await page.goto(origin+'/admin');
  await page.click('#demo-mode');
  await page.goto(origin);
  await page.waitForFunction(()=>window.__market?.state?.mode==='DEMO' && __market.state.connection==='disconnected');
  assert.equal(await page.locator('#fatal').isHidden(),true);
  assert.equal(await page.evaluate(()=>__market.scene.vendors.length),4);
  const first=await page.evaluate(()=>__market.scene.anonymous[0].group.position.toArray());
  await page.waitForFunction(position=>JSON.stringify(__market.scene.anonymous[0].group.position.toArray())!==JSON.stringify(position),first);
  const response=await page.request.post(origin+'/api/demo',{headers:{Origin:origin},data:{type:'gift',giftName:'Rose',count:10}});
  assert.ok(response.ok());
  await page.waitForFunction(()=>__market.state.market.active.length===1);
  await page.waitForFunction(()=>__market.scene.deliveries.size===1);
  clock+=3750;
  await page.waitForFunction(()=>{
    const job=[...__market.scene.deliveries.values()][0];
    return job?.item.position.y>.8 && job?.npc.arms[0].rotation.x===-1.2;
  });
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/cho-tet-dang-giao.png'});
  clock+=4600;
  await page.waitForFunction(()=>__market.state.market.total===10);
  assert.match(await page.locator('#market-feed').textContent(),/chậu hoa mai/);
  assert.equal(await page.evaluate(()=>__market.state.market.level),1);
  await page.waitForFunction(()=>__market.scene.deliveries.size===0 && __market.scene.effect.visible);
  await page.screenshot({path:'artifacts/cho-tet-len-moc.png'});
  assert.deepEqual(errors,[]);
  console.log('Verified WebGL market, background motion, real HTTP/WebSocket demo order, 3D pickup, delivery, progress and celebration.');
} finally {
  await browser?.close();
  await app.close();
}
