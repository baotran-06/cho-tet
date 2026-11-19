import config from '../config/office.json' with {type:'json'};
import voices from '../config/voices.json' with {type:'json'};

import {pickVariant} from './office-dialogue.js';

export const officeConfig=config;
const needsSecretary=new Set(['kiss','wedding','bedroom','lieu','fire']);
const duration={fire:4200,wedding:14000,bedroom:180000,lieu:11000,replaceCeo:6500,replaceSecretary:6500,claimCeo:7200,claimSecretary:7200,kiss:10000};
const role=(name)=>({name,id:null,until:0,look:0,present:true});
export function officeGift(event,rules=config.byId) {
  const mapped=rules[String(event.giftId)];
  if(mapped) return config.guide.some(gift=>gift.key===mapped)?mapped:null;
  const name=String(event.giftName??'').trim().normalize('NFC').toLocaleLowerCase('vi');
  return config.guide.find(gift=>[gift.gift,gift.label].some(label=>label.toLocaleLowerCase('vi')===name))?.key??null;
}
export class Office {
  constructor() {
    this.ceo=role('Tổng tài');this.secretary=role('Thư ký');
    this.pending=[];this.active=null;this.recent=[];this.notice=null;this.sequence=0;this.total=0;this.dropped=0;this.unmapped=0;
    this.rules={...config.byId};this.variants={};this.rejected=0;this.lastRejected=null;
    this.audio={musicVolume:.22,voiceVolume:.95,sfxVolume:.6,musicEnabled:true,voiceEnabled:true,sfxEnabled:true,paused:false,trackId:null};
    this.tracks=[];
  }
  expireRoles(now){
    for(const [key,name] of [['ceo','Tổng tài'],['secretary','Thư ký']]){
      const actor=this[key];if(actor.until&&now>=actor.until)Object.assign(actor,{name,id:null,until:0});
    }
  }
  grantCeo(gift,now){
    if(this.secretary.id===gift.userId)Object.assign(this.secretary,{name:'Thư ký',id:null,until:0});
    Object.assign(this.ceo,{name:gift.name,id:gift.userId,until:now+config.roleDurationMs,present:true});
  }
  startScene(gift,now,extra={}){
    const variant=pickVariant(this.variants,gift.key,voices[gift.key]?.length??1);
    const spoken=voices[gift.key]?.[variant%voices[gift.key].length]?.duration??0;
    const minimum=gift.key==='wedding'?(config.weddingDurationMs??26000):duration[gift.key];
    const length=gift.key==='bedroom'?config.bedroomDurationMs:Math.max(minimum,(spoken+2.5)*1000);
    this.active={...gift,started:now,end:now+length,variant,sequence:++this.sequence,...extra};
  }
  accept(event,now) {
    this.expireRoles(now);
    const key=officeGift(event,this.rules);
    if(!key){this.unmapped++;return false;}
    const gift={id:event.id,key,name:event.user.name,userId:event.user.id,count:event.count,source:event.source,receivedAt:now};
    if(key==='claimCeo'&&this.ceo.id){
      this.rejected++;this.lastRejected={id:gift.id,key,name:gift.name,at:now,sequence:++this.sequence,reason:'ceo-occupied',message:'Ghế tổng tài đã có người. Dùng quà Đổi tổng tài để thay người.'};return false;
    }
    const weddingSwap=(key==='replaceCeo'||key==='claimCeo')&&this.active?.key==='wedding';
    if(!weddingSwap&&this.pending.length>=config.queueLimit){this.dropped++;return false;}
    if(key==='claimCeo'||key==='replaceCeo')this.grantCeo(gift,now);
    if(key==='claimSecretary'){
      if(this.ceo.id===gift.userId)Object.assign(this.ceo,{name:'Tổng tài',id:null,until:0});
      Object.assign(this.secretary,{name:gift.name,id:gift.userId,until:now+config.roleDurationMs,present:true});
    }
    this.notice={...gift,sequence:++this.sequence,at:now};
    if(weddingSwap){
      const prior=this.active;if(key==='replaceCeo')this.ceo.look=(this.ceo.look+1)%3;
      this.startScene({...gift,key:'wedding',id:gift.id+':wedding'},now,{weddingId:prior.weddingId??prior.id,restartCount:(prior.restartCount??0)+1,cause:key});
      return true;
    }
    const interrupt=(key==='replaceCeo'||key==='fire')&&this.active?.key==='bedroom';
    if(interrupt)this.finish(now,true);
    if(interrupt)this.pending.unshift(gift);else this.pending.push(gift);
    return true;
  }
  finish(now,interrupted=false) {
    if(!this.active)return;
    if(this.active.key==='fire')Object.assign(this.secretary,{name:'Thư ký',id:null,until:0,present:false});
    this.recent.unshift({...this.active,finished:now,interrupted});
    this.recent.length=Math.min(12,this.recent.length);this.total++;
    this.active=null;
  }
  tick(now) {
    this.expireRoles(now);
    if(this.active&&now>=this.active.end)this.finish(now);
    if(this.active)return;
    // Never announce an old CEO claim after that viewer has been replaced or expired.
    this.pending=this.pending.filter(gift=>gift.key!=='claimCeo'||this.ceo.id===gift.userId);
    // A vacant secretary slot must not prevent a later refill gift executing.
    const index=this.pending.findIndex(gift=>this.secretary.present||!needsSecretary.has(gift.key));
    if(index<0)return;
    const gift=this.pending.splice(index,1)[0];
    if(gift.key==='replaceCeo')this.ceo.look=(this.ceo.look+1)%3;
    if(gift.key==='replaceSecretary'){this.secretary.look=(this.secretary.look+1)%3;this.secretary.present=true;}
    this.startScene(gift,now,gift.key==='wedding'?{weddingId:gift.id,restartCount:0}:{});
  }
  snapshot() {
    return {ceo:{...this.ceo},secretary:{...this.secretary},active:this.active,recent:this.recent,
      notice:this.notice,pending:this.pending.length,waitingForSecretary:!this.secretary.present&&this.pending.some(g=>needsSecretary.has(g.key)),
      canClaimCeo:!this.ceo.id,rejected:this.rejected,lastRejected:this.lastRejected,
      total:this.total,dropped:this.dropped,unmapped:this.unmapped,rules:this.rules,audio:this.audio,tracks:this.tracks};
  }
}
