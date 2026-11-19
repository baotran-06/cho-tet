import * as T from '../assets/vendor/three.module.js';
import {person,pose} from './people.js';
import {Client} from '../js/client.js';
import {OfficeAudio} from '../js/office-audio.js';
import config from '../config/office.json' with {type:'json'};
import voices from '../config/voices.json' with {type:'json'};
const $=id=>document.getElementById(id),canvas=document.querySelector('canvas'),frame=$('app');
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true});}catch(e){$('error').hidden=false;$('error').textContent='Cần bật tăng tốc đồ họa WebGL trong trình duyệt.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new T.Scene();scene.background=new T.Color('#152438');scene.fog=new T.Fog('#152438',24,48);
const camera=new T.PerspectiveCamera(45,1,.1,80);
scene.add(new T.HemisphereLight(0xd4e8ff,0x504139,2.2));
const sun=new T.DirectionalLight(0xffe5c6,3.5);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:13,bottom:-13});sun.shadow.normalBias=.035;scene.add(sun);
const rim=new T.DirectionalLight(0x8db8ff,2);rim.position.set(5,5,-10);scene.add(rim);
const materials={wood:new T.MeshStandardMaterial({color:'#4e3027',roughness:.6}),metal:new T.MeshStandardMaterial({color:'#bea16a',metalness:.55,roughness:.4}),desk:new T.MeshStandardMaterial({color:'#35485a'}),black:new T.MeshStandardMaterial({color:'#142332'}),seat:new T.MeshStandardMaterial({color:'#31394a'}),screen:new T.MeshStandardMaterial({color:'#5ac9d8',emissive:'#235d73',emissiveIntensity:.5}),floor:new T.MeshStandardMaterial({color:'#526578',roughness:.85})};
function box(w,h,d,m,x,y,z,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function sphere(r,m,x,y,z,parent=scene){const o=new T.Mesh(new T.SphereGeometry(r,12,8),m);o.position.set(x,y,z);parent.add(o);return o;}
box(15,.2,23,materials.floor,0,-.12,1);box(14.5,.3,5,materials.wood,0,.12,-5.4);box(15,7,.25,materials.black,0,3.3,-8);
const glass=new T.MeshStandardMaterial({color:'#24496a',emissive:'#19344b',emissiveIntensity:.4,roughness:.3});
for(let i=-2;i<=2;i++){box(2.55,4,.06,glass,i*2.8,3.65,-7.82);box(.06,4,.12,materials.metal,i*2.8-1.3,3.65,-7.75);for(let j=0;j<4;j++)box(.25,.16,.1,materials.screen,i*2.8-.8+j*.5,2+((i+j+4)%3)*.5,-7.7);}
box(7,.14,1.4,materials.wood,0,1.5,-5.05);box(6.4,1.25,.25,materials.wood,0,.83,-4.57);box(6.3,.025,.06,materials.metal,0,1.36,-4.41);
box(.72,.30,.06,materials.black,-2.25,1.72,-5.0);box(.55,.03,.35,materials.metal,-2.25,1.59,-5.0);
function chair(x,z,executive=false){const g=new T.Group();g.position.set(x,0,z);scene.add(g);box(executive?1.1:.7,.15,.7,materials.seat,0,.58,0,g);box(executive?1.1:.7,executive?1.15:.65,.1,materials.seat,0,executive?1.2:.93,.34,g);for(const a of [-1,1])box(.07,.55,.07,materials.black,a*.25,.28,0,g);return g;}
const throne=chair(-.75,-5.95,true);throne.rotation.y=Math.PI;throne.scale.setScalar(1.25);throne.position.y=.37;
box(.65,.2,.45,materials.wood,-.75,.37,-5.1);
const slots=[];
for(let row=0;row<4;row++)for(const x of [-3.9,-1.7,1.7,3.9]){
 const z=-1+row*2.5;slots.push(new T.Vector3(x,0,z+.3));
 box(1.65,.12,1.05,materials.desk,x,.82,z-.48);for(const side of [-1,1])box(.08,.8,.7,materials.black,x+side*.68,.37,z-.48);
 const monitor=box(.66,.4,.065,materials.black,x,1.12,z-.63);box(.59,.32,.025,materials.screen,x,1.12,z-.585);box(.06,.14,.06,materials.metal,x,.9,z-.63);
 box(.54,.025,.17,materials.black,x,.89,z-.18);chair(x,z+.32);
}
// Plants, soft ceiling lamps and office details keep the room readable at a wide angle.
const leaves=new T.MeshStandardMaterial({color:'#307f55'});
for(const x of [-6.5,6.5])for(const z of [-6.5,1,7]){box(.6,.6,.6,materials.wood,x,.3,z);for(let i=0;i<5;i++){const o=sphere(.35,leaves,x+Math.sin(i*2)*.25,.9+i*.13,z+Math.cos(i*2)*.2);o.scale.y=1.5;}}
const ceilingMat=new T.MeshStandardMaterial({color:'#fff0ce',emissive:'#ffe2aa',emissiveIntensity:2});for(const x of [-4,4])for(const z of [-4,2,7])box(1.3,.04,.35,ceilingMat,x,6.5,z);
const ceo=person('ceo'),secretary=person('secretary'),lieu=person('lieu');
for(const rig of [ceo,secretary,lieu]){scene.add(rig.holder);rig.holder.scale.multiplyScalar(.78);}
const station={ceo:new T.Vector3(-.75,.28,-5.95),secretary:new T.Vector3(.55,.28,-6.35)};
ceo.holder.position.copy(station.ceo);secretary.holder.position.copy(station.secretary);lieu.holder.position.set(8,.28,-5.5);lieu.holder.visible=false;
const labelRoot=$('names'),labels=[];
function label(name,obj,height,vip=false){const el=document.createElement('div');el.className='label'+(vip?' vip':'');el.textContent=name;labelRoot.append(el);const item={el,obj,height,vip};labels.push(item);return item;}
const ceoLabel=label('Tổng tài',ceo.holder,2.52,true),secretaryLabel=label('Thư ký',secretary.holder,2.7,true),lieuLabel=label('Liễu Như Yên',lieu.holder,2.7,true);
const staff=new Map(),staffSkin=new T.MeshStandardMaterial({color:'#dbab8b'}),staffHair=new T.MeshStandardMaterial({color:'#29202a'}),uniforms=['#91b6c9','#d0c0a0','#b6b0cc','#9eaeb9'].map(color=>new T.MeshStandardMaterial({color}));
// Small employees use a lightweight articulated rig; the three lead characters are more detailed.
function employee(user,index){
 const holder=new T.Group();scene.add(holder);holder.position.set(0,0,10.5);holder.rotation.y=Math.PI;
 const body=new T.Group();holder.add(body);body.position.y=.64;
 box(.40,.55,.24,uniforms[index%4],0,.24,0,body);sphere(.185,staffSkin,0,.7,0,body);const hair=sphere(.19,staffHair,0,.77,-.02,body);hair.scale.y=.65;
 const legs=[],arms=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.12,0,0);body.add(leg);box(.13,.35,.15,materials.black,0,-.16,0,leg);const knee=new T.Group();knee.position.y=-.34;leg.add(knee);box(.11,.32,.12,materials.black,0,-.15,0,knee);box(.13,.10,.25,materials.black,0,-.31,.07,knee);leg.userData.knee=knee;legs.push(leg);const arm=new T.Group();arm.position.set(side*.27,.47,0);body.add(arm);box(.12,.4,.13,uniforms[index%4],0,-.18,0,arm);sphere(.065,staffSkin,0,-.4,0,arm);arms.push(arm);}
 const entry={id:user.id,holder,body,legs,arms,index,sit:0,phase:'entering',route:[],role:null,targetRole:null,name:user.name};entry.label=label(user.name,holder,1.7);return entry;
}
function routeTo(entry,target,stage=false){
 const p=entry.holder.position,points=[];
 if(p.z<-4.3){const side=p.x<0?-4.15:4.15;points.push(new T.Vector3(p.x,.28,-6.95),new T.Vector3(side,.28,-6.95),new T.Vector3(side,.28,-3.5),new T.Vector3(0,0,-3.5));}
 else points.push(new T.Vector3(p.x,0,p.z+.5),new T.Vector3(0,0,p.z+.5));
 if(stage){const side=target.x<0?-4.15:4.15;points.push(new T.Vector3(0,0,-3.5),new T.Vector3(side,.28,-3.5),new T.Vector3(side,.28,-6.95),new T.Vector3(target.x,.28,-6.95));}
 else points.push(new T.Vector3(0,0,target.z+.6),new T.Vector3(target.x,0,target.z+.6));
 points.push(target.clone());entry.route=points;entry.phase='walking';
}
let state=null,receivedAt=performance.now(),now=0,clock=new T.Clock(),time=0,activeKey=null,previousRoles={ceo:null,secretary:null},showClose=false,busy=false,drag=null,yaw=0;
const audio=new OfficeAudio(message=>$('audio').textContent=message);
const client=new Client(s=>{
 state=s;receivedAt=performance.now();if(!s.office)return;
 $('status').textContent=(s.mode==='DEMO'?'DEMO · Nhân viên mô phỏng':s.liveEvidence?.verified?'LIVE · Đã nhận sự kiện thật':'LIVE · Chờ sự kiện thật')+' · '+Math.min(16,s.users.filter(u=>!u.departedAt).length)+' nhân viên';
 const roleIds=new Set([s.office.ceo.id,s.office.secretary.id]);const valid=s.users.filter(u=>u.seat!==null||roleIds.has(u.id)).sort((a,b)=>Number(roleIds.has(b.id))-Number(roleIds.has(a.id))).slice(0,16),ids=new Set(valid.map(u=>u.id));
 for(const [id,e] of staff)if(!ids.has(id)){scene.remove(e.holder);e.holder.traverse(o=>{if(o.isMesh)o.geometry.dispose();});e.label.el.remove();labels.splice(labels.indexOf(e.label),1);staff.delete(id);}
 for(const user of valid){let e=staff.get(user.id);if(!e){const occupied=new Set([...staff.values()].map(e=>e.index));e=employee(user,slots.findIndex((_,i)=>!occupied.has(i)));staff.set(user.id,e);routeTo(e,slots[e.index]);}e.name=user.name;e.label.el.textContent=user.name;
  if(user.departedAt&&!['leaving','gone'].includes(e.phase)){e.phase='leaving';e.route=[new T.Vector3(0,0,e.holder.position.z+.5),new T.Vector3(0,0,12)];e.targetRole=null;e.role=null;}
 }
 for(const e of staff.values()){
  if(['leaving','gone'].includes(e.phase))continue;
  const desired=s.office.ceo.id===e.id?'ceo':s.office.secretary.id===e.id&&s.office.secretary.present?'secretary':null;
  if(e.targetRole!==desired){e.targetRole=desired;e.role=null;e.holder.visible=true;routeTo(e,desired?station[desired]:slots[e.index],Boolean(desired));}
 }
 const active=s.office.active;if(active?.id!==activeKey){activeKey=active?.id??null;if(active){const g=config.guide.find(g=>g.key===active.key);$('toast').textContent=active.name+' · '+g.effect;$('toast').hidden=false;}else $('toast').hidden=true;}
 audio.update(s);
});
for(const gift of config.guide){const b=document.createElement('button');const img=new Image();img.src='../assets/gifts/'+gift.icon+'.webp';img.alt='';const t=document.createElement('span'),small=document.createElement('span'),strong=document.createElement('strong');small.textContent=gift.label;strong.textContent=gift.effect;t.append(small,strong);b.append(img,t);b.onclick=async()=>{if(state?.mode!=='DEMO'){notify('LIVE chỉ nhận quà TikTok thật.');return;}const e=[...staff.values()].find(e=>!e.role&&e.phase!=='leaving');try{await client.command('demo',{type:'gift',giftName:gift.gift,viewer:e?Number(e.id.replace('demo-','')):1,name:e?.name??'Nhân viên DEMO'});}catch(err){notify(err.message);}};$('gifts').append(b);}
function notify(t){$('toast').textContent=t;$('toast').hidden=false;}
$('join').onclick=async()=>{if(state?.mode!=='DEMO'){notify('Không tạo người xem giả trong LIVE.');return;}await client.command('demo',{type:'join',amount:12});};
$('audio').onclick=()=>audio.start().catch(e=>notify(e.message));$('overview').onclick=()=>{showClose=false;yaw=0;};$('focus').onclick=()=>{showClose=true;yaw=0;};
canvas.onpointerdown=e=>{drag=e.clientX;canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(drag===null)return;yaw=T.MathUtils.clamp(yaw+(e.clientX-drag)*.003,-.4,.4);drag=e.clientX;};canvas.onpointerup=()=>drag=null;
function resize(){renderer.setSize(frame.clientWidth,frame.clientHeight);camera.aspect=frame.clientWidth/frame.clientHeight;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(frame);resize();
const look=new T.Vector3(),destination=new T.Vector3(),v=new T.Vector3();camera.position.set(0,13,20);
function update(){const dt=Math.min(.25,clock.getDelta());time+=dt;now=(state?.serverTime??Date.now())+Math.min(500,performance.now()-receivedAt);
 const active=state?.office?.active,key=active?.key,elapsed=active?(now-active.started)/1000:0;
 const sceneLines=voices[key]?.[active?.variant%voices[key]?.length]?.lines??[];
 const sceneAfter=sceneLines.length?sceneLines.at(-1).at+sceneLines.at(-1).duration:2;
 const targets={ceo:ceo,secretary:secretary};
 ceo.holder.position.copy(station.ceo);secretary.holder.position.copy(station.secretary);ceo.holder.rotation.set(0,0,0);secretary.holder.rotation.set(0,0,0);
 let ceoSit=1;
 for(const [id,e] of staff){
  const moving=e.route.length>0;e.sit=T.MathUtils.damp(e.sit,moving?0:1,7,dt);
  if(moving&&e.sit<.2){const target=e.route[0];v.copy(target).sub(e.holder.position);const distance=v.length();if(distance<.065){e.holder.position.copy(target);e.route.shift();if(!e.route.length){e.phase=e.targetRole?'promoted':e.phase==='leaving'?'gone':'working';e.role=e.targetRole;if(e.role)e.holder.visible=false;else e.holder.rotation.y=Math.PI;}}else{v.normalize();e.holder.position.addScaledVector(v,Math.min(distance,dt*2.1));e.holder.rotation.y=Math.atan2(v.x,v.z);}}
  e.body.position.y=.8-e.sit*.22+(moving?Math.abs(Math.sin(time*7))*.025:0);e.legs.forEach((l,i)=>{l.rotation.x=-e.sit*Math.PI/2+(moving?Math.sin(time*7+i*Math.PI)*.5:0);l.userData.knee.rotation.x=e.sit*Math.PI/2+Math.max(0,-Math.sin(time*7+i*Math.PI))*(moving?.4:0);});e.arms.forEach((a,i)=>a.rotation.x=moving?Math.sin(time*7+i*Math.PI)*.3:-.8+Math.sin(time*5+i)*.035);
  if(e.phase==='gone')e.holder.visible=false;
 }
 for(const [role,rig] of Object.entries(targets)){
  const data=state?.office?.[role],e=staff.get(data?.id),arrived=e?.role===role;
  const text=data?.id&&(!e||arrived)?'@'+data.name:role==='ceo'?'Tổng tài':'Thư ký';(role==='ceo'?ceoLabel:secretaryLabel).el.textContent=text;
  rig.holder.visible=data?.present!==false;
  const palettes=role==='ceo'?['#171d29','#28364a','#33302c']:['#e8dcc4','#d6cad9','#bfd4d8'];rig.jacket.color.set(palettes[data?.look??0]);
 }
 lieu.holder.visible=key==='lieu';
 if(key==='wedding'){ceoSit=0;ceo.holder.position.set(-.7,.28,-3.7);secretary.holder.position.set(.7,.28,-3.7);ceo.holder.rotation.y=.22;secretary.holder.rotation.y=-.22;}
 if(key==='kiss'){ceoSit=0;ceo.holder.position.x+=Math.min(1,Math.max(0,(elapsed-sceneAfter)/1.3))*.85;ceo.holder.rotation.z=-.09;secretary.holder.rotation.z=.06;}
 if(key==='fire'){secretary.holder.position.set(.55+Math.min(1,Math.max(0,(elapsed-sceneAfter)/1.6))*7,.28,-6.35);secretary.holder.rotation.y=Math.PI/2;}
 if(key==='bedroom'){ceo.holder.visible=false;secretary.holder.visible=false;}
 if(key==='lieu'){lieu.holder.position.set(7-Math.min(1,elapsed/3)*5.5,.28,-5.1);lieu.holder.rotation.y=-.4;lieuLabel.el.textContent='@'+active.name;}
 pose(ceo,time,ceoSit,0);pose(secretary,time,0,key==='fire'?1:0);pose(lieu,time,0,elapsed<3?1:0);
 if(key==='lieu'&&elapsed>sceneAfter&&elapsed<sceneAfter+.75){const swing=Math.sin((elapsed-sceneAfter)/.75*Math.PI);lieu.arms[0].rotation.z=-swing*1.4;lieu.arms[0].rotation.x=-swing*.8;secretary.holder.rotation.z=-swing*.12;}
 ceoLabel.height=(ceo.hip.position.y+2.11)*.78+.08;secretaryLabel.height=(secretary.hip.position.y+2.11)*.78+.08;lieuLabel.height=(lieu.hip.position.y+2.11)*.78+.08;
 const lines=voices[key]?.[active?.variant%voices[key]?.length]?.lines??[],cue=lines.find(l=>elapsed>=l.at&&elapsed<l.at+l.duration)??audio.idleCaption;
 $('subtitle').hidden=!cue;if(cue){$('subtitle').querySelector('strong').textContent={ceo:'Tổng tài',secretary:'Thư ký',lieu:'Liễu Như Yên',mc:'MC công ty'}[cue.role];$('subtitle').querySelector('span').textContent=cue.text;if(targets[cue.role])targets[cue.role].head.rotation.x=Math.sin(time*12)*.025;}
 const close=showClose||['kiss','lieu','fire','wedding','bedroom'].includes(key);destination.set(Math.sin(yaw)*(close?10:22),close?6.1:13,close?4:23);camera.position.lerp(destination,1-Math.exp(-dt*3));look.set(0,close?2.2:0,close?-5:-1);camera.lookAt(look);
 const used=[];for(const item of labels.sort((a,b)=>Number(b.vip)-Number(a.vip))){const {obj,el,height}=item;if(!obj.visible){el.hidden=true;continue;}v.copy(obj.position);v.y+=height;v.project(camera);const x=(v.x*.5+.5)*frame.clientWidth;let y=(-v.y*.5+.5)*frame.clientHeight;let overlap=used.some(p=>Math.abs(p.x-x)<95&&Math.abs(p.y-y)<22);if(item.vip)for(let i=0;i<3&&overlap;i++){y-=24;overlap=used.some(p=>Math.abs(p.x-x)<95&&Math.abs(p.y-y)<22);}el.hidden=v.z>1||Math.abs(v.x)>1||y>frame.clientHeight*.76||overlap;if(!el.hidden){el.style.left=x+'px';el.style.top=y+'px';used.push({x,y});}}
 renderer.render(scene,camera);requestAnimationFrame(update);
}
window.__office3d={scene,staff,ceo,secretary,lieu,client,audio,get state(){return state;}};update();window.addEventListener('pagehide',()=>{client.close();audio.close();renderer.dispose();},{once:true});
