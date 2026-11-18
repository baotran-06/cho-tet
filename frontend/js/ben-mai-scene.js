import * as T from '../assets/vendor/three.module.js';
import {Tavern} from './scene.js';
import {deliveryTime} from './orders.js';

const gold=0xffcc00, red=0xd61928, wood=0x99603b, leaf=0x398d34;
const v=(x,z)=>new T.Vector3(x,0,z);
const stalls=[
  {x:-3.7,z:6,name:'HOA MAI',trim:0xb62039,stock:['mai','mai','mai']},
  {x:-3.7,z:1.9,name:'BÁNH & MỨT',trim:0x2b6951,stock:['tet','mut','pork']},
  {x:-3.7,z:-2.2,name:'TRÁI CÂY',trim:0x9f501b,stock:['melon','soda','melon']},
  {x:-3.7,z:-6.3,name:'ĐỒ TẾT',trim:0x923650,stock:['pig','lixi','pig']}
];
const quay=v(3.35,-5.3);
const boatPosition=[5.7,-.12,-5.2];

export class BenMai extends Tavern {
  constructor(canvas, renderer=null) {
    super(canvas,renderer);
    this.camera=new T.OrthographicCamera(-6,6,10,-10,.1,100);
    this.camera.position.set(14.0,12.7,25);
    this.camera.lookAt(1.05,.30,3.6);
    const resize=this.resize;
    window.removeEventListener('resize',resize);
    this.resize=()=>{
      const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
      const horizontal=7.15;
      const vertical=horizontal*height/width;
      Object.assign(this.camera,{left:-horizontal,right:horizontal,top:vertical*1.10,bottom:-vertical*.90});
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width,height,false);
    };
    this.resize();
    window.addEventListener('resize',this.resize);
    this.scene.background.set(0x22b3a7);
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
    this.cart=this.tricycle();
    this.receiver=this.person('receiver','',0);
    this.receiver.group.position.set(3.45,0,-5.55);
    this.receiver.group.rotation.y=-1.3;
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
    this.box(0x22b3a7,[31,.22,40],[5,-.45,0]);
    this.box(0xb98762,[11,.52,28],[-2.85,-.27,-.8]);
    for(let z=-12;z<=12;z++) for(let x=-8;x<3;x++) {
      if(x===2) continue;
      const color=[0xdb8c6b,0xe99c7c,0xce7b58,0xe59a7d][Math.abs(x*7+z*3)%4];
      this.box(color,[.99,.06,.97],[x+.48,.014,z]);
    }
    this.box(0xc79770,[.44,.17,26],[2.5,.075,-.2]);
    for(let i=0;i<29;i++) {
      const x=3.2+(i%7)*.92,z=-12+i*.88;
      this.box(i%2?0x8ed9c1:0x64cbbb,[.5+(i%4)*.22,.016,.05],[x,-.329,z]).rotation.y=.09;
    }

    for(let i=0;i<4;i++) {
      const z=7-i*4.3, x=-6.65;
      this.box(0xffe5bc,[2.5,2.7,3.55],[x,1.35,z]);
      this.tiledRoof(x,2.85,z,2.95,3.85);
      for(const offset of [-.92,.82]) {
        this.box(0x526b49,[.08,1.1,.59],[x+1.26,1.65,z+offset]);
        for(let q=0;q<7;q++) this.box(0x6f8256,[.09,.042,.57],[x+1.27,1.2+q*.135,z+offset]);
      }
    }

    this.lamps=[];
    this.vendors=stalls.map((stall,index)=>{
      const group=this.group([stall.x,0,stall.z]);
      group.rotation.y=Math.PI/2;
      for(const x of [-1.56,1.56]) for(const z of [-.86,.42]) this.box(wood,[.12,2.78,.13],[x,1.39,z],group);
      this.tiledRoof(0,2.90,-.44,3.5,1.63,group);
      this.box(wood,[3.19,.79,.72],[0,.40,.61],group);
      this.box(0xd9915c,[3.34,.13,.84],[0,.84,.61],group);
      this.box(stall.trim,[3.16,.32,.044],[0,.68,1.02],group);
      const sign=this.sign(stall.name,2.56,.47,'#fff0bc','#'+stall.trim.toString(16).padStart(6,'0'),[.10,2.66,.72],group,142);
      sign.rotation.y=-.52;
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
      this.lamps.push(this.lamp([stall.x+.7,2.07,stall.z+1.52]));
      const actor=this.person('vendor'+index,'',index);
      actor.group.position.set(stall.x+.02,0,stall.z+.38);
      actor.group.rotation.y=1.05;
      return actor;
    });
    this.maiTree(-.72,-7.35);
    for(let i=0;i<12;i++) {
      const angle=i*Math.PI/6;
      this.product('mai',[-.72+1.2*Math.sin(angle),0,-7.35+1.2*Math.cos(angle)],this.staticRoot,.44);
    }
    for(let i=0;i<12;i++) {
      const z=9-i*1.7;
      if(z>-6.7&&z<-4.0) continue;
      this.box(0x9e613c,[.13,.64,.13],[2.54,.34,z]);
      this.box(0xecb56e,[.13,.070,.13],[2.54,.59,z]);
    }
    for(const x of [-1.7,-.45,.7]) this.lamps.push(this.lamp([x,2.55,-6.5],this.staticRoot,.9));

