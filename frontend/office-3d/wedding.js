import * as T from '../assets/vendor/three.module.js';
export function weddingVenue(scene){
 const root=new T.Group();root.name='WeddingVenue';root.visible=false;scene.add(root);
 const materials={cream:new T.MeshStandardMaterial({color:'#f7e8d5',roughness:.55}),rose:new T.MeshStandardMaterial({color:'#9d294b',roughness:.6}),pink:new T.MeshStandardMaterial({color:'#eeb6c6'}),gold:new T.MeshStandardMaterial({color:'#d4ad64',metalness:.65,roughness:.3}),wood:new T.MeshStandardMaterial({color:'#604237'}),green:new T.MeshStandardMaterial({color:'#50755d'}),light:new T.MeshStandardMaterial({color:'#fff1cb',emissive:'#ffc97e',emissiveIntensity:1.5})};
 const sphereGeometry=new T.SphereGeometry(1,10,8);
 function box(x,y,z,w,h,d,m){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);return mesh;}
 function ball(x,y,z,s,m){const mesh=new T.Mesh(sphereGeometry,m);mesh.position.set(x,y,z);mesh.scale.setScalar(s);root.add(mesh);return mesh;}
 function column(x,z){box(x,1.4,z,.24,2.8,.24,materials.gold);box(x,.15,z,.8,.3,.8,materials.cream);box(x,2.82,z,.8,.16,.8,materials.gold);}
 function flowers(x,y,z,index){
  ball(x,y,z,.12,materials.gold);
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const petal=ball(x+Math.cos(a)*.13,y+Math.sin(a)*.13,z,.12,index%3?materials.cream:materials.pink);petal.scale.z*=.5;}
 }
 box(0,-.13,1,18,.24,26,materials.cream);
 box(0,.01,2,2.7,.035,15,materials.rose);for(const side of [-1,1])box(side*1.38,.04,2,.045,.035,15,materials.gold);
 box(0,2.7,-4.3,13,5.6,.25,materials.wood);box(0,2.8,-4.1,8.7,5.2,.06,materials.rose);
 for(const side of [-1,1]){column(side*2.6,-3.1);box(side*4.9,2.65,-4,.17,5.3,.14,materials.gold);}
 const points=[];
 for(let i=0;i<=42;i++){const a=Math.PI-i/42*Math.PI;const x=Math.cos(a)*2.6,y=2.75+Math.sin(a)*2.0;points.push(new T.Vector3(x,y,-3.1));flowers(x,y,-2.98,i);}
 const arch=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,.06,8,false),materials.gold);root.add(arch);
 for(const side of [-1,1])for(let i=0;i<12;i++)flowers(side*2.6,.5+i*.19,-3.0,i);
 // An illuminated heart behind the couple, with a real 3D flower arch in front.
 const heart=new T.Shape();heart.moveTo(0,.2);heart.bezierCurveTo(-1.2,1.2,-1.5,-.2,0,-1);heart.bezierCurveTo(1.5,-.2,1.2,1.2,0,.2);
 const heartOutline=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(heart.getPoints(36).map(p=>new T.Vector3(p.x,p.y,0)),true),80,.025,8,true),materials.gold);heartOutline.position.set(0,3.2,-3.9);root.add(heartOutline);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#f5dcaa';ctx.font='bold 70px Arial';ctx.textAlign='center';ctx.fillText('LỄ THÀNH HÔN',512,105);
 const sign=new T.Mesh(new T.PlaneGeometry(4.1,.64),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),transparent:true}));sign.position.set(0,4.5,-3.97);root.add(sign);
 for(const side of [-1,1])for(let row=0;row<3;row++){
  const z=2+row*1.7;
  for(let seat=0;seat<2;seat++){const x=side*(2.5+seat*1.1);box(x,.55,z,.75,.14,.7,materials.cream);box(x,.94,z+.29,.75,.7,.08,materials.cream);box(x,1.05,z+.35,.78,.13,.08,materials.rose);
   // Decorative NPC guests are not viewer accounts and have no TikTok names.
   const shirt=seat%2?materials.pink:materials.rose;box(x,.98,z,.4,.6,.25,shirt);ball(x,1.46,z,.20,materials.cream);ball(x,1.54,z-.03,.20,materials.wood);
  }
  box(side*1.8,.37,z,.12,.7,.12,materials.gold);ball(side*1.8,.83,z,.12,materials.light);
 }
 for(const side of [-1,1])for(let i=0;i<11;i++){const a=i*.55;ball(side*(3.3+.3*Math.cos(a)),1.5+i*.22,-3.8,.075,materials.light);}
 const warm=new T.PointLight(0xffd3a1,22,18);warm.position.set(0,4,1);root.add(warm);
 const ring=new T.Mesh(new T.TorusGeometry(.11,.027,12,32),materials.gold);ring.position.set(0,1.7,-.5);root.add(ring);
 const petalMaterial=new T.MeshStandardMaterial({color:'#f5a9c4',side:T.DoubleSide});
 const petals=new T.InstancedMesh(new T.PlaneGeometry(.12,.18),petalMaterial,48);petals.instanceMatrix.setUsage(T.DynamicDrawUsage);petals.frustumCulled=false;root.add(petals);const dummy=new T.Object3D();
 function tick(seconds,ceremonyAfter){
  for(let i=0;i<48;i++){dummy.position.set(Math.sin(i*2.17+seconds*.35)*3.8,5.5-((seconds*.6+i*.23)%5.5),Math.cos(i*3.1)*3);dummy.rotation.set(seconds*.5+i,seconds*.7+i*.4,Math.sin(seconds+i));dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);}petals.instanceMatrix.needsUpdate=true;
  ring.visible=seconds>=ceremonyAfter;ring.rotation.y=seconds*1.4;ring.rotation.z=.3;ring.position.y=1.8+Math.sin(seconds*2)*.06;
 }
 return {root,ring,tick};
}
