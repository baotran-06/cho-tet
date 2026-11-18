import voices from '../config/voices.json' with {type:'json'};

export class OfficeAudio {
  constructor(onStatus) {
    this.onStatus=onStatus;this.enabled=false;this.sceneId=null;this.played=new Set();
    this.voice=new Audio();this.music=new Audio();this.music.loop=true;
    this.music.volume=.18;this.voice.volume=.9;this.musicKind='';
    this.voice.onplay=()=>this.duck(true);
    this.voice.onended=()=>this.duck(false);
    this.voice.onpause=()=>this.duck(false);
    this.voice.onerror=()=>{this.onStatus('Không tải được lời thoại.');this.duck(false);};
    this.music.onended=()=>this.nextTrack?.();
    this.music.onerror=()=>this.onStatus('Không đọc được nhạc. Chọn bài khác trong Điều khiển.');
    this.voices=voices;this.preferences={musicVolume:.22,voiceVolume:.95,sfxVolume:.6,musicEnabled:true,voiceEnabled:true,sfxEnabled:true};
  }
  async start() {
    this.ctx??=new AudioContext();
    await this.ctx.resume();
    // Unlock the media element during the user's click without starting a scene.
    this.enabled=true;
    this.onStatus('Âm thanh đã bật');
    if(this.state)this.update(this.state);
  }
  duck(talking) {
    this.talking=talking;
    this.music.volume=this.preferences.musicEnabled?this.preferences.musicVolume*(talking?.22:1):0;
  }
  async musicFor(kind,track) {
    const source=track?'/api/music/'+track:'sounds/office/'+kind+'.mp3';
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
    if(!this.preferences.voiceEnabled&&!this.voice.paused)this.voice.pause();
    this.voice.volume=this.preferences.voiceVolume;
    if(!this.enabled)return;
    const active=office.active;
    const now=state.serverTime;
    const key=active?.key??'idle';
    const music=key==='wedding'?'wedding':key==='bedroom'?'night':key==='lieu'||key==='fire'?'tension':'chill';
    void this.musicFor(music,music==='chill'?this.preferences.trackId:null);
    if(this.sceneId!==active?.id){
      this.sceneId=active?.id;this.played.clear();this.voice.pause();this.voice.removeAttribute('src');this.voice.load();
    }
    if(!active){
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
        this.voice.src=line.src;this.voice.volume=this.preferences.voiceVolume;
        this.voice.currentTime=Math.max(0,elapsed-line.at);
        void this.voice.play().catch(()=>this.onStatus('Bấm Bật âm thanh để nghe lời thoại.'));
      }
    }
    const lastLine=lines.at(-1),after=lastLine?lastLine.at+lastLine.duration:.5;
    const at=key==='fire'?1.1:key==='lieu'?after+.2:key==='kiss'?after+.25:key==='wedding'?after+.25:key==='bedroom'?5:.4;
    if(elapsed>=at&&!this.played.has('effect')) {
      this.played.add('effect');
      if(elapsed-at<1)this.effect(key);
    }
  }
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
  close(){this.music.pause();this.voice.pause();void this.ctx?.close();}
}
