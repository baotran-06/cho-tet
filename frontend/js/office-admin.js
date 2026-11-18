import {Client} from './client.js';
import {officeConfig} from './office-state.js';
const $=id=>document.getElementById(id);
let state,historyKey,trackKey='',rulesInitialized=false;
const statuses={connected:'Đã nhận sự kiện TikTok LIVE thật', 'awaiting-event':'Đã mở kết nối, đang chờ sự kiện TikTok thật',connecting:'Đang kết nối…',reconnecting:'Đang kết nối lại…',disconnected:'Chưa kết nối',ended:'LIVE đã kết thúc',error:'Lỗi nguồn TikTok, xem nhật ký', 'demo-local':'DEMO trên trình duyệt'};
function error(message){$('error').hidden=false;$('error').textContent=message;}
async function command(path,body={}){
  try{$('error').hidden=true;await client.command(path,body);return true;}catch(e){error(e.message);return false;}
}
const client=new Client(next=>{
  state=next;const office=next.office;if(!office){error('Cầu nối đang chạy bản cũ. Dừng bản cũ rồi mở START-TONG-TAI.bat.');return;}
  if(next.rememberedUsername&&!$('username').value)$('username').value=next.rememberedUsername;
  const verified=next.liveEvidence?.verified;
  $('mode-chip').textContent=next.mode==='DEMO'?'DEMO · dữ liệu mô phỏng':verified?'LIVE · đã nhận sự kiện thật':'LIVE · chưa xác minh sự kiện thật';
  $('connection').textContent=(statuses[next.connection]??next.connection)+(verified?' · '+next.liveEvidence.receivedEvents+' sự kiện':'')+(next.liveEvidence?.lastError?' · '+next.liveEvidence.lastError.summary:'');
  $('queue').textContent=office.pending+' cảnh đang chờ · '+office.total+' đã hoàn tất · '+office.unmapped+' quà chưa khớp'+(office.waitingForSecretary?' · đang chờ thư ký trở lại':'');
  $('roles').textContent='Tổng tài: '+office.ceo.name+' · Thư ký: '+(office.secretary.present?office.secretary.name:'Vắng mặt');
  for(const button of document.querySelectorAll('[data-gift]'))button.disabled=next.mode!=='DEMO';
  for(const bus of ['music','voice','sfx']){
    const value=Math.round((office.audio[bus+'Volume']??.5)*100);
    if(document.activeElement!==$(bus+'-volume'))$(bus+'-volume').value=value;
    $(bus+'-value').value=value+'%';$(bus+'-enabled').checked=office.audio[bus+'Enabled'];
  }
  const tracks=office.tracks??[];
  const key=tracks.map(t=>t.id).join();
  if(key!==trackKey){trackKey=key;$('music-list').replaceChildren(new Option('Nhạc chill có sẵn',''));for(const t of tracks)$('music-list').add(new Option(t.name,t.id));}
  if(document.activeElement!==$('music-list'))$('music-list').value=office.audio.trackId??'';
  if(!rulesInitialized){
    rulesInitialized=true;
    for(const [id,key] of Object.entries(office.rules)){const field=document.querySelector('[data-rule="'+key+'"]');if(field)field.value=[field.value,id].filter(Boolean).join(', ');}
  }
  const eventKey=next.mode+':'+next.history[0]?.id;
  if(eventKey!==historyKey){
    historyKey=eventKey;$('events').replaceChildren();
    for(const event of next.history.slice(0,40)){
      const row=document.createElement('div');row.className='event';
      row.textContent=event.user.name+' · '+event.type+(event.type==='gift'?' · '+event.giftName+' ×'+event.count+' · ID '+(event.giftId||'DEMO'):'');
      const badge=document.createElement('small');badge.textContent=event.source;row.append(badge);$('events').append(row);
    }
  }
});
client.ready.then(()=>{$('bridge-help').textContent=client.isLocal?'Cầu nối local · '+location.origin:'Trang web DEMO. Nhận quà thật bằng START-TONG-TAI.bat và http://127.0.0.1:3210/admin.';});
for(const gift of officeConfig.guide){
  const button=document.createElement('button');button.dataset.gift=gift.key;
  const image=new Image();image.src='assets/gifts/'+gift.icon+'.webp';image.alt='';
  const text=document.createElement('span');text.textContent=gift.effect;
  const small=document.createElement('small');small.textContent=gift.label;text.append(small);button.append(image,text);
  button.onclick=()=>command('demo',{type:'gift',giftName:gift.gift,viewer:1,name:$('demo-name').value.trim()||'Khách DEMO',count:Math.min(99999,Math.max(1,Number($('count').value)||1))});
  $('demo-gifts').append(button);
  const row=document.createElement('label');row.className='gift-rule';row.append(document.createTextNode(gift.label+' → '+gift.effect));
  const field=document.createElement('input');field.dataset.rule=gift.key;field.placeholder='ID, ID khác (nếu có)';row.append(field);$('gift-rules').append(row);
}
$('connect-form').onsubmit=event=>{event.preventDefault();void command('connect',{username:$('username').value.trim(),remember:$('remember-live').checked});};
$('disconnect').onclick=()=>command('disconnect');
$('restart').onclick=()=>command('restart');
$('demo-mode').onclick=()=>command('mode',{mode:'DEMO'});
$('live-mode').onclick=()=>command('mode',{mode:'LIVE'});
$('skip').onclick=()=>command('office-skip');
$('save-rules').onclick=async()=>{
  const rules={};
  for(const input of document.querySelectorAll('[data-rule]')){
    for(const id of input.value.split(',').map(s=>s.trim()).filter(Boolean)){
      if(!/^\d{1,25}$/.test(id)){error('Gift ID chỉ chứa chữ số.');return;}
      if(rules[id]){error('Một Gift ID đang gắn cho nhiều hiệu ứng.');return;}
      rules[id]=input.dataset.rule;
    }
  }
  if(await command('office-rules',{rules}))$('rules-status').textContent='Đã lưu quy đổi cho phiên cầu nối hiện tại.';
};
let audioTimer;
for(const bus of ['music','voice','sfx']){
  $(bus+'-volume').oninput=()=>{
    $(bus+'-value').value=$(bus+'-volume').value+'%';
    clearTimeout(audioTimer);
    audioTimer=setTimeout(()=>command('office-audio',Object.fromEntries(['music','voice','sfx'].map(b=>[b+'Volume',Number($(b+'-volume').value)/100]))),90);
  };
  $(bus+'-enabled').onchange=()=>command('office-audio',{[bus+'Enabled']:$(bus+'-enabled').checked});
}
$('music-play').onclick=()=>command('office-audio',{paused:!state?.office?.audio?.paused});
$('music-list').onchange=()=>command('office-audio',{trackId:$('music-list').value||null,paused:false});
function advance(direction){
  const options=[...$('music-list').options],current=$('music-list').selectedIndex;
  const next=(current+direction+options.length)%options.length;
  void command('office-audio',{trackId:options[next].value||null,paused:false});
}
$('music-next').onclick=()=>advance(1);$('music-prev').onclick=()=>advance(-1);
$('music-remove').onclick=()=>{const id=$('music-list').value;if(id)void command('music-remove',{id});};
$('music-files').onchange=async()=>{
  const files=[...$('music-files').files];$('music-files').value='';
  if(!client.isLocal){error('Lưu playlist trên máy bằng bản Windows tại 127.0.0.1:3210/admin.');return;}
  for(const file of files){
    if(!/\.(mp3|wav)$/i.test(file.name)||!file.size||file.size>30*1024*1024){error('Chọn MP3/WAV dưới 30 MB.');continue;}
    $('audio-status').textContent='Đang lưu '+file.name;
    try{
      const response=await fetch('/api/music',{method:'POST',headers:{'Content-Type':/\.mp3$/i.test(file.name)?'audio/mpeg':'audio/wav','X-Track-Name':encodeURIComponent(file.name)},body:file});
      const result=await response.json();if(!response.ok)throw Error(result.error);
      $('audio-status').textContent='Đã lưu '+file.name+' · chọn bài trong playlist để phát.';
    }catch(e){error(e.message);}
  }
};
$('logs-refresh').onclick=async()=>{
  if(!client.isLocal){error('Nhật ký nguồn TikTok có ở bản Windows.');return;}
  try{const response=await fetch('/api/state');const data=await response.json();$('logs').replaceChildren();
    for(const log of data.logs??[]){const row=document.createElement('p');row.textContent=new Date(log.at).toLocaleTimeString('vi-VN')+' · '+log.message;$('logs').append(row);}
  }catch(e){error(e.message);}
};
window.addEventListener('pagehide',()=>{clearTimeout(audioTimer);client.close();},{once:true});
window.__control={client,get state(){return state;}};
