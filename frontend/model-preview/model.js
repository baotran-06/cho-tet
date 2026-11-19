import * as T from '../assets/vendor/three.module.js';
const canvas=document.querySelector('canvas');
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});}catch(e){const el=document.querySelector('#error');el.style.display='block';el.textContent='Trình duyệt chưa bật WebGL. Hãy bật tăng tốc đồ họa rồi mở lại.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new T.Scene();scene.background=new T.Color('#10151c');scene.fog=new T.Fog('#10151c',14,27);
const camera=new T.PerspectiveCamera(35,1,.1,70);
scene.add(new T.HemisphereLight(0xd9e8ff,0x37303a,2));
const key=new T.DirectionalLight(0xffe2bd,4);key.position.set(4,7,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-6,right:6,top:7,bottom:-5});key.shadow.normalBias=.025;scene.add(key);
const rim=new T.DirectionalLight(0x8eafff,3);rim.position.set(-4,4,-4);scene.add(rim);
const fill=new T.PointLight(0xe9c785,40,12);fill.position.set(-4,3,3);scene.add(fill);
const mat=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const skin=mat('#dfac8c',.58),skinShade=mat('#b77c63'),hair=mat('#16131a',.4),hairHi=mat('#30252b',.42),jacket=mat('#171d29',.75),lapel=mat('#222c3b',.5),pants=mat('#1a1d26'),shirt=mat('#ddd6cb'),tie=mat('#671d31',.48),shoe=mat('#0c111b',.27),eye=mat('#ebe5dc',.3),iris=mat('#332222',.3),black=mat('#141015'),gold=mat('#caa46b',.3,.75),lip=mat('#995e55');
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ell(parent,material,x,y,z,sx,sy,sz){const m=mesh(new T.SphereGeometry(1,28,20),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function box(parent,material,x,y,z,w,h,d){return mesh(new T.BoxGeometry(w,h,d),material,parent,x,y,z);}
function joint(parent,x,y,z){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function tube(parent,material,pts,r=.02){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));return mesh(new T.TubeGeometry(curve,24,r,8,false),material,parent);}
function shape(parent,material,pts,z,depth=.035){const s=new T.Shape();pts.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1}),material,parent,0,0,z);}
const floor=mesh(new T.PlaneGeometry(200,200),mat('#181f29'),scene);floor.rotation.x=-Math.PI/2;
const pedestal=mesh(new T.CylinderGeometry(2.1,2.16,.12,80),mat('#28313e',.6,.2),scene,0,.06,0);
mesh(new T.TorusGeometry(2.09,.018,8,100),gold,scene,0,.12,0).rotation.x=Math.PI/2;
const root=joint(scene,0,.12,0),hip=joint(root,0,1.94,0),torso=joint(hip,0,.02,0);
// Tailored torso with a tapered waist and broad shoulders.
const body=mesh(new T.CylinderGeometry(.51,.37,1.25,12),jacket,torso,0,.65,0);body.scale.z=.57;
ell(torso,jacket,-.43,1.11,0,.25,.21,.25);ell(torso,jacket,.43,1.11,0,.25,.21,.25);
shape(torso,shirt,[[-.22,1.26],[.22,1.26],[.16,.45],[-.12,.45]],.28);
shape(torso,tie,[[-.065,1.16],[.065,1.16],[.09,.62],[0,.52],[-.09,.62]],.316);
shape(torso,tie,[[-.075,1.25],[.075,1.25],[.05,1.12],[-.05,1.12]],.327);
shape(torso,lapel,[[-.45,1.28],[-.16,1.24],[-.06,.51],[-.35,.92],[-.27,1.03]],.32);
shape(torso,lapel,[[.45,1.28],[.16,1.24],[.06,.51],[.35,.92],[.27,1.03]],.32);
shape(torso,shirt,[[-.17,1.3],[0,1.22],[-.11,1.1],[-.24,1.24]],.34);shape(torso,shirt,[[.17,1.3],[0,1.22],[.11,1.1],[.24,1.24]],.34);
for(let y=.22;y<.55;y+=.18)ell(torso,gold,.065,y,.302,.032,.032,.018);
box(torso,lapel,.3,.91,.334,.16,.025,.04);shape(torso,tie,[[.24,.94],[.32,1.01],[.37,.94]],.35);
// Coat draped across the shoulders, separate mesh with brass details.
const coat=joint(torso,0,1.17,-.16);const c=mesh(new T.CylinderGeometry(.57,.61,1.65,12,1,true),jacket,coat,0,-.62,-.18);c.scale.z=.48;c.rotation.x=-.08;
for(const x of [-.58,.58]){const sleeve=mesh(new T.CylinderGeometry(.19,.13,1.22,14),lapel,coat,x,-.5,-.04);sleeve.rotation.z=x<0?-.1:.1;ell(coat,gold,x,-.1,.1,.028,.028,.015);}
mesh(new T.CylinderGeometry(.13,.14,.25,20),skin,torso,0,1.35,0);
const head=joint(torso,0,1.69,.005);
// Custom jaw profile rather than an unmodified spherical head.
const profile=[[0,-.36],[.15,-.33],[.25,-.22],[.29,-.03],[.28,.17],[.22,.3],[0,.34]].map(([x,y])=>new T.Vector2(x,y));
const face=mesh(new T.LatheGeometry(profile,48),skin,head);face.scale.z=.83;
for(const x of [-.29,.29]){ell(head,skin,x,-.015,0,.06,.105,.05);ell(head,skinShade,x*1.015,-.02,.033,.025,.06,.018);}
// Eyes set under angled brows; narrow lids and catchlights.
for(const side of [-1,1]){
 const x=side*.123;ell(head,eye,x,.026,.226,.075,.035,.024);ell(head,iris,x,.023,.249,.026,.029,.009);ell(head,black,x,.023,.258,.012,.021,.005);ell(head,eye,x-.008,.033,.263,.006,.007,.003);
 tube(head,skinShade,[[x-.072,.039,.235],[x,.061,.25],[x+.072,.037,.235]],.013);
 tube(head,hair,[[x-.077,.09+(side===-1?.02:0),.235],[x,.102,.247],[x+.075,.09+(side===1?.02:0),.23]],.024);
}
ell(head,skin,.002,-.046,.251,.043,.075,.045);ell(head,skinShade,0,-.098,.268,.04,.012,.018);
tube(head,lip,[[-.065,-.178,.212],[0,-.181,.233],[.065,-.174,.211]],.009);
tube(head,skinShade,[[-.075,-.19,.205],[0,-.202,.219],[.065,-.186,.207]],.005);
// Swept sculptural hair locks with fine ridges, not a helmet sphere.
ell(head,hair,0,.22,-.018,.302,.2,.253);
for(let i=0;i<14;i++){
 const x=-.26+i*.037;
 tube(head,i%3?hair:hairHi,[[x,.16,.16],[x-.045,.28,.23],[x+.04,.39,.13],[x+.17,.29,-.095]],.045+(i%3)*.005);
}
for(const side of [-1,1])ell(head,hair,side*.269,.105,-.03,.035,.14,.16);
const arms=[],legs=[];
for(const side of [-1,1]){
 const arm=joint(torso,side*.56,1.08,0);arms.push(arm);
 const upper=mesh(new T.CylinderGeometry(.16,.135,.64,18),jacket,arm,0,-.29,0);
 const elbow=joint(arm,0,-.6,0);const fore=mesh(new T.CylinderGeometry(.13,.10,.57,18),jacket,elbow,0,-.265,0);arm.userData.elbow=elbow;
 mesh(new T.CylinderGeometry(.104,.104,.06,18),shirt,elbow,0,-.535,0);
 ell(elbow,shoe,0,-.63,.015,.11,.14,.075);
 for(let f=0;f<4;f++)ell(elbow,shoe,-.065+f*.043,-.735,.015,.023,.075,.04);
 ell(elbow,shoe,side*.10,-.65,.043,.034,.08,.04);
 ell(arm,gold,side*.11,-.46,.055,.015,.018,.012);
 const thigh=joint(hip,side*.215,-.03,0);legs.push(thigh);mesh(new T.CylinderGeometry(.20,.155,.89,18),pants,thigh,0,-.43,0);
 const knee=joint(thigh,0,-.86,0);thigh.userData.knee=knee;mesh(new T.CylinderGeometry(.15,.105,.91,18),pants,knee,0,-.43,0);
 ell(knee,shoe,0,-.93,.12,.15,.115,.30);box(knee,black,0,-1.015,.12,.27,.035,.49);
 tube(thigh,lapel,[[0,-.07,.19],[0,-.4,.18],[0,-.8,.15]],.006);
}
// Armchair stays in the room when the character walks away.
const chair=joint(scene,0,.12,-.18),leather=mat('#28242b',.42),frame=mat('#58515b',.25,.65);
box(chair,leather,0,1.15,-.06,1.16,.2,.95);
const back=box(chair,leather,0,1.91,-.48,1.17,1.4,.17);back.rotation.x=-.08;
for(let i=0;i<4;i++)box(chair,mat('#36303a',.5),0,1.45+i*.28,-.375,1.03,.23,.055);
for(const side of [-1,1]){box(chair,frame,side*.66,.98,0,.07,.53,.07);box(chair,leather,side*.66,1.28,0,.18,.12,.75);}
mesh(new T.CylinderGeometry(.07,.09,.86,20),frame,chair,0,.53,-.1);
for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leg=box(chair,frame,Math.sin(a)*.35,.13,Math.cos(a)*.35-.1,.07,.06,.72);leg.rotation.y=a;ell(chair,black,Math.sin(a)*.69,.09,Math.cos(a)*.69-.1,.10,.08,.10);}
chair.visible=false;
let action='idle',sitting=0,walking=0,orbit=0,pitch=.14,radius=7.6,auto=false,drag=null,clock=new T.Clock(),time=0;
const status=document.querySelector('#status');
function setAction(a){action=a;chair.visible=a==='sit'||a==='stand';document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.action===a));status.textContent={idle:'Đứng · thở nhẹ và nhìn quanh',sit:'Ngồi xuống ghế · khớp hông, gối và tay chuyển động',stand:'Đứng dậy · trở về tư thế đứng',walk:'Đi vòng · chân và tay chuyển động đối xứng'}[a];}
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>setAction(b.dataset.action));document.querySelector('#turn').onclick=()=>{auto=!auto;document.querySelector('#turn').textContent=auto?'Dừng xoay':'Xoay 360°';};document.querySelector('#reset').onclick=()=>{auto=false;orbit=0;pitch=.14;radius=7.6;document.querySelector('#turn').textContent='Xoay 360°';};
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);auto=false;};canvas.onpointermove=e=>{if(!drag)return;orbit-=(e.clientX-drag.x)*.008;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.004,-.12,.7);drag={x:e.clientX,y:e.clientY};};canvas.onpointerup=()=>drag=null;canvas.onwheel=e=>{e.preventDefault();radius=T.MathUtils.clamp(radius+e.deltaY*.004,4.5,12);};
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();
function update(){const dt=Math.min(.05,clock.getDelta());time+=dt;sitting=T.MathUtils.damp(sitting,action==='sit'?1:0,4,dt);walking=T.MathUtils.damp(walking,action==='walk'?1:0,4,dt);if(auto)orbit+=dt*.35;
 const p=time*4.2,step=Math.sin(p)*walking;
 hip.position.y=1.94-sitting*.66+Math.abs(Math.sin(p))*walking*.05;torso.rotation.x=sitting*.035;head.rotation.y=Math.sin(time*.55)*.07;head.rotation.x=Math.sin(time*.9)*.018;
 torso.scale.y=1+Math.sin(time*1.6)*.005;
 legs.forEach((leg,i)=>{const sign=i?1:-1;leg.rotation.x=-sitting*Math.PI/2+step*sign*.42;leg.userData.knee.rotation.x=sitting*Math.PI/2+Math.max(0,-step*sign)*.65;});
 arms.forEach((arm,i)=>{arm.rotation.x=-sitting*.4-step*(i?1:-1)*.26;arm.rotation.z=(i?1:-1)*(.06+sitting*.06);arm.userData.elbow.rotation.x=-.12-sitting*.85;});
 root.position.x=walking*Math.sin(time*.65)*1.4;root.position.z=walking*Math.cos(time*.65)*.4;root.rotation.y=walking*(Math.cos(time*.65)>.0?Math.PI/2:-Math.PI/2);
 const target=new T.Vector3(0,2.15,0);const r=radius*(innerWidth/innerHeight<.7?1.15:1);camera.position.set(Math.sin(orbit)*r,2.15+Math.sin(pitch)*r,Math.cos(orbit)*r);camera.lookAt(target);renderer.render(scene,camera);requestAnimationFrame(update);
}
window.__model={scene,root,renderer,legs,arms,setAction,get action(){return action;},get sitting(){return sitting;}};update();
