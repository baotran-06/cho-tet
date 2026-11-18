import * as T from '../assets/vendor/three.module.js';

const profiles = ['flower-vendor', 'scarf-vendor', 'shopper', 'courier'];
const format = new T.Matrix4().makeRotationX(-Math.PI / 2);
const fit = new T.Matrix4().makeScale(.89, .89, .89);
const ground = new T.Matrix4().makeTranslation(0, -.227, 0);
const poseSpace = ground.multiply(fit).multiply(format);
const skin = new T.MeshStandardMaterial({vertexColors:true, roughness:.68});
const pivots = {
  body: [0,0,0], parcel: [0,0,0],
  armL: [-.18,1.13,0], armR: [.18,1.13,0],
  legL: [-.104,.76,0], legR: [.104,.76,0]
};

export async function loadMarketNpcs() {
  const models = await Promise.all(profiles.map(async profile => {
    const url = new URL('../assets/npc/' + profile + '.json', import.meta.url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Không tải được NPC ' + profile);
    return [profile, bake(await response.json())];
  }));
  return new Map(models);
}

function shirt(rings) {
  const vertices = [], indices = [];
  const count = 40;
  for (const [row, [z, width, depth]] of rings.entries()) {
    for (let i=0;i<count;i++) {
      const angle=i*Math.PI*2/count;
      const sine=Math.sin(angle);
      const pleat=1+(row===0?.048:.014)*Math.cos(9*angle);
      const slit=row===0?.086*Math.exp(-((sine/.13)**2)):0;
      vertices.push(width*sine*pleat,-depth*Math.cos(angle)*pleat,z+slit);
      if (row<rings.length-1) {
        const a=row*count+i,b=row*count+(i+1)%count;
        indices.push(a,b,a+count,b,b+count,a+count);
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function shape(kind, size, data) {
  if (kind==='ell') return new T.SphereGeometry(1,12,9).rotateX(Math.PI/2).scale(...size);
  if (kind==='box') return new T.BoxGeometry(...(data??size));
  if (kind==='shirt') return shirt(data[0]);
  if (kind==='cone') return new T.CylinderGeometry(data[1],data[0],data[2],48).rotateX(Math.PI/2);
  if (kind==='ring') return new T.TorusGeometry(data[0],data[1],5,36);
  const [points,width,radii]=data;
  const path=new T.CatmullRomCurve3(points.map(point=>new T.Vector3(...point)));
  const divisions=Math.max(4,(points.length-1)*4), sides=6;
  const geometry=new T.TubeGeometry(path,divisions,width,sides);
  if (radii) {
    const position=geometry.attributes.position;
    const point=new T.Vector3();
    for (let i=0;i<=divisions;i++) {
      const t=i/divisions;
      const middle=path.getPointAt(t);
      const index=t*(radii.length-1);
      const radius=T.MathUtils.lerp(radii[Math.floor(index)],radii[Math.ceil(index)],index%1);
      for (let j=0;j<=sides;j++) {
        const n=i*(sides+1)+j;
        point.fromBufferAttribute(position,n).sub(middle).multiplyScalar(radius).add(middle);
        position.setXYZ(n,point.x,point.y,point.z);
      }
    }
    geometry.computeVertexNormals();
  }
  return geometry;
}

function bake([colors,parts]) {
  const buffers=Object.fromEntries(Object.keys(pivots).map(name=>[name,{positions:[],normals:[],colors:[]}]));
  for (const [kind,part,color,location,rotation,scale,data] of parts) {
    const indexed=shape(kind,scale,data);
    const matrix=new T.Matrix4().makeRotationFromEuler(new T.Euler(...rotation));
    matrix.setPosition(...location);
    indexed.applyMatrix4(matrix).applyMatrix4(poseSpace).translate(...pivots[part].map(value=>-value));
    const geometry=indexed.index?indexed.toNonIndexed():indexed;
    const target=buffers[part];
    const positions=geometry.attributes.position.array,normals=geometry.attributes.normal.array;
    for (let i=0;i<positions.length;i+=3) {
      target.positions.push(positions[i],positions[i+1],positions[i+2]);
      target.normals.push(normals[i],normals[i+1],normals[i+2]);
      target.colors.push(...colors[color]);
    }
    geometry.dispose();
    if (indexed!==geometry) indexed.dispose();
  }
  return Object.entries(buffers).filter(([,mesh])=>mesh.positions.length).map(([name,mesh])=>{
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(mesh.positions,3));
    geometry.setAttribute('normal',new T.Float32BufferAttribute(mesh.normals,3));
    geometry.setAttribute('color',new T.Float32BufferAttribute(mesh.colors,3));
    return [name,geometry];
  });
}

export function applyMarketNpc(actor,model) {
  if (!model) return;
  const joints={
    body:actor.body, parcel:actor.body,
    armL:actor.arms[0],armR:actor.arms[1],
    legL:actor.legs[0].leg,legR:actor.legs[1].leg
  };
  for (const child of [...actor.body.children]) {
    if (!actor.arms.includes(child)&&!actor.legs.some(({leg})=>leg===child)) child.removeFromParent();
  }
  for (const name of ['armL','armR','legL','legR']) {
    joints[name].clear();
    joints[name].position.set(...pivots[name]);
  }
  for (const [name,geometry] of model) {
    const mesh=new T.Mesh(geometry,skin);
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    joints[name].add(mesh);
    if (name==='parcel') actor.parcel=mesh;
  }
  actor.customMarketNpc=true;
}
