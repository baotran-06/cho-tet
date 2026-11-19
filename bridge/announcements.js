import {createHash} from 'node:crypto';
import {entranceText,spokenName} from '../frontend/js/name-announcer.js';
export function announcementText(world,body){
 if(body?.kind==='entrance')return world.wedding.groom.id&&world.wedding.groom.id===body.userId?entranceText(body.key,world.wedding.groom.name):null;
 if(body?.kind==='guests'&&Array.isArray(body.ids)&&body.ids.length>0&&body.ids.length<=2){const names=[...new Set(body.ids)].map(id=>world.users.get(id)).filter(u=>u&&!u.departedAt).map(u=>spokenName(u.name)).filter(Boolean);return names.length?'Chào '+names.join(' và ')+' đến chung vui!':null;}
 return null;
}
export async function synthesizeName(text){const {EdgeTTS}=await import('node-edge-tts');const tts=new EdgeTTS({voice:'vi-VN-HoaiMyNeural',lang:'vi-VN',rate:'+25%',outputFormat:'audio-24khz-48kbitrate-mono-mp3',timeout:10000,proxy:process.env.HTTPS_PROXY||process.env.HTTP_PROXY});const chunks=[];let size=0;for await(const chunk of tts.streamAudio(text))if(Buffer.isBuffer(chunk)){size+=chunk.length;if(size>250000)throw Error('Audio too large');chunks.push(chunk);}if(size<100)throw Error('Empty audio');return Buffer.concat(chunks);}
export class AnnouncementService{
 constructor(generate=synthesizeName){this.generate=generate;this.cache=new Map();this.pending=new Map();this.closed=false;}
 async audio(text){if(this.closed)throw Error('Closed');const key=createHash('sha256').update(text).digest('hex'),now=Date.now();for(const [k,v] of this.cache)if(now-v.at>600000)this.cache.delete(k);if(this.cache.has(key))return this.cache.get(key).data;if(this.pending.has(key))return this.pending.get(key);if(this.pending.size>=2)throw Error('Busy');const task=this.generate(text).then(data=>{if(!this.closed){this.cache.set(key,{data,at:Date.now()});while(this.cache.size>32)this.cache.delete(this.cache.keys().next().value);}return data;}).finally(()=>this.pending.delete(key));this.pending.set(key,task);return task;}
 async close(){this.closed=true;this.cache.clear();await Promise.allSettled([...this.pending.values()]);}
}
