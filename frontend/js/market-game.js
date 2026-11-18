import {Client} from './client.js';
import {BenMai} from './ben-mai-scene.js';
import {marketConfig} from './orders.js';

const $=id=>document.getElementById(id);
const demoGifts=marketConfig.guide.map(gift=>gift.gift);
const levelNames=['Chợ mới mở','Chợ rộn ràng','Chợ lên đèn','Hội xuân'];
let scene, state, lastReport, noticeId, toastTimer;
const statuses={
  connected:'Đang nhận sự kiện TikTok LIVE', 'awaiting-event':'Chờ sự kiện LIVE thật',
  connecting:'Đang kết nối', reconnecting:'Đang kết nối lại', ended:'LIVE đã kết thúc',
  error:'Kết nối lỗi · xem trang điều khiển', disconnected:'Chưa kết nối TikTok',
  'demo-local':'DEMO · Đơn hàng mô phỏng'
};
function toast(message) {
  $('toast').textContent=message;
  $('toast').hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{$('toast').hidden=true;},4000);
}

const cards=new Map();
const labels=new Map(marketConfig.guide.map(gift=>[gift.product,gift]));
for(const gift of marketConfig.guide) {
  const cell=document.createElement('div');
  cell.className='market-gift';
  const icon=document.createElement('img');
  icon.src='./assets/gifts/'+gift.image+'.webp';
  icon.alt='';
  const description=document.createElement('div');
  const name=document.createElement('span');
  name.textContent=gift.label;
  const effect=document.createElement('strong');
  effect.textContent=gift.effect;
  description.append(name,effect);
  cell.append(icon,description);
  $('market-gifts').append(cell);
  cards.set(gift.product,cell);
}

const client=new Client(next=>{
  if(!next.market) return;
  state=next;
  const market=next.market;
  scene?.update(next);
  const notice=market.notices[0];
  if(notice && notice.id!==noticeId) {
    noticeId=notice.id;
    const gift=labels.get(notice.product);
    if(gift) {
      for(const card of cards.values()) card.classList.remove('selected');
      cards.get(notice.product)?.classList.add('selected');
      toast(notice.user+' tặng '+gift.label+' · '+gift.effect+(notice.quantity>1?' ×'+notice.quantity:''));
    }
  }
  if(!notice && noticeId) {
    noticeId=null;
    for(const card of cards.values()) card.classList.remove('selected');
  }
  $('mode-label').textContent=next.mode==='LIVE'?'TikTok LIVE':'DEMO · Mô phỏng';
  $('connection-label').textContent=next.mode==='DEMO'?statuses['demo-local']:(statuses[next.connection]??'Chờ kết nối');
  $('market-level').textContent=levelNames[market.level]??levelNames.at(-1);
  $('market-total').textContent=market.total+' món đã giao';
  $('market-progress').max=market.target??marketConfig.milestones.at(-1);
  $('market-progress').value=market.total;
  $('market-queue').textContent=market.active.length+' đang giao · '+market.pending+' đang chờ'+(market.unmapped?' · '+market.unmapped+' quà chưa khớp':'')+(market.dropped?' · '+market.dropped+' đơn quá tải':'');
  $('welcome-demo').hidden=next.mode!=='DEMO';
  const report=next.mode+':'+(market.recent[0]?.id??'');
  if(lastReport===report) return;
  lastReport=report;
  $('market-feed').replaceChildren();
  for(const order of market.recent.slice(0,3)) {
    const product=marketConfig.products[order.product];
    const li=document.createElement('li');
    li.textContent=order.show?order.user+' · '+labels.get(order.product)?.effect:order.user+' đã gửi '+order.quantity+' '+product.name+' xuống ghe.';
    $('market-feed').append(li);
  }
});
client.ready.then(()=>{
try {
  scene=new BenMai($('world'));
  if(state) scene.update(state);
} catch (error) {
  $('fatal').hidden=false;
  $('fatal').textContent='Không mở được cảnh 3D: '+error.message;
}

});
let demoIndex=0;
$('welcome-demo').onclick=async()=>{
  try {
    const giftName=demoGifts[demoIndex++%demoGifts.length];
    await client.command('demo',{type:'gift',giftName,count:1});
  } catch(error) {
    toast(error.message+' Mở Điều khiển để thử quà.');
  }
};
$('fullscreen').onclick=async()=>{
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await $('game').requestFullscreen();
  } catch {
    toast('Trình duyệt chưa cho phép toàn màn hình.');
  }
};
window.addEventListener('pagehide',()=>{client.close();scene?.dispose();},{once:true});
window.__market={get scene(){return scene;},get state(){return state;}};
