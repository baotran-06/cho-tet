import * as T from '../assets/vendor/three.module.js';
import {Tavern} from './scene.js';
import {deliveryTime} from './orders.js';

const gold=0xffcc00, red=0xd61928, wood=0x99603b, leaf=0x398d34;
const v=(x,z)=>new T.Vector3(x,0,z);
const stalls=[
  {x:-6.6,z:4.9,name:'HOA MAI',trim:0xb62039,stock:['mai','mai','mai']},
  {x:6.6,z:4.9,name:'BÁNH & MỨT',trim:0x2b6951,stock:['tet','mut','pork']},
  {x:6.6,z:-2.2,name:'TRÁI CÂY',trim:0x9f501b,stock:['melon','soda','melon']},
  {x:-6.6,z:-2.2,name:'ĐỒ TẾT',trim:0x923650,stock:['pig','lixi','pig']}
];
const boatPosition=[0,.06,6.8];
const landing=stall=>v(Math.sign(stall.x)*2.35,stall.z+1.05);

export class BenMai extends Tavern {
  constructor(canvas, renderer=null) {
    super(canvas,renderer);
    this.camera=new T.OrthographicCamera(-6,6,10,-10,.1,100);
    this.camera.position.set(0,10.8,23);
    this.camera.lookAt(0,.55,.5);
    const resize=this.resize;
    window.removeEventListener('resize',resize);
    this.resize=()=>{
      const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
      const horizontal=10.8;
      const vertical=horizontal*height/width;
      Object.assign(this.camera,{left:-horizontal,right:horizontal,top:vertical*.91,bottom:-vertical*1.09});
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width,height,false);
    };
    this.resize();
    window.addEventListener('resize',this.resize);
    this.scene.background.set(0x99d9f4);
    this.scene.fog=null;
    this.renderer.toneMapping=T.NeutralToneMapping;
    this.renderer.toneMappingExposure=1.24;
    for(const light of this.scene.children) {
      if(light.isHemisphereLight) {
        light.color.set(0xfff5de);
        light.groundColor.set(0x70907c);
        light.intensity=1.68;
      }
      if(light.isDirectionalLight) {
        light.color.set(light.castShadow?0xffeed4:0xb3e8ff);
        light.intensity=light.castShadow?2.25:.57;
      }
    }
    this.jobs=new Map();
    this.buyers=Array.from({length:6},(_,index)=>this.person('buyer'+index,'',index));
    this.courier=this.person('courier','',2);
    this.rower=this.person('rower','',1);
    this.boat.add(this.rower.group);
    this.rower.group.position.set(0,.18,-1.04);
    this.rower.group.rotation.y=.16;
    this.rower.group.scale.setScalar(.79);
    this.oar=this.group([.43,1.0,-.84],this.boat);
    this.cyl(wood,.035,1.86,[0,-.24,0],this.oar);
    this.box(0xc78c50,[.22,.43,.075],[0,-1.04,0],this.oar);
    this.cargo=this.group([0,.20,.29],this.boat);
    this.loaded=new Map();
    this.lion=this.makeLion();
    this.lion.visible=false;
  }

  person(id,name,variant) {
    const actor=this.createAvatar({id,name,seat:variant});
    actor.label.visible=Boolean(name);
    const head=this.group([0,1.71,0],actor.body);
    for(const part of [...actor.body.children]) {
      if(part===head||!part.isMesh||part.position.y<1.53) continue;
      part.position.y-=1.71;
      head.add(part);
    }
    head.scale.set(1.32,1.30,1.36);
    actor.group.scale.setScalar(1.10);
    const clothes=[0xb62f3d,0x56436d,0x285a96,0xf29264,0x48784e];
    const color=clothes[variant%clothes.length];
    const long=variant%3===0;
    this.box(color,[.53,long?.87:.56,.38],[0,long?.88:1.06,.01],actor.body);
    for(let i=0;i<3;i++) this.sphere(gold,[.026,.026,.02],[.035,1.29-i*.13,.209],actor.body);
    if(!long) {
      this.sphere(0x303638,[.40,.12,.335],[0,2.01,0],actor.body);
      for(let row=0;row<2;row++) for(let x=-3;x<=3;x++) {
        if((row+x)%2===0) this.box(0xf9eddb,[.067,.046,.02],[x*.097,1.99+row*.046,.32-Math.abs(x)*.012],actor.body);
      }
    } else {
      for(const x of [-.12,.13]) this.sphere(gold,[.068,.047,.018],[x,.72,.21],actor.body);
    }
    return actor;
  }

  lamp(position,parent=this.staticRoot,scale=1) {
    const lamp=this.group(position,parent);
    lamp.scale.setScalar(scale);
    const shell=this.sphere(red,[.28,.34,.28],[0,0,0],lamp);
    shell.material=new T.MeshStandardMaterial({color:red,emissive:0xff3e09,emissiveIntensity:.12});
    for(const y of [-.32,.32]) this.cyl(gold,.12,.064,[0,y,0],lamp);
    this.box(gold,[.028,.23,.028],[0,-.46,0],lamp);
    this.cyl(0xa25a36,.014,.28,[0,.45,0],lamp);
    return {lamp,shell};
  }

  flower(position,parent,size=1) {
    const group=this.group(position,parent);
    group.scale.setScalar(size);
    for(let petal=0;petal<5;petal++) {
      const angle=petal*2*Math.PI/5;
      this.sphere(gold,[.17,.13,.07],[Math.cos(angle)*.14,Math.sin(angle)*.14,0],group);
    }
    this.sphere(0xe99424,[.075,.075,.071],[0,0,.059],group);
  }

  maiTree(x,z) {
    this.cyl(0xb56748,1.1,.30,[x,.18,z]);
    this.cyl(0x806049,.94,.09,[x,.36,z]);
    const trunk=this.cyl(wood,.29,3.2,[x,1.98,z]);
    trunk.rotation.z=-.12;
    for(let i=0;i<12;i++) {
      const a=i*2.399,r=.62+(i%4)*.39,y=2.8+(i%5)*.29;
      const bx=Math.sin(a)*r,bz=Math.cos(a)*r*.72;
      const branch=this.cyl(wood,.09,1.55,[x+bx*.54,y-.52,z+bz*.58]);
      branch.rotation.z=-bx*.67;
      branch.rotation.x=bz*.67;
      for(let j=0;j<6;j++) {
        this.flower([x+bx+Math.sin(j*2.4)*.45,y+Math.sin(j)*.43,z+bz+Math.cos(j*2.4)*.34],this.staticRoot,.8+(j%3)*.19);
      }
    }
  }

  product(key,position,parent,scale=1) {
    const group=this.group(position,parent);
    group.scale.setScalar(scale);
    if(key==='mai') {
      this.cyl(0xc5784e,.22,.26,[0,.13,0],group);
      for(let i=0;i<4;i++) {
        const x=-.18+i*.12,y=.44+(i%2)*.13;
        this.box(leaf,[.025,y-.2,.025],[x,(y+.2)/2,0],group);
        this.flower([x,y,0],group,.48);
      }
    } else if(key==='melon') {
      this.sphere(0x397641,[.33,.25,.27],[0,.25,0],group);
      for(const x of [-.16,0,.16]) this.sphere(0x79a648,[.045,.255,.273],[x,.25,0],group);
    } else if(key==='pig') {
      this.sphere(0xef947f,[.31,.24,.23],[0,.25,0],group);
      this.sphere(0xf8b499,[.14,.105,.08],[0,.24,.21],group);
      for(const x of [-.10,.10]) {
        this.mesh('cone',0xee947f,[.075,.15,.075],[x,.46,.1],group);
        this.sphere(0x53342d,[.025,.025,.024],[x,.34,.195],group);
      }
      this.box(0x8c5348,[.14,.014,.035],[0,.489,0],group);
    } else if(key==='soda') {
      this.cyl(red,.105,.37,[0,.19,0],group);
      this.cyl(0xf4b94a,.105,.04,[0,.384,0],group);
      this.box(0xffedb9,[.15,.07,.01],[0,.21,.103],group).rotation.z=.35;
    } else if(key==='tet') {
      this.cyl(leaf,.15,.6,[0,.175,0],group).rotation.z=Math.PI/2;
      for(const x of [-.21,0,.21]) this.cyl(0xfbe5ad,.156,.026,[x,.175,0],group).rotation.z=Math.PI/2;
    } else if(key==='pork') {
      this.box(0xb78348,[.56,.08,.41],[0,.035,0],group);
      for(let i=0;i<4;i++) this.box(i%2?0xf2bbad:0xe58185,[.46,.039,.29],[0,.09+i*.038,0],group);
    } else {
      this.box(key==='lixi'?red:0xdda86b,[.39,.11,.30],[0,.055,0],group);
      this.box(gold,[.055,.014,.29],[0,.117,0],group);
    }
    return group;
  }

  tiledRoof(x,y,z,width,depth,parent=this.staticRoot) {
    const count=Math.ceil(width/.25);
    for(let i=0;i<count;i++) for(const side of [-1,1]) {
      const tile=this.cyl(0xd45730+(i%3)*0x060400,.14,depth*.59,[x-width/2+i*.25,y,z+side*depth*.25],parent);
      tile.rotation.x=Math.PI/2+side*.25;
    }
    this.box(0xcf7749,[width+.15,.15,.17],[x,y+.16,z],parent);
  }

  build() {
    this.box(0x24adae,[58,.22,57],[0,-.45,-2]);
    for(const side of [-1,1]) {
      this.box(0xb48055,[8.8,.52,25],[side*7.3,-.27,-.8]);
      this.box(0xddab75,[.30,.19,25],[side*2.97,.065,-.8]);
      for(let z=-12;z<=11;z++) for(let col=0;col<8;col++) {
        const color=[0xe89167,0xeaaa81,0xdb866b,0xe99a7a][Math.abs(col*7+z*3)%4];
        this.box(color,[.98,.06,.97],[side*(3.50+col),.014,z]);
      }
      for(let i=0;i<3;i++) {
        const z=-8.8-i*2.7,x=side*(5.1+i*1.15);
        this.box(0xffe2af,[3.3,2.9,2.35],[x,1.42,z]);
        this.tiledRoof(x,3.04,z,3.58,2.74);
        for(const offset of [-.86,.86]) this.box(0x5c8056,[.48,.94,.07],[x+offset,1.52,z+1.20]);
      }
    }
    for(let i=0;i<38;i++) {
      const x=Math.sin(i*7.1)*2.53,z=-18+i*.81;
      this.box(i%2?0x92e0d0:0x5cc9c7,[.40+(i%4)*.18,.013,.061],[x,-.328,z]).rotation.y=.21;
    }

    this.lamps=[];
    this.vendors=stalls.map((stall,index)=>{
      const group=this.group([stall.x,0,stall.z]);
      group.rotation.y=-Math.sign(stall.x)*.20;
      for(const x of [-1.56,1.56]) for(const z of [-.86,.42]) this.box(wood,[.12,2.78,.13],[x,1.39,z],group);
      this.tiledRoof(0,2.90,-.44,3.5,1.63,group);
      this.box(wood,[3.19,.79,.72],[0,.40,.61],group);
      this.box(0xd9915c,[3.34,.13,.84],[0,.84,.61],group);
      this.box(stall.trim,[3.16,.32,.044],[0,.68,1.02],group);
      this.sign(stall.name,2.56,.47,'#fff0bc','#'+stall.trim.toString(16).padStart(6,'0'),[.10,2.66,.72],group,142);

      for(let i=0;i<3;i++) {
        const x=-.94+i*.91;
        this.box(0xbc8045,[.64,.10,.54],[x,.94,.79],group);
        this.product(stall.stock[i],[x,1.00,.82],group,1.0);
        if(i!==1) {
          this.box(0xa56736,[.61,.21,.55],[x,.13,1.37],group);
          this.product(stall.stock[i],[x,.25,1.37],group,.82);
        }
      }
      for(const x of [-1.48,1.48]) {
        this.box(red,[.21,.71,.043],[x,1.68,.92],group);
        for(let line=0;line<4;line++) this.box(gold,[.095,.023,.013],[x,1.46+line*.145,.95],group);
      }
      for(let strip=0;strip<7;strip++) {
        this.box(strip%2?0xf6cf7f:stall.trim,[.40,.12,.055],[-1.20+strip*.4,2.83,.42],group);
      }
      this.lamps.push(this.lamp([stall.x+Math.sign(stall.x)*.73,2.07,stall.z+1.25]));
      const actor=this.person('vendor'+index,'',index);
      actor.group.position.set(stall.x+.32,0,stall.z+.15);
      actor.group.rotation.y=-Math.sign(stall.x)*.11;
      return actor;
    });
    this.maiTree(-8.8,-4.2);
    this.maiTree(8.8,-4.6);
    for(const stall of stalls) {
      const dock=landing(stall);
      const side=Math.sign(stall.x);
      for(let i=0;i<7;i++) this.box(0xb77245,[.23,.23,1.53],[side*(1.91+i*.22),-.01,dock.z]);
      for(const z of [dock.z-.72,dock.z+.72]) {
        this.cyl(wood,.11,.80,[side*2.0,.14,z]);
        this.cyl(0xf1c276,.12,.07,[side*2.0,.44,z]);
      }
      this.lamps.push(this.lamp([side*3.13,1.46,dock.z-.74],this.staticRoot,.65));
    }
    for(const x of [-3.35,3.35]) {
      this.box(0xb54730,[.46,4.6,.57],[x,2.18,-10.35]);
      this.lamps.push(this.lamp([x,3.45,-9.9],this.staticRoot,1.02));
    }
    this.box(0xa53c2b,[7.2,.44,.67],[0,4.58,-10.35]);
    this.tiledRoof(0,5.05,-10.3,7.65,1.26);
    this.sign('CHỢ TẾT BẾN MAI',4.75,.79,'#ffedab','#a9272c',[0,4.16,-9.93],this.staticRoot,139);
    this.boat=this.group(boatPosition,this.scene);
    this.boat.rotation.y=.35;
    this.sphere(0x8f4d32,[.68,.21,1.58],[0,-.14,0],this.boat);
    this.sphere(0xc17a4b,[.66,.08,1.56],[0,.03,0],this.boat);
    for(let i=0;i<10;i++) this.box(0xe1a86c,[.88-Math.abs(i-4.5)*.075,.045,.15],[0,.11,-.74+i*.16],this.boat);
    for(const x of [-.32,.32]) this.box(0xb7753c,[.17,.21,.87],[x,.42,-.63],this.boat).rotation.z=-x;
    this.box(0xe5b574,[.71,.095,.95],[0,.67,-.63],this.boat);


    for(const [x,z] of [[-9.4,6.3],[9.35,6.4],[-9,-7.4],[8.9,-7.6]]) {
      const trunk=this.cyl(0xa16d47,.18,3.55,[x,1.7,z]);
      trunk.rotation.z=.17;
      for(let i=0;i<7;i++) {
        const a=i*2.399;
        const frond=this.sphere(i%2?0x639a42:0x438a45,[.22,.13,1.18],[x-.3+Math.sin(a)*.59,3.65,z+Math.cos(a)*.59]);
        frond.rotation.y=a;
        frond.rotation.x=.28;
      }
    }
    for(let i=0;i<14;i++) {
      const side=i%2===0?-1:1,z=7.6-Math.floor(i/2)*2.02;
      this.product('mai',[side*3.54,0,z-.66],this.staticRoot,.83);
      for(let j=0;j<3;j++) this.sphere(j%2?0x79b841:0x41994a,[.15,.055,.22],[side*(2.76-j*.15),-.29,z+j*.18]);
    }
  }

  makeLion() {
    const g=this.group([-4.7,0,-.7],this.scene);
    this.sphere(red,[.38,.38,.77],[0,.59,-.44],g);
    this.sphere(gold,[.44,.43,.36],[0,1,.25],g);
    this.sphere(red,[.42,.19,.33],[0,.83,.48],g);
    for(const x of [-.25,.25]) {
      this.sphere(0xfff4c0,[.15,.16,.10],[x,1.12,.53],g);
      this.sphere(0x30232a,[.065,.075,.045],[x,1.12,.62],g);
      this.sphere(red,[.105,.13,.09],[x,1.34,.22],g);
    }
    this.sphere(0xffe698,[.13,.09,.09],[0,.93,.72],g);
    return g;
  }

  update(state) {
    this.state=state;
    this.clockAt=performance.now();
  }

  move(actor,route,progress,carry=false) {
    const {position,angle}=this.alongPath(route,progress);
    actor.group.position.copy(position);
    actor.group.rotation.y=angle;
    this.pose(actor,true,carry);
  }

  pose(actor,walking=false,carry=false) {
    const phase=this.time*11+actor.seat;
    actor.body.position.y=walking?Math.abs(Math.sin(phase))*.065:0;
    for(let i=0;i<2;i++) {
      const swing=Math.sin(phase+i*Math.PI);
      actor.legs[i].leg.rotation.x=walking?swing*.47:0;
      actor.arms[i].rotation.x=carry?-1.26:walking?-swing*.39:Math.sin(this.time*3+i)*.12;
    }
  }

  renderOrder(order,now) {
    const stall=stalls[order.stall];
    let item=this.jobs.get(order.id);
    if(!item) {
      item=this.product(order.product,[0,0,0],this.scene,.94);
      this.jobs.set(order.id,item);
    }
    const vendor=this.vendors[order.stall];
    const side=Math.sign(stall.x);
    const counter=new T.Vector3(stall.x,1.04,stall.z+.96);
    if(!order.departure) {
      item.position.copy(counter);
      item.position.y+=Math.sin(this.time*5)*.055;
      vendor.arms[0].rotation.x=-.92+Math.sin(this.time*5)*.4;
      return;
    }
    const dock=landing(stall);
    const elapsed=Math.max(0,now-order.departure);
    const approachTime=2800,loadTime=1100;
    const t=T.MathUtils.clamp(elapsed/approachTime,0,1);
    const berth=v(side*1.35,dock.z);
    const past=this.state.market.recent.find(order=>!order.show);
    const start=v(0,past?-7.5:6.8);
    const wayIn=[start,v(0,dock.z+.7),berth];
    const wayOut=[berth,v(0,dock.z-1.1),v(0,-7.5)];
    const outgoing=T.MathUtils.clamp((elapsed-approachTime-loadTime)/(deliveryTime-approachTime-loadTime),0,1);
    if(elapsed<approachTime) this.sail(wayIn,t,true);
    else if(outgoing>0) this.sail(wayOut,outgoing,true);
    else this.sail(wayIn,1,false);
    this.courier.group.visible=outgoing===0;
    const walkStart=v(counter.x,counter.z);
    this.move(this.courier,[walkStart,v(side*3.3,dock.z),dock],t,true);
    const hand=this.courier.group.localToWorld(new T.Vector3(0,1.01,.43));
    const deck=this.boat.localToWorld(new T.Vector3(.12,.21,.38));
    const loading=T.MathUtils.clamp((elapsed-approachTime)/loadTime,0,1);
    item.position.copy(hand).lerp(deck,loading);
    item.position.y+=Math.sin(loading*Math.PI)*.54;
    if(loading>=1) item.rotation.y=this.boat.rotation.y;
    if(!this.loaded.has(order.id)&&loading>=1) {
      const load=this.product(order.product,[.12,.01,.09],this.cargo,.82);
      this.loaded.set(order.id,load);
      item.visible=false;
    }
  }

  sail(route,progress,paddling) {
    const {position,angle}=this.alongPath(route,progress);
    this.boat.position.set(position.x,boatPosition[1]+Math.sin(this.time*2.4)*.057,position.z);
    this.boat.rotation.set(0,angle,Math.sin(this.time*2.8)*.055);
    const stroke=paddling?Math.sin(this.time*7):0;
    this.oar.rotation.set(.28+stroke*.65,stroke*.31,-.58+stroke*.2);
    this.pose(this.rower);
    this.rower.arms[1].rotation.x=-1.05+stroke*.48;
    this.rower.arms[1].rotation.z=-.31;
  }

  frame() {
    this.time+=Math.min(.05,this.clock.getDelta());
    const now=this.state?this.state.serverTime+Math.min(250,performance.now()-this.clockAt):0;
    const market=this.state?.market;
    const active=market?.active??[];

    const lights=active.find(order=>order.product==='lights');
    this.lamps.forEach(({lamp,shell},i)=>{
      lamp.rotation.z=Math.sin(this.time*1.8+i)*.13;
      shell.material.emissiveIntensity=lights&&now>=lights.started+i*185?1.35:.13+(market?.level??0)*.07;
    });
    this.vendors.forEach(npc=>this.pose(npc));
    for(const [index,buyer] of this.buyers.entries()) {
      buyer.group.visible=index<3+(market?.level??0);
      const p=((this.time*.040+index*.17)%1);
      const stall=stalls[index%4],side=Math.sign(stall.x);
      this.move(buyer,[v(side*4.0,8.4),v(side*4.1,stall.z+1.65),v(stall.x,stall.z+1.8),v(side*4,8.4)],p,index%2===1);
    }
    const shipment=active.find(order=>order.departure);
    const recent=market?.recent.find(order=>!order.show);
    if(!shipment) {
      const z=recent?-7.5:6.8+Math.sin(this.time*.5)*.66;
      this.sail([v(0,z+1),v(0,z)],1,!recent);
      this.courier.group.visible=false;
    }
    for(const [id,load] of this.loaded) {
      if(id===shipment?.id||(!shipment&&id===recent?.id)) continue;
      this.cargo.remove(load);
      this.loaded.delete(id);
    }
    const visible=new Set();
    for(const order of active) {
      if(!order.show) {
        visible.add(order.id);
        this.renderOrder(order,now);
      } else if(order.product==='lixi') {
        visible.add(order.id);
        let envelope=this.jobs.get(order.id);
        if(!envelope) {
          envelope=this.product('lixi',[stalls[3].x,1.22,stalls[3].z+1.4],this.scene,1.35);
          this.jobs.set(order.id,envelope);
        }
        envelope.position.y=1.35+Math.sin(this.time*6)*.15;
        envelope.rotation.y=this.time*3;
        this.vendors[3].arms[1].rotation.x=-1.55;
      }
    }
    for(const [id,item] of this.jobs) if(!visible.has(id)) {
      item.removeFromParent();
      this.jobs.delete(id);
    }
    this.lion.visible=active.some(order=>order.product==='lion');
    if(this.lion.visible) {
      this.lion.position.x=-4.7+Math.sin(this.time*3)*.8;
      this.lion.position.y=Math.abs(Math.sin(this.time*8))*.46;
      this.lion.rotation.y=Math.sin(this.time*4)*.65;
    }
    this.effect.visible=(market?.celebrationUntil??0)>now;
    if(this.effect.visible) this.effect.children.forEach((particle,index)=>{
      const progress=1-(market.celebrationUntil-now)/5500;
      const angle=index*2.399;
      particle.position.set(Math.sin(angle)*progress*3,4.9+Math.cos(angle)*progress*2,-6.1+Math.sin(angle*.7)*progress*3);
    });
    this.renderer.render(this.scene,this.camera);
  }
}
