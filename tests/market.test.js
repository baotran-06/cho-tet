import test from 'node:test';
import assert from 'node:assert/strict';
import {World,demoEvent} from '../frontend/js/core.js';
import {giftProduct,marketConfig,preparationTime,deliveryTime,showTime} from '../frontend/js/orders.js';

test('gift IDs take precedence and all ten named gifts match the approved action table',()=>{
  assert.equal(giftProduct({giftId:5655,giftName:'GG'}),'mai');
  assert.equal(giftProduct({giftName:'  HOA HỒNG  '}),'mai');
  assert.equal(giftProduct({giftName:'constructor'}),null);
  const expected=['lion','lights','pig','pork','lixi','melon','mut','tet','mai','soda'];
  assert.deepEqual(marketConfig.guide.map(gift=>giftProduct({giftName:gift.gift})),expected);
  const world=new World();
  world.enqueue(demoEvent('like'));
  world.enqueue(demoEvent('gift',1,'Unknown'));
  world.tick();
  assert.equal(world.market.unmapped,1);
  assert.equal(world.market.active.length,0);
});

test('one cart, parallel stall preparation and independent effects; only delivered goods count',()=>{
  let now=1;
  const world=new World({},undefined,()=>now);
  const rose=demoEvent('gift',1,'Rose',10);
  for(const event of [rose,rose,demoEvent('gift',1,'Rose'),demoEvent('gift',2,'Peach',2),demoEvent('gift',3,'Bravo!'),demoEvent('gift',3,'Doughnut')]) world.enqueue(event);
  world.tick();
  assert.equal(world.market.active.length,4);
  assert.equal(world.market.pending.length,1);
  now+=preparationTime;
  world.tick();
  assert.deepEqual(world.market.active.filter(order=>order.departure).map(order=>order.product),['mai']);
  now=1+showTime;
  world.tick();
  assert.equal(world.market.recent.length,2);
  assert.equal(world.market.total,0);
  now=1+preparationTime+deliveryTime;
  world.tick();
  assert.equal(world.market.total,10);
  assert.deepEqual(world.market.active.filter(order=>order.departure).map(order=>order.product),['melon']);
  assert.equal(world.market.level,1);
  assert.ok(world.market.celebrationUntil>now);
  now+=deliveryTime*2;
  world.tick();
  now+=deliveryTime;
  world.tick();
  assert.deepEqual(world.market.counts,{mai:11,melon:2});
  world.reset('LIVE');
  assert.equal(world.market.total,0);
  assert.equal(world.enqueue(rose),false);
});
