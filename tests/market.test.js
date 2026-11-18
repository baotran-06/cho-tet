import test from 'node:test';
import assert from 'node:assert/strict';
import {World,demoEvent} from '../frontend/js/core.js';
import {giftProduct,marketConfig,orderDuration} from '../frontend/js/orders.js';

test('gift ID takes precedence; unconfigured gift and likes do not place orders',()=>{
  assert.equal(giftProduct({giftId:98,giftName:'Rose'},{...marketConfig,byId:{98:'chung'}}),'chung');
  assert.equal(giftProduct({giftName:'  HOA HỒNG  '}),'mai');
  assert.equal(giftProduct({giftName:'constructor'}),null);
  const world=new World();
  world.enqueue(demoEvent('like'));
  world.enqueue(demoEvent('gift',1,'Unknown'));
  world.tick();
  assert.equal(world.market.unmapped,1);
  assert.equal(world.market.active.length,0);
});

test('orders run one per stall and completed streaks accumulate once across milestones',()=>{
  let now=1;
  const world=new World({},undefined,()=>now);
  const rose=demoEvent('gift',1,'Rose',10);
  for(const event of [rose,rose,demoEvent('gift',1,'Rose'),demoEvent('gift',2,'Heart',2)]) world.enqueue(event);
  world.tick();
  assert.equal(world.market.active.length,2);
  assert.equal(world.market.pending.length,1);
  assert.equal(world.market.total,0);
  now+=orderDuration;
  world.tick();
  assert.equal(world.market.total,12);
  assert.deepEqual(world.market.counts,{mai:10,melon:2});
  assert.equal(world.market.level,1);
  assert.ok(world.market.celebrationUntil>now);
  assert.equal(world.market.active.length,1);
  world.reset('LIVE');
  assert.equal(world.market.total,0);
  assert.equal(world.enqueue(rose),false);
});
