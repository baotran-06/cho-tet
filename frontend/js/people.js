import * as T from '../assets/vendor/three.module.js';
const material=(color,roughness=.55,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const skin=material('#f0bc9e'),cheek=material('#ed9b91'),hair=material('#281b22',.32),hairLight=material('#493039',.4),white=material('#fff6e8',.38),black=material('#151522',.4),gold=material('#edbd67',.25,.65),lip=material('#b56868'),eye=material('#fffdf4',.2),iris=material('#4b2b26',.2);
const sphere=new T.SphereGeometry(1,24,18);
function ell(p,m,x,y,z,sx,sy,sz){const o=new T.Mesh(sphere,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function joint(p,x,y,z){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
function cyl(p,m,x,y,z,r1,r2,h){const o=new T.Mesh(new T.CylinderGeometry(r1,r2,h,24),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function curve(p,m,points,r=.012){const c=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a)));const o=new T.Mesh(new T.TubeGeometry(c,20,r,8,false),m);o.castShadow=true;p.add(o);return o;}
function panel(p,m,points,z){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const o=new T.Mesh(new T.ShapeGeometry(s),m);o.position.z=z;p.add(o);return o;}
export function person(kind='groom'){
 const bride=kind==='bride',holder=new T.Group(),root=joint(holder,0,0,0),hip=joint(root,0,1.65,0),torso=joint(hip,0,0,0),head=joint(torso,0,1.52,0),weddingWear=joint(torso,0,0,0),dailyWear=joint(torso,0,0,0),weddingHead=joint(head,0,0,0),jacket=material(bride?'#fff2e4':'#172238',.4),arms=[],legs=[];
 const body=cyl(weddingWear,jacket,0,.59,0,.42,.28,1.02);body.scale.z=.64;
 for(const x of [-.33,.33])ell(weddingWear,jacket,x,.94,0,.18,.16,.22);
 cyl(torso,skin,0,1.13,0,.12,.13,.27);
 // Soft sculpted head and large glassy eyes, with blush and raised smiling cheeks.
 ell(head,skin,0,0,0,.43,.48,.37);ell(head,skin,0,-.21,.06,.32,.25,.29);
 for(const side of [-1,1]){
  ell(head,skin,side*.42,-.02,0,.065,.11,.06);
  ell(head,eye,side*.175,.04,.315,.118,.133,.045);ell(head,iris,side*.175,.035,.351,.073,.095,.023);ell(head,black,side*.174,.035,.37,.037,.067,.009);ell(head,eye,side*.159,.078,.38,.022,.028,.005);ell(head,eye,side*.19,.012,.381,.009,.012,.004);
  curve(head,hair,[[side*.175-.115,.14,.34],[side*.175,.177,.361],[side*.175+.115,.14,.34]],bride?.012:.019);
  curve(head,hair,[[side*.175-.09,.24,.30],[side*.175,.266,.318],[side*.175+.09,.24,.30]],.02);
  ell(head,cheek,side*.285,-.12,.3,.065,.031,.008);
 }
 ell(head,skin,0,-.035,.365,.047,.06,.051);curve(head,lip,[[-.09,-.19,.315],[0,-.228,.344],[.09,-.19,.315]],.015);curve(head,white,[[-.067,-.195,.327],[0,-.208,.35],[.067,-.195,.327]],.011);
 // Rounded locks follow the scalp; separate swept strands create a shaped silhouette.
 ell(head,hair,0,.285,-.07,.445,.26,.345);
 if(!bride){for(let i=0;i<8;i++){const x=-.34+i*.085;const lock=ell(head,i%3?hair:hairLight,x,.32+Math.sin(i*.5)*.05,.18,.105,.22,.14);lock.rotation.z=-.45;}for(const x of [-.39,.39])ell(head,hair,x,.14,-.03,.07,.23,.22);
  panel(weddingWear,white,[[-.22,1.03],[.22,1.03],[.14,.24],[-.14,.24]],.28);
  for(const side of [-1,1]){panel(weddingWear,black,[[side*.37,1.04],[side*.17,1.04],[side*.055,.35],[side*.29,.73]],.3);ell(weddingWear,black,side*.08,.91,.33,.095,.05,.025);}
  for(const y of [.39,.56,.73])ell(weddingWear,gold,0,y,.294,.018,.018,.012);
  ell(weddingWear,material('#c94c75'),.27,.83,.29,.065,.065,.03);curve(weddingWear,gold,[[.27,.79,.29],[.27,.67,.29]],.008);
 }else{
  ell(head,hair,0,-.06,-.24,.46,.47,.17);ell(head,hair,0,.43,-.25,.24,.22,.22);
  for(const side of [-1,1])for(let i=0;i<4;i++){const x=side*(.19+i*.067);const lock=ell(head,i%2?hair:hairLight,x,.25-i*.045,.24-i*.026,.12,.20,.1);lock.rotation.z=side*-.65;}
  for(const side of [-1,1]){curve(head,hair,[[side*.36,.2,.15],[side*.43,-.05,.17],[side*.36,-.28,.12],[side*.39,-.43,.07]],.065);ell(head,gold,side*.42,-.12,.08,.022,.065,.022);}
  // Smooth flared skirt with a train, pearl details, sweetheart neckline and sheer veil.
  const dress=cyl(weddingWear,white,0,-.75,0,.27,1.02,1.65);dress.scale.z=.83;
  ell(weddingWear,white,0,-1.54,-.67,.98,.065,1.25);
  for(const x of [-.15,.15])ell(weddingWear,white,x,.83,.2,.22,.20,.14);
  const belt=new T.Mesh(new T.TorusGeometry(.285,.025,8,40),gold);belt.rotation.x=Math.PI/2;belt.position.y=.07;weddingWear.add(belt);
  for(let i=0;i<13;i++){const a=i/13*Math.PI*2;ell(weddingWear,gold,Math.sin(a)*.282,.08,Math.cos(a)*.19,.018,.018,.018);}
  const veil=new T.Mesh(new T.PlaneGeometry(1.05,1.65,6,8),new T.MeshStandardMaterial({color:'#fff8ed',transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false}));veil.position.set(0,-.28,-.4);veil.rotation.x=-.16;weddingHead.add(veil);
  const points=[];for(let i=0;i<9;i++){const x=-.32+i*.08,y=.36+Math.sin(i/8*Math.PI)*.14;points.push([x,y,.15]);ell(weddingHead,white,x,y+.026,.17,.025,.038,.025);}curve(weddingHead,gold,points,.014);
 }
 for(const side of [-1,1]){
  const arm=joint(torso,side*.43,.89,0);arms.push(arm);const sleeve=bride?white:jacket;
  ell(arm,sleeve,0,-.08,0,.15,.20,.15);cyl(arm,bride?skin:jacket,0,-.26,0,.115,.095,.45);const elbow=joint(arm,0,-.49,0);arm.userData.elbow=elbow;cyl(elbow,bride?skin:jacket,0,-.22,0,.095,.073,.44);if(!bride)cyl(elbow,white,0,-.43,0,.076,.078,.06);ell(elbow,skin,0,-.51,.015,.09,.12,.065);
  for(let i=0;i<4;i++)ell(elbow,skin,-.054+i*.035,-.593,.025,.018,.052,.027);ell(elbow,skin,side*.075,-.5,.05,.027,.06,.03);
  const leg=joint(hip,side*.16,-.03,0);legs.push(leg);cyl(leg,black,0,-.37,0,.145,.115,.75);const knee=joint(leg,0,-.74,0);leg.userData.knee=knee;cyl(knee,black,0,-.36,0,.115,.08,.72);ell(knee,black,0,-.76,.11,.13,.085,.25);
 }
 const bouquet=joint(arms[1].userData.elbow,0,-.56,.18),rose=material('#e786a6');for(let i=0;i<11;i++){const a=i*2.4,r=Math.sqrt(i)*.05;ell(bouquet,i%2?rose:white,Math.sin(a)*r,.09+i%3*.035,Math.cos(a)*r,.065,.065,.065);}cyl(bouquet,material('#4d7359'),0,-.06,0,.035,.035,.24);bouquet.visible=bride;dailyWear.visible=false;
 return {holder,root,hip,torso,head,arms,legs,kind,jacket,weddingWear,weddingHead,dailyWear,normalExtras:[],bouquet};
}
export function weddingOutfit(rig,on){rig.weddingWear.visible=on;rig.weddingHead.visible=on;rig.bouquet.visible=on&&rig.kind==='bride';}
export function pose(rig,t,sit=0,walk=0){rig.hip.position.y=1.65-sit*.5+Math.abs(Math.sin(t*5))*walk*.035;rig.head.rotation.x=0;rig.head.rotation.z=0;rig.head.rotation.y=Math.sin(t*.55)*.055;rig.torso.scale.y=1+Math.sin(t*1.5)*.006;rig.legs.forEach((l,i)=>{const side=i?1:-1;l.rotation.x=-sit*1.3+Math.sin(t*5)*walk*side*.4;l.userData.knee.rotation.x=sit*1.3+Math.max(0,-Math.sin(t*5)*side)*walk*.55;});rig.arms.forEach((a,i)=>{a.rotation.x=-.12-Math.sin(t*5)*walk*(i?1:-1)*.25;a.rotation.z=(i?1:-1)*.1;a.userData.elbow.rotation.x=-.12;});}
