import * as T from '../assets/vendor/three.module.js';
import {Tavern} from './scene.js';
import {marketConfig, orderDuration, pickupTime, handoffTime} from './orders.js';

const stalls = [
  {x:-6,z:2,name:'SẠP HOA',color:0xbd3038, goods:['mai','dao','cuc','vantho']},
  {x:6,z:-4,name:'SẠP BÁNH',color:0x44836e,goods:['tet','chung','mut']},
  {x:6,z:2,name:'SẠP TRÁI CÂY',color:0xd56431,goods:['melon','buoi','dua','mangcau']},
  {x:-6,z:-4,name:'SẠP ĐỒ TẾT',color:0xb2314e,goods:['lixi','caudoi','lantern']}
];
const red=0xbc242b, gold=0xffc84c, wood=0xa15a3b, leaf=0x4d873a;
const palette={mai:0xffcd30,dao:0xf47ca0,cuc:0xffe877,vantho:0xff952a};
const v=(x,z)=>new T.Vector3(x,0,z);

export class TetMarket extends Tavern {
  constructor(canvas) {
    super(canvas);
    this.scene.background.set(0xa6d6ee);
    this.scene.fog.color.set(0xa6d6ee);
    this.camera.position.set(0,10,20);
    this.camera.lookAt(0,1,-1.5);
    this.anonymous = [];
    this.displayed=new Map();
    this.deliveries = new Map();
    this.unlocked = [];
    for (let level=0; level<3; level++) {
      const group=this.group([0,0,0],this.scene);
      for (let i=0;i<4;i++) this.lantern([-3.7+i*2.45,4.55-level*.35,-10.9+level*1.8],group,.68);
      group.visible=false;
      this.unlocked.push(group);
    }
    for (let i=0;i<12;i++) {
      const npc=this.createAvatar({id:'buyer'+i,name:'',seat:i});
      npc.label.visible=false;
      npc.bag=this.product(stalls[i%4].goods[i%3],[0,1,.5],npc.group,.64);
      this.anonymous.push(npc);
    }
    this.fireworkColors=[0xffdc48,0xf85465,0xffa530,0xf28fb2];
  }

  lantern(pos,parent,scale=1) {
    const g=this.group(pos,parent);
    g.scale.setScalar(scale);
    this.sphere(0xe3332f,[.35,.39,.35],[0,0,0],g);
    for (let i=0;i<5;i++) {
      const a=i*Math.PI/5;
      const rib=this.mesh('torus',0xf99b42,[.35,.38,.09],[0,0,0],g);
      rib.rotation.y=a;
    }
    this.cyl(gold,.15,.09,[0,.39,0],g);
    this.cyl(gold,.11,.08,[0,-.39,0],g);
    this.box(gold,[.045,.26,.045],[0,-.55,0],g);
    return g;
  }

  product(key,pos,parent,scale=1) {
    const g=this.group(pos,parent);
    g.scale.setScalar(scale);
    if (palette[key]) {
      this.cyl(0xc3744b,.24,.29,[0,.14,0],g);
      this.cyl(0xea9964,.26,.08,[0,.28,0],g);
      for (let i=0;i<5;i++) {
        const a=i*2.4, x=Math.sin(a)*.24,z=Math.cos(a)*.22,y=.52+i*.062;
        this.cyl(leaf,.025,y-.25,[x,(y+.25)/2,z],g);
        this.sphere(leaf,[.13,.05,.08],[x,.39,z],g);
        for(let j=0;j<5;j++) this.sphere(palette[key],[.09,.083,.05],[x+Math.cos(j*1.257)*.085,y+Math.sin(j*1.257)*.085,z],g);
        this.sphere(0xd97831,[.05,.05,.055],[x,y,z+.04],g);
      }
    } else if (key==='melon') {
      this.sphere(0x2e773c,[.37,.27,.26],[0,.27,0],g);
      for(let i=0;i<5;i++) {
        const rib=this.mesh('torus',0x83af48,[.27,.26,.19],[0,.27,0],g);
        rib.rotation.y=i*.63;
      }
    } else if (['buoi','dua','mangcau'].includes(key)) {
      this.sphere({buoi:0xe4b745,dua:0x8d983a,mangcau:0x9ab45c}[key],[.29,.28,.28],[0,.28,0],g);
      this.sphere(leaf,[.15,.034,.075],[.08,.55,0],g);
      if(key==='mangcau') for(let i=0;i<12;i++) {
        const angle=i*2.4;
        const y=.1+i*.032;
        this.sphere(0x729242,[.072,.067,.072],[Math.sin(angle)*.235,y,Math.cos(angle)*.235],g);
      }
    } else if (key==='tet') {
      const roll=this.cyl(0x45783e,.18,.69,[0,.2,0],g);
      roll.rotation.z=Math.PI/2;
      for (const x of [-.23,0,.23]) this.cyl(0xffdc8b,.186,.027,[x,.2,0],g).rotation.z=Math.PI/2;
    } else if (key==='chung'||key==='mut') {
      this.box(key==='chung'?0x4a813d:0xdd7e57,[.54,.23,.49],[0,.12,0],g);
      for(const x of [-.13,.13]) this.box(gold,[.033,.025,.51],[x,.246,0],g);
      for(const z of [-.11,.11]) this.box(gold,[.55,.024,.028],[0,.246,z],g);
    } else if (key==='lantern'||key==='festival') {
      this.lantern([0,.43,0],g,.63);
      if(key==='festival') this.sphere(gold,[.18,.16,.18],[0,.8,0],g);
    } else {
      const h=key==='caudoi'?.8:.48;
      this.box(red,[.3,h,.065],[0,h/2,0],g);
      this.box(gold,[.14,.14,.01],[0,h*.63,.04],g).rotation.z=Math.PI/4;
    }
    return g;
  }

