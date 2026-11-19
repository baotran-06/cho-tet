import test from 'node:test';
import assert from 'node:assert/strict';
import {pickVariant,idleCategory} from '../frontend/js/office-dialogue.js';
import {OfficeAudio} from '../frontend/js/office-audio.js';
import voices from '../frontend/config/voices.json' with {type:'json'};

test('six variations are exhausted before reuse and never repeat at a shuffle boundary',()=>{
 const bags={};let previous=-1;
 for(let cycle=0;cycle<50;cycle++){
  const picks=[];for(let i=0;i<6;i++){const n=pickVariant(bags,'kiss',6);assert.notEqual(n,previous);previous=n;picks.push(n);}
  assert.equal(new Set(picks).size,6);
 }
});
test('idle invitations match vacant roles and stop during a gift scene',()=>{
 const office={ceo:{id:null},secretary:{id:null},active:null};
 assert.equal(idleCategory(office),'idleBoth');
 office.ceo.id='a';assert.equal(idleCategory(office),'idleSecretary');
 office.secretary.id='b';assert.equal(idleCategory(office),null);
 office.ceo.id=null;assert.equal(idleCategory(office),'idleCeo');
 office.active={key:'kiss'};assert.equal(idleCategory(office),null);
});
test('every event and idle category contains six valid, non-overlapping voice cues',()=>{
 const keys=['kiss','wedding','lieu','replaceCeo','replaceSecretary','claimCeo','claimSecretary','bedroom','fire','idleBoth','idleCeo','idleSecretary'];
 for(const key of keys){assert.equal(voices[key].length,6,key);const texts=new Set();
  for(const variant of voices[key]){let end=0;for(const line of variant.lines){assert.ok(line.text);assert.ok(line.duration>0);assert.ok(line.offset>=0);assert.ok(line.at>=end);end=line.at+line.duration;}texts.add(variant.lines.map(l=>l.text).join(' '));}
  assert.equal(texts.size,6,key);
 }
});
class FakeAudio {
 constructor(){this.src='';this.readyState=1;this.currentTime=0;this.paused=true;this.volume=1;}
 load(){}pause(){this.paused=true;this.onpause?.();}
 async play(){this.paused=false;this.onplay?.();}
}
test('idle speech waits, a real effect interrupts it, and both occupied roles silence invitations',async()=>{
 const prior=globalThis.Audio;globalThis.Audio=FakeAudio;
 let audio;
 try{
  audio=new OfficeAudio(()=>{});audio.enabled=true;
  const office={ceo:{id:null},secretary:{id:null},active:null,audio:{sfxEnabled:false}};
  audio.update({office,serverTime:1000});assert.equal(audio.idleCaption,null);
  audio.update({office,serverTime:13001});await Promise.resolve();
  assert.ok(audio.idleCaption);assert.equal(audio.voice.paused,false);
  office.active={id:'gift',key:'kiss',variant:0,started:14000};
  audio.update({office,serverTime:14000});assert.equal(audio.idleCaption,null);assert.equal(audio.voice.paused,true);
  office.active=null;office.ceo.id='a';office.secretary.id='b';
  audio.update({office,serverTime:100000});assert.equal(audio.idleCaption,null);
  await audio.playSpeech(voices.kiss[0].lines[0]);
  assert.ok(audio.voice.currentTime>=voices.kiss[0].lines[0].offset);
  audio.voice.currentTime=audio.clipEnd;audio.voice.ontimeupdate();assert.equal(audio.voice.paused,true);
 }finally{audio?.close();globalThis.Audio=prior;}
});
