import test from 'node:test';import assert from 'node:assert/strict';import {createApp} from '../bridge/server.js';
test('HTTP frontend, WebSocket and authenticated dashboard commands work together',async()=>{const app=createApp({initialMode:'DEMO'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const port=app.server.address().port,origin=`http://127.0.0.1:${port}`;try{
 const page=await fetch(origin+'/admin');assert.equal(page.status,200);const cookie=page.headers.get('set-cookie').split(';')[0];const post=(path,body)=>fetch(origin+'/api/'+path,{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await fetch(origin+'/api/health').then(r=>r.json())).service,'wedding-online-live');
 assert.equal((await fetch(origin+'/js/scene.js')).status,200);
 assert.equal((await fetch(origin+'/api/demo',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,403);
 const ws=new WebSocket(origin.replace('http:','ws:')+'/ws');const snapshot=await new Promise((r,j)=>{ws.onmessage=e=>r(JSON.parse(e.data));ws.onerror=j;});assert.ok(snapshot.wedding);ws.close();
 assert.equal((await post('demo',{type:'join',amount:12})).status,200);app.world.tick();assert.equal(app.world.users.size,12);
 assert.equal((await post('wedding-rules',{rules:{123:'wedding'}})).status,200);assert.equal(app.world.wedding.rules[123],'wedding');
 assert.equal((await post('mode',{mode:'LIVE'})).status,200);assert.equal((await post('demo',{type:'gift',giftName:'Rose'})).status,409);
 assert.equal((await fetch(origin+'/api/state').then(r=>r.json())).liveEvidence.verified,false);
 }finally{await app.close();}});
