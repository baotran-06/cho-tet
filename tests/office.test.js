import test from 'node:test';
import assert from 'node:assert/strict';
import {Office,officeGift,officeConfig} from '../frontend/js/office-state.js';
import {World,demoEvent} from '../frontend/js/core.js';

const event=(giftName,name='An',id=crypto.randomUUID())=>({...demoEvent('gift',1,giftName),id,user:{id:name,name}});
test('nine distinct office gifts, IDs override names, prototype names rejected',()=>{
  const expected=['fire','wedding','bedroom','lieu','replaceCeo','replaceSecretary','claimCeo','claimSecretary','kiss'];
  assert.deepEqual(officeConfig.guide.map(g=>officeGift({giftName:g.gift})),expected);
  assert.equal(officeGift({giftName:'constructor'}),null);
  assert.equal(officeGift({giftName:'Rose',giftId:'123'},{123:'fire'}),'fire');
});
test('real receipt grants exactly 3 minutes without a visible timer and duplicate messages never renew',()=>{
  let now=1000;const world=new World({},undefined,()=>now);
  const gift=event('Okay');
  world.enqueue(gift);world.tick();
  assert.equal(world.office.ceo.name,'An');
  assert.equal(world.office.ceo.until,181000);
  now+=2000;world.enqueue(gift);world.tick();assert.equal(world.office.ceo.until,181000);
  now=181000;world.tick();assert.equal(world.office.ceo.id,null);
  world.reset('LIVE');assert.equal(world.enqueue(gift),false);
});
test('bedroom is interrupted by replacement, fire removes secretary and a later refill unblocks waiting scenes',()=>{
  const office=new Office();let now=1000;
  office.accept(event('Doughnut'),now);office.tick(now);
  assert.equal(office.active.end-now,180000);
  office.accept(event('Shamrock'),now+=1000);office.tick(now);
  assert.equal(office.active.key,'replaceCeo');assert.equal(office.ceo.look,1);
  assert.equal(office.recent[0].interrupted,true);
  office.finish(now+=9000);office.accept(event('Paper Crane'),now);office.tick(now);
  office.tick(office.active.end);
  assert.equal(office.secretary.present,false);
  office.accept(event('Rose'),now+=20000);office.tick(now);assert.equal(office.active,null);
  office.accept(event('Lucky Pig'),now);office.tick(now);
  assert.equal(office.active.key,'replaceSecretary');assert.equal(office.secretary.present,true);
  office.finish(now+=10000);office.tick(now);assert.equal(office.active.key,'kiss');
});
test('queue stays bounded under gift bursts, unknown gifts have no effect',()=>{
  const office=new Office();
  for(let i=0;i<5000;i++)office.accept(event('Rose'),1000);
  assert.equal(office.pending.length,120);assert.equal(office.dropped,4880);
  office.accept(event('not a gift'),1000);assert.equal(office.unmapped,1);
});

test('one viewer can hold only one leadership role, switching releases the other role',()=>{
 const office=new Office();office.accept(event('Okay','Minh'),1000);
 office.accept(event('Finger Heart','Minh'),2000);
 assert.equal(office.ceo.id,null);assert.equal(office.secretary.id,'Minh');
 office.accept(event('Okay','Minh'),3000);
 assert.equal(office.ceo.id,'Minh');assert.equal(office.secretary.id,null);
 assert.equal(office.ceo.until,183000);
});

test('occupied CEO rejects all claim gifts without takeover, renewal, queue or new scene; vacancy reopens at 3 minutes',()=>{
 const office=new Office();office.accept(event('Okay','An'),1000);office.tick(1000);
 const scene=office.active.id,until=office.ceo.until;
 assert.equal(office.accept(event('Okay','Bình'),2000),false);
 assert.equal(office.accept(event('Okay','An'),3000),false);
 assert.equal(office.ceo.id,'An');assert.equal(office.ceo.until,until);assert.equal(office.active.id,scene);assert.equal(office.pending.length,0);assert.equal(office.snapshot().canClaimCeo,false);
 assert.equal(office.accept(event('Okay','Bình'),181000),true);
 assert.equal(office.ceo.id,'Bình');assert.equal(office.ceo.until,361000);
});
test('CEO replacement takes over for three minutes and restarts the active wedding without an office intermission',()=>{
 const office=new Office();office.accept(event('Okay','An'),1000);office.tick(1000);office.finish(1001);
 office.accept(event('Finger Heart','Hà'),1002);office.tick(1002);office.finish(1003);
 office.accept(event('Bouquet Flower','Khách'),2000);office.tick(2000);
 const first={...office.active};assert.equal(first.key,'wedding');
 office.accept(event('Shamrock','Minh'),5000);
 assert.equal(office.ceo.id,'Minh');assert.equal(office.ceo.until,185000);assert.equal(office.secretary.id,'Hà');
 assert.equal(office.active.key,'wedding');assert.equal(office.active.started,5000);assert.notEqual(office.active.id,first.id);assert.equal(office.active.weddingId,first.weddingId);assert.equal(office.active.restartCount,1);assert.equal(office.pending.length,0);
 const restarted={...office.active};
 assert.equal(office.accept(event('Okay','Người khác'),6000),false);assert.equal(office.ceo.id,'Minh');assert.equal(office.active.id,restarted.id);
 office.tick(first.end+1);assert.equal(office.active.key,'wedding');assert.equal(office.active.id,restarted.id);
 office.tick(restarted.end);assert.equal(office.active,null);assert.equal(office.recent.filter(s=>s.key==='wedding').length,1);
});
test('duplicate replacement events cannot restart a wedding twice or renew the new groom',()=>{
 let now=1000;const world=new World({},undefined,()=>now);
 world.enqueue(event('Bouquet Flower'));world.tick();
 const replacement=event('Shamrock','Minh');now=2000;world.enqueue(replacement);world.tick();const started=world.office.active.started,until=world.office.ceo.until;
 now=3000;world.enqueue(replacement);world.tick();assert.equal(world.office.active.started,started);assert.equal(world.office.ceo.until,until);assert.equal(world.office.active.restartCount,1);
});

test('a valid vacant-role claim during a wedding joins the ceremony instead of queuing an office intro',()=>{
 const office=new Office();office.accept(event('Bouquet Flower'),1000);office.tick(1000);
 office.accept(event('Okay','An'),2000);
 assert.equal(office.ceo.id,'An');assert.equal(office.active.key,'wedding');assert.equal(office.active.started,2000);assert.equal(office.pending.length,0);
 office.accept(event('Shamrock','Minh'),3000);const end=office.active.end;
 office.tick(end);assert.equal(office.active,null);assert.equal(office.ceo.id,'Minh');assert.equal(office.pending.length,0);
});
test('a replaced viewer cannot announce a stale queued CEO claim after a long scene',()=>{
 const office=new Office();office.accept(event('Doughnut'),1000);office.tick(1000);
 office.accept(event('Okay','An'),2000);
 office.accept(event('Shamrock','Minh'),3000);office.tick(3000);
 assert.equal(office.ceo.id,'Minh');assert.equal(office.active.key,'replaceCeo');
 office.finish(4000);office.tick(4000);assert.equal(office.active,null);assert.equal(office.pending.length,0);
});
