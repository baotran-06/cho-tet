import {Client} from './client.js';
import {officeConfig} from './office-state.js';
import {OfficeAudio} from './office-audio.js';
import dialogue from '../config/voices.json' with {type:'json'};

const $=id=>document.getElementById(id);
const actors={ceo:$('ceo'),secretary:$('secretary'),lieu:$('lieu')};
const names={ceo:'Tổng tài',secretary:'Thư ký',lieu:'Liễu Như Yên'};
const audio=new OfficeAudio(message=>{$('audio-start').textContent=message;});
let state=null,activeId=null,frame=0,scene=null,requesting=false;
const cells=new Map();
for(const gift of officeConfig.guide){
  const button=document.createElement('button');
  button.className='gift';button.type='button';
  button.setAttribute('aria-label',gift.label+' · '+gift.effect+' · thử DEMO');
  const image=new Image();image.src='assets/gifts/'+gift.icon+'.webp';image.alt='';
  const words=document.createElement('span'),label=document.createElement('small'),effect=document.createElement('strong');
  label.textContent=gift.label;effect.textContent=gift.effect;words.append(label,effect);button.append(image,words);
  button.onclick=async()=>{
    if(state?.mode!=='DEMO'){notice('Chế độ LIVE đang chờ quà TikTok thật.');return;}
    if(requesting)return;requesting=true;
    try{await client.command('demo',{type:'gift',giftName:gift.gift,name:'Khách DEMO',viewer:1,count:1});}
    catch(error){notice(error.message);}
    finally{requesting=false;}
  };
  $('gifts').append(button);cells.set(gift.key,button);
}
audio.nextTrack=()=>{
  const tracks=state?.office?.tracks??[];
  if(!tracks.length)return;
  const index=tracks.findIndex(track=>track.id===state.office.audio.trackId);
  void client.command('office-audio',{trackId:tracks[(index+1)%tracks.length].id}).catch(()=>notice('Chọn bài tiếp trong Điều khiển.'));
};
function notice(message){$('gift-notice').textContent=message;$('gift-notice').hidden=false;}
function nameplate(key,role){
  const caption=$(key+'-name');
  caption.textContent=role.id?'@'+role.name:role.name;
  actors[key].classList.toggle('look-1',role.look===1);
  actors[key].classList.toggle('look-2',role.look===2);
  actors[key].querySelector('.nameplate span').hidden=!role.id;
}
const client=new Client(next=>{
  state=next;
  if(!next.office){notice('Cầu nối đang chạy bản cũ. Dừng phiên cũ rồi chạy START-TONG-TAI.bat.');return;}
  const office=next.office;
  $('mode').textContent=next.mode==='DEMO'?'DEMO · Mô phỏng':next.liveEvidence?.verified?'LIVE · Đã nhận sự kiện':'LIVE · Chờ sự kiện thật';
  nameplate('ceo',office.ceo);nameplate('secretary',office.secretary);
  const active=office.active;
  if(active?.id!==activeId){
    activeId=active?.id??null;scene=active;
    $('camera').className=active?'scene-'+active.key:'';
    for(const actor of Object.values(actors)){actor.style.transform='';actor.style.opacity='';actor.classList.remove('talking');}
    $('ceo-image').src='assets/office/'+(['wedding','bedroom','replaceCeo'].includes(active?.key)?'ceo-standing.webp':'ceo-seated.webp');
    if(active){
      const gift=officeConfig.guide.find(g=>g.key===active.key);
      notice(active.name+' · '+gift.effect+(active.count>1?' ×'+active.count:''));
      $('lieu-name').textContent='@'+active.name;
    } else {
      $('gift-notice').hidden=true;
    }
    particles(active?.key);
    for(const [key,cell] of cells)cell.classList.toggle('on',key===active?.key);
  }
  audio.update(next);
});
function particles(key){
  $('particles').replaceChildren();
  if(!['kiss','wedding','bedroom'].includes(key))return;
  for(let i=0;i<14;i++){
    const item=document.createElement('span');item.textContent=key==='wedding'?'✿':'♥';
    item.style.left=(10+(i*19)%80)+'%';item.style.top=(35+(i*11)%30)+'%';item.style.animationDelay=(i*.19)+'s';
    $('particles').append(item);
  }
}
function cameraAt(x,y,scale){$('camera').style.transformOrigin=x+'% '+y+'%';$('camera').style.transform='scale('+scale+')';}
function moving(actor,x,y=0,rotation=0){actor.style.transform='translate('+x+'%,'+y+'%) rotate('+rotation+'deg)';}
function render(){
  if(state?.office){
    const now=state.serverTime+Math.min(500,performance.now()-receivedAt);
    const key=scene?.key,seconds=scene?Math.max(0,(now-scene.started)/1000):0;
    const cues=dialogue[key]?.[scene?.variant%dialogue[key]?.length]?.lines??[];
    const cue=cues.find(line=>seconds>=line.at&&seconds<line.at+line.duration);
    for(const [who,actor] of Object.entries(actors))actor.classList.toggle('talking',cue?.role===who);
    $('subtitle').hidden=!cue;
    if(cue){$('speaker').textContent=names[cue.role];$('spoken').textContent=cue.text;}
    $('secretary').style.visibility=state.office.secretary.present?'visible':'hidden';
    $('impact').textContent='';
    $('ring-exchange').style.display='none';
    const after=cues.length?cues.at(-1).at+cues.at(-1).duration:2;
    if(!scene){cameraAt(50,58,1.3);}
    else if(key==='kiss'){
      cameraAt(47,46,1.64);
      const lean=Math.sin(Math.PI*Math.min(1,Math.max(0,(seconds-after)/1.7)));
      moving(actors.ceo,lean*13,-lean*5,-lean*9);
      moving(actors.secretary,-lean*9,lean*7,lean*8);
      if(seconds>after+.45&&seconds<after+1.4)$('impact').textContent='♥';
    }else if(key==='wedding'){
      cameraAt(seconds>after?48:50,seconds>after?47:42,seconds>after?1.46:1.12);
      moving(actors.ceo,Math.sin(seconds)*.5);moving(actors.secretary,-Math.sin(seconds)*.5);
      $('ring-exchange').style.display=seconds>after?'block':'none';
    }else if(key==='bedroom'){
      cameraAt(53,50,seconds<5?1.2:1.06);
      const leave=Math.min(1,Math.max(0,(seconds-2)/3));
      moving(actors.ceo,leave*130,-leave*3);moving(actors.secretary,leave*110);
      actors.ceo.style.opacity=String(1-leave);actors.secretary.style.opacity=String(1-leave);
    }else if(key==='lieu'){
      cameraAt(seconds<2?76:60,43,seconds<2?1.5:1.42);
      const entry=Math.min(1,seconds/2);
      actors.lieu.style.opacity=String(entry);
      moving(actors.lieu,-entry*95,Math.sin(seconds*9)*.35);
      if(seconds>after&&seconds<after+.8){
        moving(actors.lieu,-103,0,-9);moving(actors.secretary,-7,0,-10);
        $('impact').textContent='BỐP!';
      }else moving(actors.secretary,0);
    }else if(key==='fire'){
      cameraAt(seconds<2?30:72,seconds<2?46:49,1.5);
      const leave=Math.min(1,Math.max(0,(seconds-2)/2));
      moving(actors.ceo,0,seconds>1&&seconds<1.4?2:0);
      moving(actors.secretary,leave*170,Math.sin(seconds*12)*.5);
      actors.secretary.style.opacity=String(1-leave);
      if(seconds>1.1&&seconds<1.7)$('impact').textContent='SA THẢI';
    }else if(key==='replaceCeo'||key==='replaceSecretary'){
      const who=key==='replaceCeo'?'ceo':'secretary';
      cameraAt(who==='ceo'?32:65,43,1.55);
      const entry=Math.max(0,1-seconds/2);
      moving(actors[who],entry*150,Math.sin(seconds*10)*entry*.7);
      actors[who].style.opacity=String(1-entry);
    }else{
      cameraAt(key==='claimCeo'?32:66,43,1.52);
    }
  }
  frame=requestAnimationFrame(render);
}
let receivedAt=performance.now();
const original=client.onState;
client.onState=s=>{receivedAt=performance.now();original(s);};
$('audio-start').onclick=()=>audio.start().catch(error=>notice(error.message));
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.body.requestFullscreen();}catch{notice('Trình duyệt chưa cho mở toàn màn hình.');}};
document.addEventListener('keydown',event=>{if(event.key==='Escape')$('gift-notice').hidden=true;});
window.__office={get state(){return state;},audio,get scene(){return scene;}};
render();
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);client.close();audio.close();},{once:true});
