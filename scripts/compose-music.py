"""Original instrumental loops composed for Văn phòng Tổng tài. CC0."""
from pathlib import Path
import math, random, wave, subprocess, struct
root=Path(__file__).resolve().parents[1]/'frontend/sounds/office'
root.mkdir(parents=True,exist_ok=True)
rate=22050
def compose(name,tempo,notes,chords,length=24):
 samples=[0.0]*int(rate*length)
 def add(note,at,duration,level,soft=True):
  frequency=440*2**((note-69)/12)
  start=int(at*rate)
  for n in range(min(int(duration*rate),len(samples)-start)):
   t=n/rate
   envelope=min(1,t/.018)*math.exp(-t/(.8 if soft else .45))*min(1,(duration-t)/.14)
   tone=math.sin(math.tau*frequency*t)+.23*math.sin(math.tau*frequency*2*t)+.07*math.sin(math.tau*frequency*3*t)
   samples[start+n]+=level*envelope*tone
 beat=60/tempo
 for bar in range(math.ceil(length/(beat*4))):
  chord=chords[bar%len(chords)]
  for step in range(8):
   at=(bar*4+step*.5)*beat
   if at>=length:break
   add(chord[step%len(chord)],at,1.5,.075)
  for j,note in enumerate(notes[bar%len(notes)]):
   at=(bar*4+j)*beat
   if at<length:add(note,at,beat*.96,.13,False)
  if bar*4*beat<length:add(chord[0]-12,bar*4*beat,beat*3,.13)
 peak=max(.001,max(map(abs,samples)))
 pcm=bytearray()
 for i,x in enumerate(samples):
  fade=min(1,i/(rate*.3),(len(samples)-i)/(rate*.6))
  pcm.extend(struct.pack('<h',round(max(-1,min(1,x/peak*.65*fade))*32767)))
 wav=root/(name+'.wav')
 with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(pcm)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','80k',str(root/(name+'.mp3'))],check=True)
 wav.unlink()
compose('chill',80,[[76,74,71,69],[72,71,67,69],[74,71,69,67],[71,74,76,74]],[[48,55,59,64],[45,52,55,60],[50,57,60,65],[43,50,55,59]])
compose('wedding',100,[[72,76,79,84],[83,79,77,76],[74,77,81,79],[76,74,72,72]],[[48,55,60,64],[53,60,65,69],[55,62,67,71],[48,55,60,64]])
compose('tension',112,[[57,58,57,64],[57,60,58,57],[53,57,58,57],[56,57,64,57]],[[45,52,57,60],[46,53,58,62],[41,48,53,57],[40,47,52,56]])
compose('night',64,[[69,72,76,72],[67,71,74,71],[65,69,72,69],[64,68,71,68]],[[45,52,57,60],[43,50,55,59],[41,48,53,57],[40,47,52,56]])
print('Four original instrumental loops generated.')