  tree(x,z,color) {
    const g=this.group([x,0,z]);
    this.cyl(wood,.22,3.25,[0,1.65,0],g);
    for (let i=0;i<17;i++) {
      const a=i*2.399, r=.45+(i%5)*.39;
      const bx=Math.cos(a)*r,bz=Math.sin(a)*r*.7,y=3.4+(i%4)*.43;
      const twig=this.cyl(wood,.055,1.5,[bx*.58,y-.63,bz*.58],g);
      twig.rotation.z=-bx*.45;
      this.sphere(color,[.65,.49,.59],[bx,y,bz],g);
      for(let j=0;j<4;j++) this.sphere(color===0x629841?0xff9d31:color,[.25,.22,.24],[bx+Math.cos(j*1.57)*.48,y+.23,bz+Math.sin(j*1.57)*.43],g);
    }
  }

  build() {
    this.box(0xdba47a,[34,.4,37],[0,-.22,-6]);
    for(let x=-12;x<12;x++) for(let z=-14;z<11;z++) {
      const shade=[0xe4b189,0xf2c29a,0xdca680,0xf0ba94][Math.abs(x*7+z*11)%4];
      this.box(shade,[.97,.06,.97],[x+.5,.012,z+.5]);
    }
    for(const x of [-3.3,3.3]) {
      this.box(red,[.63,5.6,.68],[x,2.8,-9]);
      this.box(gold,[.8,.19,.78],[x,.25,-9]);
      this.lantern([x,3.65,-8.25],this.staticRoot,1.28);
    }
    this.box(0x8d352c,[8,.45,1.45],[0,5.6,-9]);
    for(let i=0;i<25;i++) {
      const tile=this.cyl(0x81453d,.14,1.6,[-3.96+i*.33,5.9+Math.abs(i-12)*.015,-9]);
      tile.rotation.x=Math.PI/2;
    }
    this.sign('CHỢ TẾT',5.8,1.12,'#ffe7a0','#b52c2c',[0,4.85,-8.54],this.staticRoot,145);
    this.tree(-10,2,0xee719c);
    this.tree(10,1,0xffcb40);
    this.tree(-10,-9,0xf394ad);
    this.tree(10,-9,0x629841);
    this.tree(7,8,0x629841);
    for(let i=0;i<7;i++) {
      const x=-9+i*3;
      this.box(0xeac192,[2.6,3.2,2.2],[x,1.6,-14]);
      this.box(0x925342,[2.9,.3,2.5],[x,3.34,-14]).rotation.x=.15;
      this.lantern([x,2.8,-12.75],this.staticRoot,.65);
    }
    for(let i=0;i<10;i++) {
      const x=-5.6+i*1.25;
      const flag=this.box(i%2?red:gold,[.42,.51,.045],[x,4.35+Math.abs(x)*.115,-6.9]);
      flag.rotation.z=x*.055;
    }
    for(let i=0;i<5;i++) {
      for(let j=0;j<4;j++) this.sphere(0xfff0d8,[1.15,.42+j*.09,.53],[-14+i*7.2+j*.68,7.6+(i%3)*.52,-19]);
    }
    this.vendors=stalls.map((stall,index)=>this.stall(stall,index));
    const receiving=this.group([0,0,7.2]);
    this.box(0xb76a41,[2.2,.36,1.25],[0,.22,0],receiving);
    this.sign('ĐIỂM GIAO HÀNG',2.1,.35,'#ffe5a7','#a32e30',[0,.41,.64],receiving,100);
    for(let i=0;i<16;i++) {
      const x=(i%2?1:-1)*(8.9+(i%3)*.5);
      this.product(['mai','dao','cuc','vantho'][i%4],[x,0,-8+i*.95],this.staticRoot,1.1);
    }
  }

