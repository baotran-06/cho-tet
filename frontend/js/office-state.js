import config from '../config/office.json' with {type:'json'};
import voices from '../config/voices.json' with {type:'json'};

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
    this.rules={...config.byId};this.variants={};
    this.audio={musicVolume:.22,voiceVolume:.95,sfxVolume:.6,musicEnabled:true,voiceEnabled:true,sfxEnabled:true,paused:false,trackId:null};
    this.tracks=[];
  }
  accept(event,now) {
    const key=officeGift(event,this.rules);
    if(!key){this.unmapped++;return;}
    const gift={id:event.id,key,name:event.user.name,userId:event.user.id,count:event.count,source:event.source,receivedAt:now};
    // Role grants use receipt time and remain available during long scenes.
    if(key==='claimCeo'||key==='claimSecretary') {
      const actor=key==='claimCeo'?this.ceo:this.secretary;
      const other=key==='claimCeo'?this.secretary:this.ceo;
      if(other.id===gift.userId)Object.assign(other,{name:key==='claimCeo'?'Thư ký':'Tổng tài',id:null,until:0});
      Object.assign(actor,{name:gift.name,id:gift.userId,until:now+config.roleDurationMs,present:true});
    }
    const interrupt=(key==='replaceCeo'||key==='fire')&&this.active?.key==='bedroom';
    if(interrupt) this.finish(now,true);
    if(this.pending.length>=config.queueLimit){this.dropped++;return;}
    if(interrupt)this.pending.unshift(gift);else this.pending.push(gift);
    this.notice={...gift,sequence:++this.sequence,at:now};
  }
  finish(now,interrupted=false) {
    if(!this.active)return;
    if(this.active.key==='fire')Object.assign(this.secretary,{name:'Thư ký',id:null,until:0,present:false});
    this.recent.unshift({...this.active,finished:now,interrupted});
    this.recent.length=Math.min(12,this.recent.length);this.total++;
    this.active=null;
  }
  tick(now) {
    for(const [key,name] of [['ceo','Tổng tài'],['secretary','Thư ký']]){
      const actor=this[key];
      if(actor.until&&now>=actor.until)Object.assign(actor,{name,id:null,until:0});
    }
    if(this.active&&now>=this.active.end)this.finish(now);
    if(this.active)return;
    // A vacant secretary slot must not prevent a later refill gift executing.
    const index=this.pending.findIndex(gift=>this.secretary.present||!needsSecretary.has(gift.key));
    if(index<0)return;
    const gift=this.pending.splice(index,1)[0];
    if(gift.key==='replaceCeo')this.ceo.look=(this.ceo.look+1)%3;
    if(gift.key==='replaceSecretary'){this.secretary.look=(this.secretary.look+1)%3;this.secretary.present=true;}
    const variant=this.variants[gift.key]??0;
    this.variants[gift.key]=(variant+1)%4;
    const spoken=voices[gift.key]?.[variant%voices[gift.key].length]?.duration??0;
    const length=gift.key==='bedroom'?config.bedroomDurationMs:Math.max(duration[gift.key],(spoken+2.5)*1000);
    this.active={...gift,started:now,end:now+length,variant,sequence:++this.sequence};
  }
  snapshot() {
    return {ceo:{...this.ceo},secretary:{...this.secretary},active:this.active,recent:this.recent,
      notice:this.notice,pending:this.pending.length,waitingForSecretary:!this.secretary.present&&this.pending.some(g=>needsSecretary.has(g.key)),
      total:this.total,dropped:this.dropped,unmapped:this.unmapped,rules:this.rules,audio:this.audio,tracks:this.tracks};
  }
}
