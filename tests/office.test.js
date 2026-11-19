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
