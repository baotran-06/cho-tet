"""Optional authoring tool: pip install edge-tts. Runtime only needs the bundled MP3."""
import asyncio,hashlib,json,os,subprocess,wave
from pathlib import Path
import certifi
# Honor a caller-provided trusted certificate bundle before the speech client initializes.
extra=os.environ.get('SSL_CERT_FILE')
if extra and Path(extra).is_file():
 bundle=Path(certifi.where());cert=Path(extra).read_bytes()
 if cert not in bundle.read_bytes():bundle.write_bytes(bundle.read_bytes()+b'\n'+cert)
import edge_tts
root=Path(__file__).resolve().parents[1]
source=json.loads((root/'frontend/config/dialogue.json').read_text())
timing=json.loads((root/'frontend/config/office.json').read_text()).get('speech',{})
cache=root/'.runtime/voice-build';cache.mkdir(parents=True,exist_ok=True)
profiles={'ceo':('vi-VN-NamMinhNeural','-8%','-18Hz'),'secretary':('vi-VN-HoaiMyNeural','+8%','+6Hz'),'lieu':('vi-VN-HoaiMyNeural','+2%','-5Hz'),'mc':('vi-VN-NamMinhNeural','+12%','+8Hz')}
jobs=[]
for key,variants in source.items():
 for variant in variants:
  for line in variant['lines']:
   profile=profiles[line['role']];digest=hashlib.sha256(json.dumps([line['text'],profile],ensure_ascii=False).encode()).hexdigest()[:24]
   jobs.append((line,profile,cache/(digest+'.mp3')))
async def main():
 sem=asyncio.Semaphore(3);completed=0
 async def make(line,profile,path):
  nonlocal completed
  async with sem:
   if not path.exists() or path.stat().st_size<100:
    for attempt in range(4):
     try:
      await edge_tts.Communicate(line['text'],profile[0],rate=profile[1],pitch=profile[2]).save(str(path));break
     except Exception:
      if attempt==3:raise
      await asyncio.sleep(2+attempt*3)
   completed+=1
   if completed%12==0:print(f'Generated {completed}/{len(jobs)}',flush=True)
 await asyncio.gather(*(make(*job) for job in jobs))
asyncio.run(main())
rate=24000;chunks=[];cursor=0;silence=b'\0\0'*int(rate*.18);index=0;voices={}
for key,variants in source.items():
 voices[key]=[]
 for variant in variants:
  at=0 if key.startswith('idle') else timing.get('sceneLeadSeconds',.3);lines=[]
  for line in variant['lines']:
   _,_,path=jobs[index];index+=1
   pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','s16le','-ac','1','-ar',str(rate),'-'])
   duration=len(pcm)/(2*rate)
   lines.append({**line,'src':'sounds/office/voices-v3.mp3','offset':round(cursor/rate,5),'at':round(at,3),'duration':round(duration,4)})
   chunks.extend([pcm,silence]);cursor+=len(pcm)//2+len(silence)//2;at+=duration+timing.get('turnGapSeconds',.12)
  voices[key].append({'lines':lines,'duration':round(at,3)})
output=root/'frontend/sounds/office/voices-v3.mp3';wav=cache/'combined.wav'
with wave.open(str(wav),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(b''.join(chunks))
subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libmp3lame','-b:a','64k',str(output)],check=True)
(root/'frontend/config/voices.json').write_text(json.dumps(voices,ensure_ascii=False,indent=2)+'\n')
print(f'Bundled {len(jobs)} lines in {cursor/rate:.1f}s; {output.stat().st_size} bytes',flush=True)