    for(let i=0;i<13;i++) this.box(0xb77245,[.23,.23,2.1],[2.5+i*.21,-.01,-5.4]);
    for(const x of [2.75,4.87]) for(const z of [-6.48,-4.34]) {
      this.cyl(wood,.103,.92,[x,.10,z]);
      this.cyl(0xe4c08a,.115,.073,[x,.45,z]);
    }

    for(const x of [2.75,3.75,4.75]) {
      this.box(wood,[.075,1.32,.075],[x,.67,-6.37]);
      this.lamps.push(this.lamp([x,1.17,-6.28],this.staticRoot,.57));
    }
    this.boat=this.group(boatPosition,this.scene);
    this.boat.rotation.y=.35;
    this.sphere(0x8f4d32,[.68,.21,1.58],[0,-.14,0],this.boat);
    this.sphere(0xc17a4b,[.66,.08,1.56],[0,.03,0],this.boat);
    for(let i=0;i<10;i++) this.box(0xe1a86c,[.88-Math.abs(i-4.5)*.075,.045,.15],[0,.11,-.74+i*.16],this.boat);
    for(const x of [-.32,.32]) this.box(0xb7753c,[.17,.21,.87],[x,.42,-.63],this.boat).rotation.z=-x;
    this.box(0xe5b574,[.71,.095,.95],[0,.67,-.63],this.boat);
    this.product('mai',[0,.17,.9],this.boat,.67);

