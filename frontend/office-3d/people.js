import * as T from '../assets/vendor/three.module.js';
const mat=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const skin=mat('#dfac8c',.58),skinShade=mat('#b77c63'),hair=mat('#16131a',.4),hairHi=mat('#30252b',.42),jacket=mat('#171d29',.75),lapel=mat('#222c3b',.5),pants=mat('#1a1d26'),shirt=mat('#ddd6cb'),tie=mat('#671d31',.48),shoe=mat('#0c111b',.27),eye=mat('#ebe5dc',.3),iris=mat('#332222',.3),black=mat('#141015'),gold=mat('#caa46b',.3,.75),lip=mat('#995e55');
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ell(parent,material,x,y,z,sx,sy,sz){const m=mesh(new T.SphereGeometry(1,28,20),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function box(parent,material,x,y,z,w,h,d){return mesh(new T.BoxGeometry(w,h,d),material,parent,x,y,z);}
function joint(parent,x,y,z){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function tube(parent,material,pts,r=.02){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));return mesh(new T.TubeGeometry(curve,24,r,8,false),material,parent);}
function shape(parent,material,pts,z,depth=.035){const s=new T.Shape();pts.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1}),material,parent,0,0,z);}

export function person(kind='ceo'){
const holder=new T.Group();
const jacket=mat(kind==='secretary'?'#e8dcc4':kind==='lieu'?'#76233e':'#171d29');
const lapel=mat(kind==='secretary'?'#d5c8b1':kind==='lieu'?'#6a213b':'#222c3b');
const tie=mat(kind==='ceo'?'#671d31':kind==='secretary'?'#dfcfa9':'#34202b');
const root=joint(holder,0,0,0),hip=joint(root,0,1.94,0),torso=joint(hip,0,.02,0);
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

if(kind!=='ceo'){
 coat.visible=false;holder.scale.x=.88;
 // Skirt, stockings and heels; a fitted blouse rather than the man's trousers.
 const skirt=mesh(new T.CylinderGeometry(.38,.49,.72,28),jacket,hip,0,-.33,0);skirt.scale.z=.65;
 for(const leg of legs){
  leg.children[0].visible=false;
  leg.userData.knee.children[0].material=skin;
  leg.userData.knee.children[0].scale.set(.78,1,.78);
 }
 // Long dark hair behind the face and swept side locks.
 ell(head,hair,0,-.15,-.12,.33,.43,.16);
 for(const side of [-1,1])tube(head,hair,[[side*.26,.17,.04],[side*.30,-.05,.06],[side*.29,-.35,.02],[side*.34,-.53,-.02]],.065);
 if(kind==='lieu'){
  ell(head,hair,0,.18,-.30,.13,.15,.13);
  tube(head,hair,[[0,.19,-.32],[.04,-.12,-.40],[.12,-.56,-.33]],.12);
 }else{
  for(const x of [-.07,.07])ell(head,shirt,x,.25,-.28,.10,.06,.025);
  ell(torso,shirt,-.1,1.17,.36,.1,.045,.03);ell(torso,shirt,.1,1.17,.36,.1,.045,.03);
 }
}

return {holder,root,hip,torso,head,arms,legs,kind,jacket};
}

export function pose(rig,t,sit=0,walk=0){
 rig.hip.position.y=1.94-sit*.66+Math.abs(Math.sin(t*5))*walk*.04;
 rig.torso.rotation.x=sit*.035;
 rig.head.rotation.y=Math.sin(t*.55)*.06;
 rig.torso.scale.y=1+Math.sin(t*1.6)*.004;
 rig.legs.forEach((l,i)=>{const s=i?1:-1;l.rotation.x=-sit*Math.PI/2+Math.sin(t*5)*walk*s*.45;l.userData.knee.rotation.x=sit*Math.PI/2+Math.max(0,-Math.sin(t*5)*s)*walk*.65;});
 rig.arms.forEach((a,i)=>{a.rotation.x=-sit*.4-Math.sin(t*5)*walk*(i?1:-1)*.3;a.rotation.z=(i?1:-1)*.06;a.userData.elbow.rotation.x=-.12-sit*.85;});
}
