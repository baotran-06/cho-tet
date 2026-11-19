import config from '../config/wedding.json' with {type:'json'};
import voices from '../config/voices.json' with {type:'json'};
import {pickVariant} from './dialogue.js';
export const weddingConfig=config;
const actor=name=>({id:null,name,until:0,look:0,present:true});
export function weddingGift(e,rules=config.byId){
 if(Object.hasOwn(rules,String(e.giftId)))return config.guide.some(g=>g.key===rules[e.giftId])?rules[e.giftId]:null;
 const n=String(e.giftName||'').trim().normalize('NFC').toLocaleLowerCase('vi');
 return config.guide.find(g=>[g.gift,g.label].some(s=>s.toLocaleLowerCase('vi')===n))?.key??null;
}
export class Wedding {
 constructor(){this.groom=actor('Chú rể');this.bride=actor('Cô dâu');this.pending=[];this.active=null;this.recent=[];this.notice=null;this.sequence=0;this.total=0;this.dropped=0;this.unmapped=0;this.rejected=0;this.lastRejected=null;this.variants={};this.rules={...config.byId};this.tracks=[];this.audio={musicVolume:.25,voiceVolume:.95,sfxVolume:.5,musicEnabled:true,voiceEnabled:true,sfxEnabled:true,paused:false,trackId:null};}
 expire(now){if(this.active&&['wedding','bedroom'].includes(this.active.key))return;for(const [k,n] of [['groom','Chú rể'],['bride','Cô dâu']])if(this[k].until&&this[k].until<=now)Object.assign(this[k],{id:null,name:n,until:0});}
 accept(e,now){this.expire(now);const key=weddingGift(e,this.rules);if(!key){this.unmapped++;return false;}
 const g={id:e.id,key,userId:e.user.id,name:e.user.name,count:e.count,source:e.source,receivedAt:now};
 const which=/Groom$/.test(key)?'groom':/Bride$/.test(key)?'bride':null;
 if(which&&key.startsWith('claim')&&this[which].id){this.rejected++;this.lastRejected={...g,sequence:++this.sequence,message:`Vai ${which==='groom'?'chú rể':'cô dâu'} đã có người. Dùng quà đổi vai.`};return false;}
 if(this.pending.length>=config.queueLimit){this.dropped++;return false;}
 if(which){const other=which==='groom'?'bride':'groom';if(this[other].id===g.userId)Object.assign(this[other],{id:null,name:other==='groom'?'Chú rể':'Cô dâu',until:0});Object.assign(this[which],{id:g.userId,name:g.name,until:now+config.roleDurationMs,look:this[which].look+1});}
 this.notice={...g,sequence:++this.sequence,at:now};
 if(which&&['wedding','bedroom'].includes(this.active?.key)){this.active={...this.active,swap:{...g,sequence:++this.sequence}};return true;}
 this.pending.push(g);return true;
 }
 finish(now,interrupted=false){if(!this.active)return;this.recent.unshift({...this.active,finished:now,interrupted});this.recent.length=Math.min(12,this.recent.length);this.total++;this.active=null;}
 tick(now){this.expire(now);if(this.active&&now>=this.active.end)this.finish(now);if(this.active||!this.pending.length)return;
 this.pending=this.pending.filter(g=>!g.key.startsWith('claim')||(g.key==='claimGroom'?this.groom:this.bride).id===g.userId);if(!this.pending.length)return;
 const g=this.pending.shift(),variant=pickVariant(this.variants,g.key,voices[g.key]?.length||1),spoken=voices[g.key]?.[variant]?.duration||5;
 const length=g.key==='bedroom'?config.bedroomDurationMs:g.key==='wedding'?config.weddingDurationMs:Math.max(g.key==='bouquet'?11000:8000,(spoken+1)*1000);
 this.active={...g,variant,sequence:++this.sequence,started:now,end:now+length};}
 snapshot(){return {groom:{...this.groom},bride:{...this.bride},active:this.active,recent:this.recent,notice:this.notice,pending:this.pending.length,total:this.total,dropped:this.dropped,unmapped:this.unmapped,rejected:this.rejected,lastRejected:this.lastRejected,rules:this.rules,audio:this.audio,tracks:this.tracks};}
}