  stall(stall,index) {
    const g=this.group([stall.x,0,stall.z]);
    for(const x of [-2.12,2.12]) for(const z of [-1.23,1.22]) {
      this.box(wood,[.19,3.7,.2],[x,1.85,z],g);
    }
    for(let i=0;i<12;i++) {
      const panel=this.box(i%2?stall.color:0xffd58b,[.385,.17,2.88],[-2.12+i*.385,3.56,-.04],g);
      panel.rotation.x=.18;
    }
    this.box(0xb86943,[4.3,.98,.88],[0,.49,1.03],g);
    this.box(0xe9a566,[4.48,.16,.99],[0,1.04,1.03],g);
    for(let x=-2;x<2.1;x+=.3) this.box(0x9d5436,[.035,.86,.018],[x,.48,1.48],g);
    this.sign(stall.name,3.65,.65,'#a82c25','#ffdc91',[0,3.33,1.49],g,120);
    this.sign('PHÚC',.42,1.04,'#ffdf69','#b9212b',[-2.07,2.12,1.35],g,285);
    this.sign('LỘC',.42,1.04,'#ffdf69','#b9212b',[2.07,2.12,1.35],g,285);
    this.lantern([-1.36,2.75,1.42],g,.62);
    this.lantern([1.36,2.75,1.42],g,.62);
    for(let i=0;i<8;i++) this.product(stall.goods[i%stall.goods.length],[-1.75+(i%4)*1.16,1.13,.71+Math.floor(i/4)*.53],g,.72);
    const vendor=this.createAvatar({id:'vendor'+index,name:'',seat:index});
    vendor.label.visible=false;
    vendor.group.position.set(stall.x,0,stall.z+.14);
    this.mesh('cone',0xffd38a,[.45,.26,.45],[0,2.07,0],vendor.group);
    return vendor;
  }

  update(state) {
    this.state=state;
    this.clockAt=performance.now();
    const users=new Set();
    for(const user of state.users.filter(u=>u.seat!==null).slice(0,12)) {
      users.add(user.id);
      let npc=this.avatars.get(user.id);
      if(npc && (npc.name!==user.name || npc.joinedAt!==user.joinedAt)) {
        this.disposeAvatar(npc);
        npc=null;
      }
      if(!npc) {
        npc=this.createAvatar(user);
        this.avatars.set(user.id,npc);
      }
      npc.user=user;
    }
    for(const [id,npc] of this.avatars) if(!users.has(id)) {
      this.disposeAvatar(npc);
      this.avatars.delete(id);
    }
  }

  position(npc,points,progress,carry=false) {
    const {position,angle}=this.alongPath(points,progress);
    npc.group.position.copy(position);
    npc.group.rotation.y=angle;
    this.pose(npc,true,carry);
  }

  pose(npc,walking=false,carry=false) {
    const phase=this.time*11+npc.seat;
    npc.body.position.y=walking?Math.abs(Math.sin(phase))*.055:Math.sin(this.time*4+npc.seat)*.025;
    for(let i=0;i<2;i++) {
      const swing=Math.sin(phase+i*Math.PI);
      npc.legs[i].leg.rotation.x=walking?swing*.55:0;
      npc.arms[i].rotation.x=carry?-1.2:walking?-swing*.38:Math.sin(this.time*3+i)*.24;
      npc.arms[i].rotation.z=0;
    }
  }

  stroll(npc,index,now,background) {
    const stall=stalls[index%4];
    const lane=Math.sign(stall.x)*(1.7+(index%5)*.13);
    const front=Math.abs(stall.x)-2.5;
    const stop=stall.z+1.5;
    const t=((this.time+index*4.1)%24)/24;
    const path=[v(lane,9),v(lane,stop),v(Math.sign(lane)*front,stop)];
    if(!background&&npc.user.departedAt) {
      npc.exitPath??=[npc.group.position.clone(),v(lane,npc.group.position.z),v(lane,13)];
      this.position(npc,npc.exitPath,(now-npc.user.departedAt)/18000);
      return;
    }
    npc.exitPath=null;
    const returning=t>.51;
    if(t<.39) this.position(npc,path,t/.39);
    else if(returning) this.position(npc,[...path].reverse(),(t-.51)/.49,true);
    else {
      npc.group.position.copy(path[2]);
      npc.group.rotation.y=Math.sign(lane)*Math.PI/2;
      this.pose(npc);
    }
    if(background) npc.bag.visible=returning;
    if(!background&&npc.user.action==='wave') npc.arms[1].rotation.z=-1.7+Math.sin(this.time*10)*.3;
  }

