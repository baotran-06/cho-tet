import * as T from '../assets/vendor/three.module.js';
import {GLTFLoader} from '../assets/vendor/GLTFLoader.js';
const loader=new GLTFLoader();
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function disposeModel(model){const gs=new Set(),ms=new Set();model.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
export function person(kind='groom'){
 const holder=new T.Group(),root=group(holder),hip=group(root,0,1.65),torso=group(hip),head=group(torso,0,1.52),arms=[group(torso,-.43,.89),group(torso,.43,.89)],legs=[group(hip,-.16),group(hip,.16)],weddingWear=group(root),weddingHead=group(head),dailyWear=group(root),bouquet=group(arms[1],0,-1,.2);
 for(const arm of arms)arm.userData.elbow=group(arm,0,-.49);for(const leg of legs)leg.userData.knee=group(leg,0,-.74);
 const pink=new T.MeshStandardMaterial({color:'#e786a6',roughness:.55}),ivory=new T.MeshStandardMaterial({color:'#fff4db',roughness:.55});
 for(let i=0;i<11;i++){const a=i*2.4,r=Math.sqrt(i)*.05;const flower=new T.Mesh(new T.SphereGeometry(.065,12,8),i%2?pink:ivory);flower.position.set(Math.sin(a)*r,.09+i%3*.035,Math.cos(a)*r);bouquet.add(flower);}
 bouquet.visible=kind==='bride';const rig={holder,root,hip,torso,head,arms,legs,kind,jacket:new T.MeshStandardMaterial({color:'#c51b35'}),weddingWear,weddingHead,dailyWear,normalExtras:[],bouquet,model:null,mixer:null,actions:{},bones:{},modelReady:false,disposed:false,sceneKey:null};
 rig.ready=loader.loadAsync(new URL('../models/ao-dai/'+kind+'.glb',import.meta.url).href).then(gltf=>{
  if(rig.disposed){disposeModel(gltf.scene);return;}
  const model=gltf.scene;model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),height=bounds.max.y-bounds.min.y;if(!Number.isFinite(height)||height<.1)throw Error('Model có kích thước không hợp lệ');const size=3.8/height;
  const wrapper=group(holder);model.scale.setScalar(size);model.position.set(-(bounds.min.x+bounds.max.x)*size/2,-bounds.min.y*size,-(bounds.min.z+bounds.max.z)*size/2);wrapper.add(model);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}if(o.isBone)rig.bones[o.name]=o;});rig.model=model;rig.visual=wrapper;rig.mixer=new T.AnimationMixer(model);
  for(const clip of gltf.animations)if(clip.name.startsWith(kind+'_'))rig.actions[clip.name.slice(kind.length+1)]=rig.mixer.clipAction(clip);
  if(!rig.actions.Idle)throw Error('Model thiếu hoạt ảnh Idle');rig.actions.Idle.play();rig.action='Idle';rig.modelReady=true;
  // Decor follows a real hand bone, independent of the control proxies.
  const hand=rig.bones.Lforearm;if(hand){bouquet.removeFromParent();hand.add(bouquet);bouquet.position.set(0,.17,.025);bouquet.scale.setScalar(1/size);}
  return model;
 });
 rig.dispose=()=>{rig.disposed=true;rig.mixer?.stopAllAction();if(rig.model){rig.mixer?.uncacheRoot(rig.model);disposeModel(rig.model);}rig.jacket.dispose();};
 return rig;
}
export function weddingOutfit(rig,on){rig.weddingWear.visible=on;rig.weddingHead.visible=on;rig.bouquet.visible=on&&rig.kind==='bride';}
export function pose(rig,t,sit=0,walk=0){
 const dt=Math.max(0,Math.min(.1,t-(rig.lastTime??t)));rig.lastTime=t;if(!rig.mixer)return;
 const next=sit?'Sit':walk?'Walk':rig.sceneKey==='celebrate'?'Cheer':rig.sceneKey==='bouquet'?'Wave':'Idle';
 if(next!==rig.action&&rig.actions[next]){rig.actions[rig.action]?.fadeOut(.25);rig.actions[next].reset().fadeIn(.25).play();rig.action=next;}
 rig.mixer.update(dt);
 // A small head tilt makes the already implemented close-up kiss pose meet naturally.
 if(rig.sceneKey==='kiss'&&rig.bones.head)rig.bones.head.rotation.x+=rig.kind==='groom'?.12:-.03;
}
