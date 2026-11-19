export function spokenName(value){return String(value??'').normalize('NFC').replace(/[^\p{L}\p{N}\s.'’_-]/gu,' ').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().slice(0,60);}
export function entranceText(key,name){const clean=spokenName(name);if(!clean)return null;if(key==='claimGroom')return `${clean} đang tiến vào lễ đường!`;if(key==='replaceGroom')return `Xin chào chú rể mới, ${clean} đang tiến vào lễ đường!`;return null;}
// Uses an installed/browser-provided Vietnamese voice. No guessed pronunciation with an English voice.
export class NameAnnouncer{
 constructor(engine=globalThis.speechSynthesis,make=text=>new globalThis.SpeechSynthesisUtterance(text)){this.engine=engine;this.make=make;this.token=0;this.status='idle';}
 cancel(){this.token++;clearTimeout(this.timer);this.finish?.('cancelled');this.finish=null;this.engine?.cancel();this.status='idle';}
 async vietnameseVoice(){if(!this.engine)return null;let found=this.engine.getVoices().find(v=>/^vi(?:-|_|$)/i.test(v.lang));if(found)return found;await new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);this.engine.removeEventListener?.('voiceschanged',done);resolve();};this.engine.addEventListener?.('voiceschanged',done,{once:true});timer=setTimeout(done,1200);});return this.engine.getVoices().find(v=>/^vi(?:-|_|$)/i.test(v.lang))??null;}
 async play(text,volume=1){this.cancel();const token=this.token;this.status='loading';const voice=await this.vietnameseVoice();if(token!==this.token)return 'cancelled';if(!voice){this.status='unavailable';return 'unavailable';}
 return new Promise(resolve=>{const u=this.make(text);u.voice=voice;u.lang='vi-VN';u.rate=1.08;u.pitch=1;u.volume=Math.max(0,Math.min(1,volume));this.utterance=u;let done=false;const finish=status=>{if(done)return;done=true;clearTimeout(this.timer);u.onend=u.onerror=null;if(this.finish===finish)this.finish=null;this.status=status;resolve(status);};this.finish=finish;u.onend=()=>finish('spoken');u.onerror=()=>finish('error');this.timer=setTimeout(()=>{finish('error');this.engine.cancel();},14000);this.status='speaking';try{this.engine.speak(u);}catch{finish('error');}});
 }
}