  renderOrder(order,now) {
    const stall=stalls[order.stall];
    const side=Math.sign(stall.x),lane=side*(.85+(order.stall%2)*.83);
    const curb=stall.z+1.65;
    const pickup=v(side*4.15,curb);
    const delivery=v(lane*.65,6.53);
    let job=this.deliveries.get(order.id);
    if(!job) {
      const npc=this.createAvatar({id:'courier'+order.stall,name:'Giao hàng',seat:order.stall});
      const item=this.product(order.product,[0,0,0],this.scene,.95);
      job={npc,item};
      this.deliveries.set(order.id,job);
    }
    const age=Math.max(0,now-order.started);
    const {npc,item}=job;
    if(age<pickupTime) {
      this.position(npc,[v(lane,6.5),v(lane,curb),pickup],Math.min(1,age/(pickupTime-400)));
      item.position.set(stall.x,1.31,stall.z+1.05);
      this.vendors[order.stall].arms[1].rotation.x=-1.25;
    } else if(age<handoffTime) {
      this.position(npc,[pickup,v(side*4.05,curb)],(age-pickupTime)/(handoffTime-pickupTime),true);
    } else {
      this.position(npc,[v(side*4.05,curb),v(lane,curb),delivery],Math.min(1,(age-handoffTime)/(orderDuration-handoffTime-500)),true);
    }
    if(age>=pickupTime) {
      npc.group.updateMatrixWorld(true);
      item.position.copy(npc.group.localToWorld(new T.Vector3(0,.96,.51)));
      item.rotation.y=npc.group.rotation.y;
      if(age>=orderDuration-500) {
        item.position.lerp(new T.Vector3(delivery.x,.43,7),Math.min(1,(age-orderDuration+500)/420));
        this.pose(npc);
      }
    }
  }

  frame() {
    this.time+=Math.min(.05,this.clock.getDelta());
    const state=this.state;
    const now=state?state.serverTime+Math.min(250,performance.now()-this.clockAt):this.time*1000;
    const market=state?.market;
    const level=market?.level??0;
    this.unlocked.forEach((group,index)=>{group.visible=index<level;});
    this.vendors.forEach(npc=>this.pose(npc));
    this.anonymous.forEach((npc,index)=>{
      npc.group.visible=index<5+level*2;
      if(npc.group.visible) this.stroll(npc,index,now,true);
    });
    for(const npc of this.avatars.values()) this.stroll(npc,npc.user.seat+7,now,false);
    const active=new Set();
    for(const order of market?.active??[]) {
      active.add(order.id);
      this.renderOrder(order,now);
    }
    for(const [id,job] of this.deliveries) if(!active.has(id)) {
      this.disposeAvatar(job.npc);
      this.scene.remove(job.item);
      this.deliveries.delete(id);
    }
    const displayed=new Set();
    for(const [index,order] of (market?.recent??[]).slice(0,4).entries()) {
      displayed.add(order.id);
      let item=this.displayed.get(order.id);
      if(!item) {
        item=this.product(order.product,[0,0,0],this.scene,.72);
        this.displayed.set(order.id,item);
      }
      item.position.set(-.75+index*.5,.42,7.18);
    }
    for(const [id,item] of this.displayed) if(!displayed.has(id)) {
      this.scene.remove(item);
      this.displayed.delete(id);
    }
    const remaining=(market?.celebrationUntil??0)-now;
    this.effect.visible=remaining>0;
    if(this.effect.visible) {
      this.effect.children.forEach((particle,index)=>{
        const phase=(1-remaining/5500+Math.floor(index/23)*.13)%1;
        const a=index*2.399, r=phase*3.4;
        const center=[-5,0,5][Math.floor(index/24)];
        particle.position.set(center+Math.sin(a)*r,5.8+Math.cos(a)*r-phase*phase*1.7,-7.5+Math.sin(a*.7)*r);
        particle.rotation.set(a,this.time*3,phase*5);
        particle.scale.set(.14,.22,.14);
        particle.material=this.material(this.fireworkColors[index%4]);
      });
    }
    this.scene.updateMatrixWorld(true);
    this.layoutLabels();
    this.renderer.render(this.scene,this.camera);
  }
}
