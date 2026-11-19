import voices from '../config/voices.json' with {type:'json'};
import {NameAnnouncer,entranceText,spokenName} from './name-announcer.js';
import {pickVariant} from './dialogue.js';
export const speaker={mc:'MC',groom:'Chú rể',bride:'Cô dâu'};
export function openLibrary(){return new Promise((resolve,reject)=>{const req=indexedDB.open('hy-su-playlist',1);req.onupgradeneeded=()=>req.result.createObjectStore('tracks',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function library(action,value){const db=await openLibrary();return new Promise((resolve,reject)=>{const tx=db.transaction('tracks',action==='all'?'readonly':'readwrite'),s=tx.objectStore('tracks');const q=action==='all'?s.getAll():action==='put'?s.put(value):action==='get'?s.get(value):s.delete(value);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close();});}
export class WeddingAudio{
 constructor(subtitle,onError){this.subtitle=subtitle;this.onError=onError;this.enabled=false;this.announcer=new NameAnnouncer();this.nameAudio=new Audio();this.guestQueue=[];this.guestIds=null;this.nameBusy=false;this.bags={};this.lastScene=null;this.lastSwap=null;this.nextIdle=0;this.generation=0;this.music=new Audio();this.music.loop=true;this.voice=new Audio(new URL('../sounds/wedding/voices.mp3',import.meta.url));this.voice.preload='auto';this.voice.onended=()=>this.endVoice();this.voice.ontimeupdate=()=>{if(this.line&&this.voice.currentTime>=this.lineEnd-.035)this.endVoice();};this.music.onerror=()=>this.onError('Không phát được bài nhạc đã chọn.');this.voice.onerror=()=>this.onError('Không tải được giọng thoại. Kiểm tra file sounds/wedding/voices.mp3.');this.music.addEventListener('ended',()=>this.onNext?.());}
 async unlock(){this.ctx??=new AudioContext();await this.ctx.resume();this.enabled=true;this.nextIdle=Date.now()+1500;this.tone(660,.14,.08);await this.update(this.state);}
 tone(freq,duration=.2,gain=.12){if(!this.enabled||!this.state?.wedding.audio.sfxEnabled)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(freq,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.7,this.ctx.currentTime+duration);g.gain.setValueAtTime(gain*(this.state?.wedding.audio.sfxVolume??.5),this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration);}
 stopVoice(){this.generation++;this.announcer.cancel();this.nameAbort?.abort();this.nameAudio.pause();this.nameResolve?.('cancelled');this.nameResolve=null;if(this.nameUrl){URL.revokeObjectURL(this.nameUrl);this.nameUrl=null;}this.nameBusy=false;this.nameOwnerId=null;this.voice.pause();this.line=null;this.subtitle.replaceChildren();}
 endVoice(){this.voice.pause();this.line=null;this.subtitle.replaceChildren();this.nextIdle=Date.now()+3500+Math.random()*1500;}
 async say(key,variant){const v=voices[key]?.[variant??pickVariant(this.bags,key,voices[key]?.length||1)];if(!v)return;this.stopVoice();const generation=this.generation;const line=v.lines[0];this.line=line;const b=document.createElement('b');b.textContent=speaker[line.role]+': ';this.subtitle.append(b,document.createTextNode(line.text));
 if(!this.state?.wedding.audio.voiceEnabled){this.line=null;return;}
 this.voice.volume=this.state.wedding.audio.voiceVolume;this.voice.playbackRate=line.role==='mc'?1:1.12;this.voice.preservesPitch=true;try{if(this.voice.readyState<1)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Tải thoại quá lâu')),8000);this.voice.addEventListener('loadedmetadata',()=>{clearTimeout(timer);resolve();},{once:true});});if(generation!==this.generation)return;this.voice.currentTime=line.offset;this.lineEnd=line.offset+line.duration;await this.voice.play();}catch{this.onError('Trình duyệt chưa phát được thoại. Bấm lại vào sân khấu để cho phép phát tiếng.');this.endVoice();}}
 async backendName(after,ids){
 if(location.hostname!=='127.0.0.1'||!this.state.liveEvidence)return 'unavailable';
 const audio=new Audio();this.nameAudio=audio;let url;const abort=new AbortController();this.nameAbort=abort;const timer=setTimeout(()=>abort.abort(),12000);
 try{const response=await fetch('/api/announcement',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:after?'entrance':'guests',key:after?.key,userId:after?.userId,ids}),signal:abort.signal});if(!response.ok)return 'unavailable';const blob=await response.blob();if(abort.signal.aborted)return 'cancelled';url=URL.createObjectURL(blob);this.nameUrl=url;audio.src=url;audio.volume=this.state.wedding.audio.voiceVolume;
 return await new Promise(resolve=>{let done=false;let playback;const finish=result=>{if(done)return;done=true;clearTimeout(playback);audio.onended=audio.onerror=null;resolve(result);};this.nameResolve=finish;audio.onended=()=>finish('spoken');audio.onerror=()=>finish('unavailable');playback=setTimeout(()=>finish('unavailable'),14000);audio.play().catch(()=>finish('unavailable'));});
 }catch{return abort.signal.aborted?'cancelled':'unavailable';}finally{clearTimeout(timer);audio.pause();if(url)URL.revokeObjectURL(url);if(this.nameAudio===audio){this.nameResolve=null;this.nameUrl=null;}}
 }
 async sayName(text,after,ids){
 this.stopVoice();const generation=this.generation;if(!this.state?.wedding.audio.voiceEnabled){if(after)this.say(after.key,after.variant);return;}
 this.nameBusy=true;this.nameOwnerId=after?.userId??null;const label=document.createElement('b');label.textContent='MC: ';this.subtitle.append(label,document.createTextNode(text));this.lastNameText=text;
 let result=await this.backendName(after,ids);if(generation!==this.generation)return;if(result!=='spoken'){result=await this.announcer.play(text,this.state.wedding.audio.voiceVolume);this.lastNameBackend='browser';}else this.lastNameBackend='bridge-mp3';
 if(generation!==this.generation)return;this.nameBusy=false;this.lastNameResult=result;this.subtitle.replaceChildren();
 if(result==='unavailable')this.onError('Chưa có tiếng đọc tên: nguồn cầu nối chưa khả dụng và trình duyệt thiếu giọng tiếng Việt. Thoại thu sẵn vẫn hoạt động.');
 else if(result==='error')this.onError('Không đọc được tên bằng giọng trình duyệt. Kiểm tra giọng tiếng Việt và thiết bị âm thanh.');
 if(after&&this.state?.wedding.audio.voiceEnabled){const a=this.state.wedding.active;const current=after.sequence===a?.sequence||after.sequence===a?.swap?.sequence;if(current)this.say(after.key,after.variant);}
 this.nextIdle=Date.now()+4000;
 }
 announce(gift){const text=entranceText(gift.key,gift.name);if(text)this.sayName(text,gift);else this.say(gift.key,gift.variant);}
 trackGuests(state){const guests=state.users.filter(u=>!u.departedAt),ids=new Set(guests.map(u=>u.id));if(this.guestIds){for(const u of guests)if(!this.guestIds.has(u.id)&&!['groom','bride'].some(k=>state.wedding[k].id===u.id)){const name=spokenName(u.name);if(name&&!this.guestQueue.some(g=>g.id===u.id))this.guestQueue.push({id:u.id,name,at:Date.now()});}}this.guestIds=ids;this.guestQueue=this.guestQueue.filter(g=>ids.has(g.id)&&Date.now()-g.at<15000).slice(-8);}
 async update(state){if(!state)return;if(this.mode&&this.mode!==state.mode){this.stopVoice();this.guestQueue=[];this.guestIds=null;this.lastScene=null;this.lastSwap=null;}this.mode=state.mode;this.state=state;this.trackGuests(state);if(!this.enabled)return;const w=state.wedding,a=w.active,settings=w.audio;
 this.voice.volume=settings.voiceVolume;this.nameAudio.volume=settings.voiceVolume;if(this.nameBusy&&this.nameOwnerId&&w.groom.id!==this.nameOwnerId)this.stopVoice();if(!settings.voiceEnabled&&this.nameBusy)this.stopVoice();if(this.line&&(!settings.voiceEnabled||this.voice.currentTime>=this.lineEnd-.035))this.endVoice();
 if(a?.sequence!==this.lastScene){this.lastScene=a?.sequence;this.cue=0;this.stopVoice();if(a){if(Date.now()+state.serverTime-Date.now()-a.started<2500)this.announce(a);this.tone(a.key==='kiss'?880:523,.35,.2);if(['wedding','celebrate'].includes(a.key))for(let i=0;i<5;i++)setTimeout(()=>this.tone(420+i*110,.18,.12),i*130);}else this.nextIdle=Date.now()+4500;}
 const elapsed=a?(state.serverTime-a.started)/1000:0;const cue=a?.key==='wedding'?Math.min(3,Math.floor(elapsed/7)):a?.key==='bedroom'?Math.floor(elapsed/16):0;
 if(a&&cue>this.cue&&!this.line&&!this.nameBusy){this.cue=cue;this.say(a.key,(a.variant+cue)%voices[a.key].length);}
 if(a?.swap?.sequence&&this.lastSwap!==a.swap.sequence){this.lastSwap=a.swap.sequence;this.announce(a.swap);}
 if(!a&&!this.line&&!this.nameBusy&&this.guestQueue.length&&settings.voiceEnabled){const group=this.guestQueue.splice(0,2);this.sayName('Chào '+group.map(g=>g.name).join(' và ')+' đến chung vui!',null,group.map(g=>g.id));}
 if(!a&&!this.line&&!this.nameBusy&&Date.now()>this.nextIdle){this.nextIdle=Date.now()+16000;this.say('idle');}
 // Bedtime scenes stay lighthearted; no explicit content.
 const custom=settings.trackId?w.tracks.find(x=>x.id===settings.trackId):null;
 const sceneMusic=a?.key==='wedding'?'wedding':a?.key==='bedroom'?'night':a?.key==='celebrate'?'wedding':'chill';
 const desired=custom&&!['wedding','bedroom'].includes(a?.key)?custom.id:sceneMusic;
 if(this.musicKey!==desired){this.musicKey=desired;const generation=(this.musicGeneration||0)+1;this.musicGeneration=generation;let url;
 if(custom&&desired===custom.id){if(custom.local){const track=await library('get',custom.id);if(!track){this.onError('File nhạc chưa có trên trình duyệt này.');return;}url=URL.createObjectURL(track.blob);}else url='/api/music/'+custom.id;}else url=new URL('../sounds/wedding/'+sceneMusic+'.mp3',import.meta.url).href;
 if(this.musicGeneration!==generation){if(url.startsWith('blob:'))URL.revokeObjectURL(url);return;}this.music.pause();if(this.blobUrl)URL.revokeObjectURL(this.blobUrl);this.blobUrl=url.startsWith('blob:')?url:null;this.music.src=url;this.music.loop=!(custom&&desired===custom.id);}
 this.music.volume=settings.musicVolume*((this.line||this.nameBusy)&&settings.voiceEnabled ? .25 : 1);
 if(settings.paused||!settings.musicEnabled)this.music.pause();else if(this.music.paused)this.music.play().catch(()=>this.onError('Nhạc bị chặn. Bấm một lần vào sân khấu để cho phép phát.'));
 }
 close(){this.stopVoice();this.music.pause();if(this.blobUrl)URL.revokeObjectURL(this.blobUrl);this.ctx?.close();}
}
