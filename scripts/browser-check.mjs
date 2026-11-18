import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createApp} from '../bridge/server.js';
import {melodyWav} from '../frontend/js/audio.js';

const app=createApp();
let clock=Date.now();
app.world.now=()=>clock;
await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+app.server.address().port;
let browser;
try {
  browser=await chromium.launch({executablePath:process.env.XOM_TEST_CHROMIUM,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:540,height:960}});
  const errors=[];
  page.on('pageerror',error=>{errors.push(error.message);console.error(error.stack);});
  await page.goto(origin+'/admin');
  await page.click('#demo-mode');
  await page.setInputFiles('#music-files',{name:'Bến Mai thử.wav',mimeType:'audio/wav',buffer:Buffer.from(melodyWav())});
  assert.equal(await page.locator('#music-list option').filter({hasText:'Bến Mai thử.wav'}).count(),1);
  await page.selectOption('#music-list',{label:'Bến Mai thử.wav'});
  await page.check('#music-loop');
  await page.click('#audio-start');
  await page.waitForFunction(()=>document.getElementById('audio-meter').textContent.includes('có tín hiệu'));
  await page.goto(origin);
  await page.waitForFunction(()=>window.__market?.scene && __market.state?.connection==='disconnected');
  assert.equal(await page.locator('#fatal').isHidden(),true);
  await page.click('#game-music-toggle');
  await page.setInputFiles('#game-music-files',{name:'Nhạc DEMO.wav',mimeType:'audio/wav',buffer:Buffer.from(melodyWav())});
  assert.equal(await page.locator('#game-music-list option').textContent(),'Nhạc DEMO.wav');
  await page.waitForFunction(()=>document.querySelector('#game-music-audio').readyState>=2);
  await page.evaluate(()=>document.querySelector('#game-music-audio').play());
  await page.waitForFunction(()=>document.querySelector('#game-music-audio').currentTime>0);
  await page.locator('#game-music-volume').focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#game-music-audio').evaluate(audio=>audio.volume),1);
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#game-music-audio').evaluate(audio=>audio.volume),0);
  await page.evaluate(()=>document.querySelector('#game-music-audio').pause());
  await page.click('#game-music-toggle');
  assert.equal(await page.locator('#game-music').isHidden(),true);

  assert.equal(await page.evaluate(()=>__market.scene.vendors.length),4);
  assert.equal(await page.evaluate(()=>[...__market.scene.vendors,...__market.scene.buyers,__market.scene.courier].every(actor=>actor.customMarketNpc)),true);
  assert.equal(await page.locator('.market-gift').count(),10);
  assert.equal(await page.locator('.market-gift img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),true);
  assert.equal(await page.evaluate(()=>document.fonts.check('700 24px "Be Vietnam Pro"','BẾN MAI')),true);
  assert.equal(await page.locator('.market-brand h1').textContent(),'Bến Mai');
  assert.ok(await page.evaluate(()=>__market.scene.buyers.filter(npc=>npc.group.visible).length>=8));
  await page.waitForFunction(()=>__market.scene.buyers.some(npc=>npc.group.visible&&npc.purchase.visible));
  const shoppers=await page.evaluate(()=>__market.scene.buyers.slice(0,2).map(npc=>npc.group.position.toArray()));
  assert.ok(shoppers[0][0]<-3 && shoppers[1][0]>3);
  await page.waitForFunction(start=>__market.scene.buyers.slice(0,2).every((npc,index)=>
    npc.group.visible && npc.group.position.distanceTo({x:start[index][0],y:start[index][1],z:start[index][2]})>.65
    && Math.abs(npc.group.position.x)>3),shoppers);
  const gift=async(giftName,count=1)=>{
    const response=await page.request.post(origin+'/api/demo',{headers:{Origin:origin},data:{type:'gift',giftName,count}});
    assert.ok(response.ok());
  };
  await gift('Rose',10);
  await page.waitForFunction(()=>__market.scene.jobs.size===1);
  assert.match(await page.locator('.market-gift.selected').textContent(),/Hoa hồng/);
  clock+=2500;
  await page.waitForFunction(()=>__market.state.market.active[0]?.departure);
  clock+=2400;
  await gift('Doughnut');
  await gift('Bravo!');
  await gift('Finger Heart');
  await page.waitForFunction(()=>__market.scene.lion.visible && __market.state.market.active.length===4);
  assert.equal(await page.evaluate(()=>__market.scene.vendors.filter(v=>v.group.position.x<0).length),2);
  const start=await page.evaluate(()=>__market.scene.boat.position.toArray());
  clock+=2100;
  await page.waitForFunction(position=>JSON.stringify(__market.scene.boat.position.toArray())!==JSON.stringify(position),start);
  await page.waitForFunction(()=>__market.scene.lamps.every(lamp=>lamp.shell.material.emissiveIntensity>1));
  await page.waitForFunction(()=>__market.scene.cargo.children.length===1);
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/ben-mai-doc.png'});
  clock+=4600;
  await page.waitForFunction(()=>__market.state.market.total===10 && __market.scene.jobs.size===0);
  assert.match(await page.locator('#market-feed').textContent(),/chậu hoa mai/);
  assert.equal(await page.evaluate(()=>__market.state.market.level),1);
  assert.deepEqual(errors,[]);
  console.log('Verified 3D floating market, gift artwork, parallel delivery/effects, and local music playback.');
} finally {
  await browser?.close();
  await app.close();
}