    for(const [x,z] of [[2.4,-10.4],[2.2,8.5],[-7,-9.7],[6,-11.7]]) {
      const trunk=this.cyl(0xa16d47,.18,3.55,[x,1.7,z]);
      trunk.rotation.z=.17;
      for(let i=0;i<7;i++) {
        const a=i*2.399;
        const frond=this.sphere(i%2?0x639a42:0x438a45,[.22,.13,1.18],[x-.3+Math.sin(a)*.59,3.65,z+Math.cos(a)*.59]);
        frond.rotation.y=a;
        frond.rotation.x=.28;
      }
    }
    for(let i=0;i<10;i++) this.product('mai',[i%2?-5.2:2.15,0,9-i*2],this.staticRoot,.85);
    // Floating water plants and low flowering pots balance the open river edge.
    for(let i=0;i<13;i++) {
      const x=2.9+(i%3)*.32;
      const z=8.4-i*1.56;
      if(z>-7&&z<-3.6) continue;
      for(let j=0;j<3;j++) this.sphere(j%2?0x79b841:0x41994a,[.16,.055,.22],[x+j*.14,-.29,z+j*.18]);
    }
    for(const [x,z] of [[1.85,5.95],[1.95,-8.6],[-2.1,8.3]]) {
      const pot=this.group([x,0,z]);
      this.cyl(0xbd6250,.28,.31,[0,.158,0],pot);
      for(let i=0;i<8;i++) {
        const a=i*2.399;
        this.sphere(i%3===0?0xffc900:0xf33749,[.115,.094,.11],[Math.sin(a)*.2,.37+(i%3)*.10,Math.cos(a)*.18],pot);
        this.sphere(leaf,[.12,.035,.07],[Math.sin(a)*.23,.34,Math.cos(a)*.22],pot);
      }
    }
  }

  tricycle() {
    const group=this.group([.8,0,6.8],this.scene);
    const wheels=[];
    for(const [x,z] of [[0,.85],[-.52,-.64],[.52,-.64]]) {
      const wheel=this.group([x,.325,z],group);
      this.mesh('torus',0x3c3730,[.31,.31,.22],[0,0,0],wheel).rotation.y=Math.PI/2;
      for(let i=0;i<8;i++) this.box(0xe1c49b,[.025,.55,.017],[0,0,0],wheel).rotation.x=i*Math.PI/8;
      wheels.push(wheel);
    }
    this.box(0x8e533b,[.13,.16,1.43],[0,.44,.13],group);
    this.box(wood,[1.13,.13,1.03],[0,.62,-.62],group);
    for(const x of [-.54,.54]) for(let i=0;i<3;i++) this.box(wood,[.065,.083,1.02],[x,.72+i*.09,-.62],group);
    for(const z of [-1.11,-.11]) this.box(wood,[1.13,.20,.07],[0,.78,z],group);
    this.cyl(0xa87454,.045,.77,[0,.69,.65],group).rotation.x=-.19;
    this.box(0x694733,[.51,.055,.055],[0,1.03,.58],group);
    this.cyl(0x7a5844,.045,.57,[0,.63,.11],group);
    this.box(0x714632,[.27,.09,.23],[0,.93,.11],group);
    const pedals=this.group([0,.47,.08],group);
    for(const direction of [-1,1]) {
      this.box(0x73594c,[.047,.20,.045],[direction*.12,direction*.10,0],pedals);
      this.box(0x514340,[.15,.055,.085],[direction*.18,direction*.18,0],pedals);
    }
    return {group,wheels,pedals};
  }

  makeLion() {
    const g=this.group([.33,0,-2.6],this.scene);
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
    const counter=new T.Vector3(stall.x+.93,1.02,stall.z);
    if(!order.departure) {
      item.position.copy(counter);
      item.position.y+=Math.sin(this.time*5)*.055;
      vendor.arms[0].rotation.x=-.92+Math.sin(this.time*5)*.4;
      return;
    }

    const elapsed=now-order.departure;
    const progress=T.MathUtils.clamp((elapsed-1850)/(deliveryTime-3400),0,1);
    const pickup=v(-1.65,stall.z);
    const route=[pickup,v(-.35,stall.z),v(1.3,stall.z-1.1),v(1.3,-4.6),quay];
    const previous=this.state.market.recent.find(item=>!item.show);
    const parked=previous?quay:v(.8,6.8);
    const approach=[parked,v(.95,parked.z),v(.95,stall.z),pickup];
    const travel=elapsed<1250?this.alongPath(approach,elapsed/1250):this.alongPath(route,progress);
    this.cart.group.position.copy(travel.position);
    this.cart.group.rotation.y=travel.angle;
    for(const wheel of this.cart.wheels) wheel.rotation.x=elapsed<1250?elapsed*.013:16+progress*27;
    this.cart.pedals.rotation.x=-this.cart.wheels[0].rotation.x;
    this.courier.group.position.copy(this.cart.group.localToWorld(new T.Vector3(-.57,0,.43)));
    this.courier.group.rotation.y=travel.angle;
    this.pose(this.courier,elapsed<1250||progress>0&&progress<1,elapsed>=1850&&progress<1);
    const bed=this.cart.group.localToWorld(new T.Vector3(0,.77,-.66));
    const boat=this.boat.localToWorld(new T.Vector3(.15,.19,.44));
    item.position.copy(bed);
    if(elapsed<1850) {
      const phase=T.MathUtils.clamp((elapsed-1250)/600,0,1);
      item.position.copy(counter).lerp(bed,phase);
      item.position.y+=Math.sin(phase*Math.PI)*.38;
    }
    if(progress>=1) {
      const phase=T.MathUtils.clamp((elapsed-deliveryTime+1500)/1250,0,1);
      item.position.lerp(boat,phase);
      item.position.y+=Math.sin(phase*Math.PI)*.94;
      this.receiver.arms[1].rotation.x=-1.25;
    }
  }

  frame() {
    this.time+=Math.min(.05,this.clock.getDelta());
    const now=this.state?this.state.serverTime+Math.min(250,performance.now()-this.clockAt):0;
    const market=this.state?.market;
    const active=market?.active??[];
    this.boat.position.y=boatPosition[1]+Math.sin(this.time*2.1)*.07;
    this.boat.rotation.z=Math.sin(this.time*1.6)*.046;
    const lights=active.find(order=>order.product==='lights');
    this.lamps.forEach(({lamp,shell},i)=>{
      lamp.rotation.z=Math.sin(this.time*1.8+i)*.13;
      shell.material.emissiveIntensity=lights&&now>=lights.started+i*185?1.35:.13+(market?.level??0)*.07;
    });
    this.vendors.forEach(npc=>this.pose(npc));
    this.pose(this.receiver);
    for(const [index,buyer] of this.buyers.entries()) {
      buyer.group.visible=index<3+(market?.level??0);
      const p=((this.time*.040+index*.17)%1);
      const route=[v(.1,9),v(-1.25,stalls[index%4].z+.65),v(1.55,stalls[index%4].z+.6),v(.1,9)];
      this.move(buyer,route,p,index%2===1);
    }
    const courierBusy=active.some(order=>order.departure);
    if(!courierBusy) {
      const delivered=market?.recent.some(order=>!order.show);
      this.cart.group.position.copy(delivered?quay:v(.8,6.8));
      this.cart.group.rotation.y=delivered?Math.PI/2:-.35;
      this.courier.group.position.copy(this.cart.group.localToWorld(new T.Vector3(-.57,0,.43)));
      this.courier.group.rotation.y=.5;
      this.pose(this.courier);
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
          envelope=this.product('lixi',[-2.25,1.22,-6.3],this.scene,1.35);
          this.jobs.set(order.id,envelope);
        }
        envelope.position.y=1.35+Math.sin(this.time*6)*.15;
        envelope.rotation.y=this.time*3;
        this.vendors[3].arms[1].rotation.x=-1.55;
      }
    }
    for(const [id,item] of this.jobs) if(!visible.has(id)) {
      this.scene.remove(item);
      this.jobs.delete(id);
    }
    this.lion.visible=active.some(order=>order.product==='lion');
    if(this.lion.visible) {
      this.lion.position.x=.10+Math.sin(this.time*3)*.8;
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
