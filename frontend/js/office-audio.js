import voices from '../config/voices.json' with {type:'json'};
import config from '../config/office.json' with {type:'json'};
import {pickVariant,idleCategory} from './office-dialogue.js';

export class OfficeAudio {
  constructor(onStatus) {
    this.onStatus=onStatus;this.enabled=false;this.sceneId=null;this.played=new Set();
    this.voice=new Audio();this.voice.preload='auto';this.music=new Audio();this.music.loop=true;
    this.music.volume=.18;this.voice.volume=.9;this.musicKind='';
    this.voice.onplay=()=>this.duck(true);
    this.voice.onended=()=>this.duck(false);
    this.voice.onpause=()=>this.duck(false);
    this.voice.onerror=()=>{this.onStatus('Không tải được lời thoại.');this.duck(false);};
    this.music.onended=()=>this.nextTrack?.();
    this.music.onerror=()=>this.onStatus('Không đọc được nhạc. Chọn bài khác trong Điều khiển.');
    this.clipToken=0;this.idleBags={};this.idlePlaying=null;this.idleLastCategory=null;
    this.voice.ontimeupdate=()=>{if(this.clipEnd&&this.voice.currentTime>=this.clipEnd-.025)this.stopSpeech();};
    this.voices=voices;this.preferences={musicVolume:.22,voiceVolume:.95,sfxVolume:.6,musicEnabled:true,voiceEnabled:true,sfxEnabled:true};
  }
  async start() {
    this.ctx??=new AudioContext();
    await this.ctx.resume();
    // Unlock the media element during the user's click without starting a scene.
    this.enabled=true;
    if(!this.voice.src){this.voice.src=new URL('../'+this.voices.kiss[0].lines[0].src,import.meta.url).href;this.voice.load();}
    this.onStatus('Âm thanh đã bật');
    if(this.state)this.update(this.state);
  }
  duck(talking) {
    this.talking=talking;
    this.music.volume=this.preferences.musicEnabled?this.preferences.musicVolume*(talking?.22:1):0;
  }
  async musicFor(kind,track) {
    const source=track?'/api/music/'+track:new URL('../sounds/office/'+kind+'.mp3',import.meta.url).href;
    const identity=track||kind;
    this.music.loop=!track;
    if(this.musicKind!==identity){this.musicKind=identity;this.music.src=source;}
    this.music.volume=this.preferences.musicEnabled?this.preferences.musicVolume*(this.talking?.22:1):0;
    if(this.preferences.paused||!this.preferences.musicEnabled){this.music.pause();return;}
    if(this.music.paused)try{await this.music.play();}catch{this.onStatus('Bấm Bật âm thanh trên cửa sổ game.');}
  }
  update(state) {
    this.state=state;
    const office=state.office;
    if(!office)return;
    this.preferences={...this.preferences,...office.audio};
    if(!this.preferences.voiceEnabled)this.stopSpeech();
    this.voice.volume=this.preferences.voiceVolume;
    if(!this.enabled)return;
    const active=office.active;
    const now=state.serverTime;
    const key=active?.key??'idle';
    const music=key==='wedding'?'wedding':key==='bedroom'?'night':key==='lieu'||key==='fire'?'tension':'chill';
    void this.musicFor(music,music==='chill'?this.preferences.trackId:null);
    if(this.sceneId!==active?.id){
      this.sceneId=active?.id;this.played.clear();this.stopSpeech();this.nextIdleAt=now+config.speech.afterSceneDelayMs;
    }
    if(!active){
      this.updateIdle(office,now);
      if(this.preferences.sfxEnabled&&now>(this.nextOfficeSound??0)){
        this.nextOfficeSound=now+5000+Math.random()*7000;
        this.officeFoley();
      }
      return;
    }
    const elapsed=(now-active.started)/1000;
    const lines=this.voices[key]?.[active.variant%this.voices[key].length]?.lines??[];
    const line=lines.find((cue,i)=>{
      if(elapsed>=cue.at+cue.duration){this.played.add('voice'+i);return false;}
      return elapsed>=cue.at&&!this.played.has('voice'+i);
    });
    if(line){
      const index=lines.indexOf(line);this.played.add('voice'+index);
      if(this.preferences.voiceEnabled){
        void this.playSpeech(line,Math.max(0,elapsed-line.at));
      }
    }
    const lastLine=lines.at(-1),after=lastLine?lastLine.at+lastLine.duration:.5;
    const at=key==='fire'?after+.1:key==='lieu'?after+.2:key==='kiss'?after+.25:key==='wedding'?after+.25:key==='bedroom'?5:.4;
    if(elapsed>=at&&!this.played.has('effect')) {
      this.played.add('effect');
      if(elapsed-at<1)this.effect(key);
    }
  }
  stopSpeech(){
    if(this.idlePlaying)this.nextIdleAt=(this.state?.serverTime??Date.now())+config.speech.minPauseMs+Math.random()*(config.speech.maxPauseMs-config.speech.minPauseMs);
    this.clipToken++;clearTimeout(this.clipTimer);this.voice.pause();this.clipEnd=0;this.idlePlaying=null;this.duck(false);
  }
  async playSpeech(line,elapsed=0,idle=null){
    this.stopSpeech();const token=this.clipToken,requestedAt=performance.now();
    const url=new URL('../'+line.src,import.meta.url).href;
    this.idlePlaying=idle?{...line,category:idle}:null;
    try{
      if(this.voice.src!==url){this.voice.src=url;this.voice.load();}
      if(this.voice.readyState<1){
        await new Promise((resolve,reject)=>{
          const done=()=>{clearTimeout(timeout);this.voice.removeEventListener('loadedmetadata',ok);this.voice.removeEventListener('error',fail);};
          const ok=()=>{done();resolve();},fail=()=>{done();reject(new Error('Không tải được lời thoại.'));};
          const timeout=setTimeout(fail,15000);this.voice.addEventListener('loadedmetadata',ok,{once:true});this.voice.addEventListener('error',fail,{once:true});
        });
      }
      if(token!==this.clipToken)return;
      if(!idle)elapsed+=(performance.now()-requestedAt)/1000;
      const offset=line.offset??0,remaining=line.duration-elapsed;
      if(remaining<=.03){this.stopSpeech();return;}
      this.voice.currentTime=offset+elapsed;this.clipEnd=offset+line.duration;
      this.voice.volume=this.preferences.voiceVolume;await this.voice.play();
      if(token!==this.clipToken)return;
      this.clipTimer=setTimeout(()=>{if(token===this.clipToken)this.stopSpeech();},remaining*1000+20);
    }catch{
      if(token===this.clipToken){this.stopSpeech();this.onStatus('Bấm Bật âm thanh để nghe lời thoại.');}
    }
  }
  updateIdle(office,now){
    const category=idleCategory(office);
    if(this.idlePlaying&&this.idlePlaying.category!==category)this.stopSpeech();
    if(category!==this.idleLastCategory){this.idleLastCategory=category;this.nextIdleAt=now+config.speech.initialDelayMs;}
    if(!category||!this.preferences.voiceEnabled){this.nextIdleAt=now+config.speech.initialDelayMs;return;}
    this.nextIdleAt??=now+config.speech.initialDelayMs;
    if(now<this.nextIdleAt||!this.voice.paused)return;
    const variants=this.voices[category]??[];
    if(!variants.length)return;
    const variant=pickVariant(this.idleBags,category,variants.length);
    this.nextIdleAt=now+variants[variant].lines[0].duration*1000+config.speech.minPauseMs+Math.random()*(config.speech.maxPauseMs-config.speech.minPauseMs);
    void this.playSpeech(variants[variant].lines[0],0,category);
  }
  get idleCaption(){return this.idlePlaying&&!this.voice.paused?this.idlePlaying:null;}
  effect(key) {
    if(!this.ctx||!this.preferences.sfxEnabled)return;
    const now=this.ctx.currentTime,level=this.preferences.sfxVolume*.22;
    const frequencies=key==='wedding'?[523,659,784,1046]:key==='fire'||key==='lieu'?[95,61]:key==='bedroom'?[130,67]:key==='kiss'?[900,620]:[660,880,1100];
    frequencies.forEach((f,i)=>{
      const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();
      oscillator.type=key==='fire'||key==='lieu'?'triangle':'sine';
      oscillator.frequency.setValueAtTime(f,now+i*.075);
      oscillator.frequency.exponentialRampToValueAtTime(f*.5,now+i*.075+.18);
      gain.gain.setValueAtTime(level,now+i*.075);
      gain.gain.exponentialRampToValueAtTime(.001,now+i*.075+.24);
      oscillator.connect(gain);gain.connect(this.ctx.destination);
      oscillator.start(now+i*.075);oscillator.stop(now+i*.075+.3);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    });
    if(['lieu','fire','kiss','wedding','bedroom'].includes(key))this.foley(key);
  }
  foley(key) {
    const context=this.ctx,length=key==='wedding'?1.4:.24;
    const buffer=context.createBuffer(1,context.sampleRate*length,context.sampleRate);
    const samples=buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++){
      const t=i/context.sampleRate;
      const envelope=key==='wedding'?Math.abs(Math.sin(t*24))*Math.exp(-t*1.5):Math.exp(-t*20);
      samples[i]=(Math.random()*2-1)*envelope;
    }
    const node=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();
    node.buffer=buffer;filter.type='lowpass';filter.frequency.value=key==='kiss'?2200:800;
    gain.gain.value=this.preferences.sfxVolume*(key==='wedding'?.09:.22);
    node.connect(filter);filter.connect(gain);gain.connect(context.destination);node.start();
    node.onended=()=>{node.disconnect();filter.disconnect();gain.disconnect();};
  }
  officeFoley(){
    if(!this.ctx)return;
    const context=this.ctx;
    for(let step=0;step<4;step++){
      const oscillator=context.createOscillator(),gain=context.createGain();
      const at=context.currentTime+step*.13;
      oscillator.type='triangle';oscillator.frequency.value=170+Math.random()*120;
      gain.gain.setValueAtTime(this.preferences.sfxVolume*.018,at);
      gain.gain.exponentialRampToValueAtTime(.0001,at+.035);
      oscillator.connect(gain);gain.connect(context.destination);
      oscillator.start(at);oscillator.stop(at+.045);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }
  }
  close(){this.stopSpeech();this.music.pause();void this.ctx?.close();}
}
