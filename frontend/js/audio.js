import voices from '../config/voices.json' with {type:'json'};
import {pickVariant} from './dialogue.js';
export const speaker={mc:'MC',groom:'Chú rể',bride:'Cô dâu'};
export function openLibrary(){return new Promise((resolve,reject)=>{const req=indexedDB.open('hy-su-playlist',1);req.onupgradeneeded=()=>req.result.createObjectStore('tracks',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function library(action,value){const db=await openLibrary();return new Promise((resolve,reject)=>{const tx=db.transaction('tracks',action==='all'?'readonly':'readwrite'),s=tx.objectStore('tracks');const q=action==='all'?s.getAll():action==='put'?s.put(value):action==='get'?s.get(value):s.delete(value);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close();});}
export class WeddingAudio{
 constructor(subtitle,onError){this.subtitle=subtitle;this.onError=onError;this.enabled=false;this.bags={};this.lastScene=null;this.lastSwap=null;this.nextIdle=0;this.generation=0;this.music=new Audio();this.music.loop=true;this.voice=new Audio(new URL('../sounds/wedding/voices.mp3',import.meta.url));this.voice.preload='auto';this.voice.onended=()=>this.endVoice();this.voice.ontimeupdate=()=>{if(this.line&&this.voice.currentTime>=this.lineEnd-.035)this.endVoice();};this.music.onerror=()=>this.onError('Không phát được bài nhạc đã chọn.');this.voice.onerror=()=>this.onError('Không tải được giọng thoại. Kiểm tra file sounds/wedding/voices.mp3.');this.music.addEventListener('ended',()=>this.onNext?.());}
 async unlock(){this.ctx??=new AudioContext();await this.ctx.resume();this.enabled=true;this.nextIdle=Date.now()+1500;this.tone(660,.14,.08);await this.update(this.state);}
 tone(freq,duration=.2,gain=.12){if(!this.enabled||!this.state?.wedding.audio.sfxEnabled)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(freq,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.7,this.ctx.currentTime+duration);g.gain.setValueAtTime(gain*(this.state?.wedding.audio.sfxVolume??.5),this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration);}
 stopVoice(){this.generation++;this.voice.pause();this.line=null;this.subtitle.replaceChildren();}
 endVoice(){this.voice.pause();this.line=null;this.subtitle.replaceChildren();this.nextIdle=Date.now()+6500+Math.random()*2500;}
 async say(key,variant){const v=voices[key]?.[variant??pickVariant(this.bags,key,voices[key]?.length||1)];if(!v)return;this.stopVoice();const generation=this.generation;const line=v.lines[0];this.line=line;const b=document.createElement('b');b.textContent=speaker[line.role]+': ';this.subtitle.append(b,document.createTextNode(line.text));
 if(!this.state?.wedding.audio.voiceEnabled){this.line=null;return;}
 this.voice.volume=this.state.wedding.audio.voiceVolume;try{if(this.voice.readyState<1)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Tải thoại quá lâu')),8000);this.voice.addEventListener('loadedmetadata',()=>{clearTimeout(timer);resolve();},{once:true});});if(generation!==this.generation)return;this.voice.currentTime=line.offset;this.lineEnd=line.offset+line.duration;await this.voice.play();}catch{this.onError('Trình duyệt chưa phát được thoại. Bấm Bật âm thanh lần nữa.');this.endVoice();}}
 async update(state){if(!state)return;this.state=state;if(!this.enabled)return;const w=state.wedding,a=w.active,settings=w.audio;
 if(this.line&&(!settings.voiceEnabled||this.voice.currentTime>=this.lineEnd-.035))this.endVoice();
 if(a?.sequence!==this.lastScene){this.lastScene=a?.sequence;this.cue=0;this.stopVoice();if(a){if(Date.now()+state.serverTime-Date.now()-a.started<2500)this.say(a.key,a.variant);this.tone(a.key==='kiss'?880:523,.35,.2);if(['wedding','celebrate'].includes(a.key))for(let i=0;i<5;i++)setTimeout(()=>this.tone(420+i*110,.18,.12),i*130);}else this.nextIdle=Date.now()+4500;}
 const elapsed=a?(state.serverTime-a.started)/1000:0;const cue=a?.key==='wedding'?Math.min(3,Math.floor(elapsed/7)):a?.key==='bedroom'?Math.floor(elapsed/16):0;
 if(a&&cue>this.cue&&!this.line){this.cue=cue;this.say(a.key,(a.variant+cue)%voices[a.key].length);}
 if(a?.swap?.sequence&&this.lastSwap!==a.swap.sequence){this.lastSwap=a.swap.sequence;this.say(a.swap.key);}
 if(!a&&!this.line&&Date.now()>this.nextIdle){this.nextIdle=Date.now()+16000;this.say('idle');}
 // Bedtime scenes stay lighthearted; no explicit content.
 const custom=settings.trackId?w.tracks.find(x=>x.id===settings.trackId):null;
 const sceneMusic=a?.key==='wedding'?'wedding':a?.key==='bedroom'?'night':a?.key==='celebrate'?'wedding':'chill';
 const desired=custom&&!['wedding','bedroom'].includes(a?.key)?custom.id:sceneMusic;
 if(this.musicKey!==desired){this.musicKey=desired;const generation=(this.musicGeneration||0)+1;this.musicGeneration=generation;let url;
 if(custom&&desired===custom.id){if(custom.local){const track=await library('get',custom.id);if(!track){this.onError('File nhạc chưa có trên trình duyệt này.');return;}url=URL.createObjectURL(track.blob);}else url='/api/music/'+custom.id;}else url=new URL('../sounds/wedding/'+sceneMusic+'.mp3',import.meta.url).href;
 if(this.musicGeneration!==generation){if(url.startsWith('blob:'))URL.revokeObjectURL(url);return;}this.music.pause();if(this.blobUrl)URL.revokeObjectURL(this.blobUrl);this.blobUrl=url.startsWith('blob:')?url:null;this.music.src=url;this.music.loop=!(custom&&desired===custom.id);}
 this.music.volume=settings.musicVolume*(this.line&&settings.voiceEnabled ? .25 : 1);
 if(settings.paused||!settings.musicEnabled)this.music.pause();else if(this.music.paused)this.music.play().catch(()=>this.onError('Nhạc bị chặn. Bấm Bật âm thanh để cho phép phát.'));
 }
 close(){this.stopVoice();this.music.pause();if(this.blobUrl)URL.revokeObjectURL(this.blobUrl);this.ctx?.close();}
}
