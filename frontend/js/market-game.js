import {Client} from './client.js';
import {TetMarket} from './market-scene.js';
import {mountAudio} from './audio.js';
import {marketConfig} from './orders.js';

const $=id=>document.getElementById(id);
const demoGifts=['Rose','Heart','TikTok','Ice Cream','Lollipop','Galaxy'];
const levelNames=['Chợ mới mở','Chợ rộn ràng','Chợ lên đèn','Hội xuân'];
let scene, audio, state, lastReport, guideKey, toastTimer;
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
try {
  scene=new TetMarket($('world'));
} catch (error) {
  $('fatal').hidden=false;
  $('fatal').textContent='Không mở được cảnh 3D: '+error.message;
}

function renderGuide(rules) {
  const key=JSON.stringify([rules.byId,rules.byName]);
  if(key===guideKey) return;
  guideKey=key;
  const root=$('market-gifts');
  root.replaceChildren();
  const entries=new Map();
  for(const name of demoGifts) {
    const item=rules.byName[name.toLowerCase()];
    if(item) entries.set(name,item);
  }
  for(const [name,item] of Object.entries(rules.byName)) {
    if(!Object.keys(marketConfig.byName).includes(name)) entries.set(name,item);
  }
  for(const [id,item] of Object.entries(rules.byId)) entries.set('Quà #'+id,item);
  for(const [name,item] of entries) {
    const product=marketConfig.products[item];
    if(!product) continue;
    const cell=document.createElement('div');
    cell.className='market-gift';
    for(const [tag,label] of [['span',product.icon],['strong',name],['small',product.name]]) {
      const el=document.createElement(tag);
      el.textContent=label;
      cell.append(el);
    }
    root.append(cell);
  }
}

const client=new Client(next=>{
  if(!next.market) return;
  state=next;
  const market=next.market;
  scene?.update(next);
  audio?.update(next);
  renderGuide(market.rules);
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
  const first=market.recent[0];
  if(lastReport&&first&&next.sound) audio?.effect(market.celebrationUntil>next.serverTime?'spotlight':'flowers');
  lastReport=report;
  $('market-feed').replaceChildren();
  for(const order of market.recent.slice(0,3)) {
    const product=marketConfig.products[order.product];
    const li=document.createElement('li');
    li.textContent=product.icon+' '+order.user+' vừa mua '+order.quantity+' '+product.name+'.';
    $('market-feed').append(li);
  }
});
mountAudio().then(player=>{
  audio=player;
  if(state) player.update(state);
}).catch(()=>toast('Không tải được cấu hình âm thanh.'));
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
window.addEventListener('pagehide',()=>{client.close();scene?.dispose();audio?.dispose();},{once:true});
window.__market={get scene(){return scene;},get state(){return state;},get audio(){return audio;}};
