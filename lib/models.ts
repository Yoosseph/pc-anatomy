import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { byId, colors, type Level } from './manifest';
import type { Vec3 } from './layout';
export interface Piece {key:string;concept:string;instance:number;object:T.Object3D;base:T.Vector3;delta:T.Vector3;extent:T.Vector3;size:number;reveal:number;batch?:T.InstancedMesh;index?:number;inventory:T.Vector3;visible:boolean}
export function buildModel(level:Level){
 const root=new T.Group(), pieces:Piece[]=[];
 const geometry=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
 const material=(color:string,metal=.5,rough=.4)=>{const key=[color,metal,rough].join();if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:rough}));return materials.get(key)!};
 function box(size:Vec3,color:string,metal=.5,r=.035){const key=size.join()+r;let g=geometry.get(key);if(!g){g=new RoundedBoxGeometry(...size,2,r);geometry.set(key,g)}return new T.Mesh(g,material(color,metal))}
 const put=(parent:T.Group,obj:T.Object3D,pos:Vec3)=>{obj.position.set(...pos);parent.add(obj);return obj};
 function add(concept:string,object:T.Object3D,pos:Vec3,delta:Vec3=[0,1,0],reveal=0){
 const instance=pieces.filter(p=>p.concept===concept).length, key=concept+'-'+instance;
 const bounds=new T.Box3().setFromObject(object);const v=bounds.getSize(new T.Vector3());
 const p:Piece={key,concept,instance,object,base:new T.Vector3(...pos),delta:new T.Vector3(...delta),extent:v.clone(),size:Math.max(v.x,v.y,v.z,.1),reveal,inventory:new T.Vector3(),visible:true};
 object.position.copy(p.base);object.userData.piece=p;root.add(object);pieces.push(p);return p;
 }
 function instances(concept:string,positions:Vec3[],size:Vec3,reveal=0,color=colors[byId[concept].category]){
 const baseMaterial=material(color,.25,.5);
 let blockMaterials:T.Material|T.Material[]=baseMaterial;
 if(['gpc','tpc','sm','tensor','scheduler','register','texture','loadstore','sfu','controller'].includes(concept)){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#819487';ctx.lineWidth=3;ctx.strokeRect(15,15,482,226);ctx.fillStyle='#253b30';ctx.font='600 50px monospace';ctx.textAlign='center';const short=byId[concept].shortName.toUpperCase();ctx.fillText(short.length>16?short.slice(0,16):short,256,138,460);
 if(['gpc','tpc','sm'].includes(concept)){ctx.fillStyle='#899f91';for(let j=0;j<4;j++)ctx.fillRect(45+j*115,180,75,28)}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const top=new T.MeshStandardMaterial({map:texture,color,metalness:.1,roughness:.7});blockMaterials=[baseMaterial,baseMaterial,top,baseMaterial,baseMaterial,baseMaterial];
 }
 const mesh=new T.InstancedMesh(new T.BoxGeometry(...size),blockMaterials,positions.length);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;root.add(mesh);const refs:Piece[]=[];
 for(let i=0;i<positions.length;i++){const object=new T.Object3D();object.position.set(...positions[i]);const p:Piece={key:concept+'-'+i,concept,instance:i,object,base:object.position.clone(),delta:new T.Vector3((i%2?1:-1)*.5,1+(i%3)*.4,0),extent:new T.Vector3(...size),size:Math.max(...size),reveal,batch:mesh,index:i,inventory:new T.Vector3(),visible:true};pieces.push(p);refs.push(p);mesh.setColorAt(i,new T.Color(color))}mesh.userData.pieces=refs;return refs;
 }
 function label(parent:T.Group,text:string,pos:Vec3,width:number,color='#c7d0cb'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle=color;ctx.textAlign='center';ctx.font='500 42px monospace';ctx.fillText(text,256,63);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const m=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});const plane=new T.Mesh(new T.PlaneGeometry(width,width*96/512),m);plane.rotation.x=-Math.PI/2;put(parent,plane,pos);
 }
 if(level==='card'){
  const pcb=new T.Group();put(pcb,box([7.9,.12,3.15],'#204b3d',.22),[0,0,0]);
  const traceMat=material('#658776',.5);const traces=new T.InstancedMesh(new T.BoxGeometry(1,.004,.012),traceMat,90);const helper=new T.Object3D();
  for(let i=0;i<90;i++){helper.position.set(-3.65+(i%18)*.42,.067,-1.4+Math.floor(i/18)*.59);helper.scale.set(.2+(i%4)*.12,1,1);helper.updateMatrix();traces.setMatrixAt(i,helper.matrix)}pcb.add(traces);add('pcb',pcb,[0,0,0],[0,-.8,0]);
  const plate=new T.Group();put(plate,box([8.7,.13,3.55],'#353c3d',.8),[0,0,0]);for(const x of [-3.9,3.9])for(const z of [-1.4,1.4]){const screw=new T.Mesh(new T.CylinderGeometry(.07,.07,.02,12),material('#afbab8'));put(plate,screw,[x,.08,z])}add('backplate',plate,[0,-.28,0],[0,-2.7,0]);
  const pkg=new T.Group();put(pkg,box([1.62,.13,1.65],'#355c43',.35),[0,0,0]);put(pkg,box([1.09,.075,1.1],'#b0bcb8',.86),[0,.11,0]);label(pkg,'GB202',[0,.15,0],.8,'#334540');add('package',pkg,[-.2,.16,0],[0,1.65,0]);
  const memoryPos:Vec3[]=[];for(let i=0;i<4;i++){memoryPos.push([-.98+i*.52,.15,-1.18],[-.98+i*.52,.15,1.18],[-1.42,.15,-.8+i*.52],[1.03,.15,-.8+i*.52])}instances('gddr7',memoryPos,[.43,.12,.37],0,'#252d32').forEach(p=>p.delta.set(p.base.x*.8,.7,p.base.z*.8));
  const vrm:Vec3[]=[],caps:Vec3[]=[];for(let i=0;i<12;i++){vrm.push([2+(i%2)*.5,.18,-1.25+Math.floor(i/2)*.49]);caps.push([3.2+(i%2)*.3,.2,-1.2+Math.floor(i/2)*.48])}instances('vrm',vrm,[.34,.25,.35],0,'#9d9990').forEach(p=>p.delta.set(2.3,.6,0));
  for(const pos of caps){const c=new T.Group();put(c,new T.Mesh(new T.CylinderGeometry(.09,.09,.22,12),material('#45494a')),[0,0,0]);put(c,new T.Mesh(new T.CylinderGeometry(.086,.086,.012,12),material('#b3b7b1')),[0,.118,0]);add('capacitor',c,pos,[3,.4,0])}
  const vapor=new T.Group();put(vapor,box([3.4,.16,2.9],'#ad8870',.85),[0,0,0]);for(const z of [-1,-.65,.65,1])put(vapor,box([7.4,.1,.16],'#b29277',.85),[0,.05,z]);add('vapor',vapor,[0,.42,0],[0,2.8,0]);
  for(const side of [-1,1]){const fins=new T.Group();const fin=new T.InstancedMesh(new T.BoxGeometry(.024,.68,3.1),material('#9da9aa',.8,.32),65);for(let i=0;i<65;i++){helper.position.set((i-32)*.057,0,0);helper.scale.set(1,1,1);helper.updateMatrix();fin.setMatrixAt(i,helper.matrix)}fins.add(fin);add('heatsink',fins,[side*2.2,.81,0],[side*.45,3.8,0])}
  const frame=new T.Group();for(const z of [-1.78,1.78])put(frame,box([8.9,.55,.18],'#727f80',.85),[0,0,z]);for(const x of [-4.37,4.37])put(frame,box([.18,.55,3.6],'#727f80',.85),[x,0,0]);put(frame,box([1.15,.14,3.45],'#343b3d',.7),[0,.21,0]);label(frame,'RTX 5090',[0,.29,0],1);add('shroud',frame,[0,1.05,0],[0,4.9,0]);
  const bladeShape=new T.Shape();bladeShape.moveTo(.3,-.1);bladeShape.bezierCurveTo(.6,-.58,1.16,-.58,1.39,-.3);bladeShape.bezierCurveTo(1.1,-.13,.86,.16,.42,.21);bladeShape.closePath();const bladeGeo=new T.ExtrudeGeometry(bladeShape,{depth:.06,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.01,curveSegments:9});bladeGeo.rotateX(-Math.PI/2);
  for(const x of [-2.3,2.3]){const fan=new T.Group();const ring=new T.Mesh(new T.TorusGeometry(1.48,.07,10,64),material('#40494a',.7));ring.rotation.x=Math.PI/2;fan.add(ring);for(let i=0;i<11;i++){const blade=new T.Mesh(bladeGeo,material('#172022',.3,.5));blade.rotation.y=i*Math.PI*2/11;fan.add(blade)}fan.add(new T.Mesh(new T.CylinderGeometry(.38,.38,.18,40),material('#3c4548',.6)));fan.add(new T.Mesh(new T.CylinderGeometry(.23,.23,.19,32),material('#6c7a7c',.85)));add('fan',fan,[x,1.27,0],[x*.2,5.4,0])}
  const io=new T.Group();put(io,box([.11,1.36,3.65],'#a5afaf',.8),[0,0,0]);for(let i=0;i<4;i++){put(io,box([.22,.25,.55],'#303738'),[-.1,-.3,-1.15+i*.76]);put(io,box([.23,.15,.39],'#14191c'),[-.13,-.3,-1.15+i*.76])}for(let i=0;i<11;i++)put(io,box([.12,.08,.15],'#262e30'),[-.015,.4,-1.45+i*.28]);add('io',io,[-4.52,.3,0],[-1.8,0,0]);
  const pcie=new T.Group();put(pcie,box([3.5,.07,.4],'#b29a65',.8),[0,0,0]);for(let i=0;i<52;i++)put(pcie,box([.017,.08,.36],'#3a443a'),[-1.7+i*.066,0,0]);add('pcie',pcie,[-1.3,-.025,1.73],[0,-1.3,1]);
  const power=new T.Group();put(power,box([.88,.35,.44],'#202527'),[0,0,0]);for(let i=0;i<12;i++)put(power,box([.075,.05,.06],'#a4a695',.7),[-.33+(i%6)*.13,.18,-.1+Math.floor(i/6)*.18]);add('power',power,[1.1,.28,-1.65],[0,.4,-1.8]);
  instances('gpc',Array.from({length:11},(_,i)=>[(i%6-2.5)*1.05,2.7,(Math.floor(i/6)-.5)*1.2] as Vec3),[.84,.16,.9],.61);
  instances('sm',Array.from({length:170},(_,i)=>[(i%17-8)*.4,3.5,(Math.floor(i/17)-4.5)*.38] as Vec3),[.29,.11,.27],.72);
 } else if(level==='die'){
  instances('gpc',Array.from({length:11},(_,i)=>[(i%6-2.5)*1.45,.2,(Math.floor(i/6)-.5)*2.3] as Vec3),[1.21,.3,1.72]);
  const l2=new T.Group();put(l2,box([8.5,.2,.45],colors.Memory,.25),[0,0,0]);label(l2,'L2 CACHE · 96 MB',[0,.12,0],3.2);add('l2',l2,[0,.15,0],[0,1.5,0]);
  instances('controller',Array.from({length:16},(_,i)=>[(i%8-3.5)*1.08,.18,i<8?-2.7:2.7] as Vec3),[.85,.2,.43]);
 } else if(level==='gpc'){
  instances('tpc',Array.from({length:8},(_,i)=>[(i%4-1.5)*1.9,.2,(Math.floor(i/4)-.5)*2.1] as Vec3),[1.65,.28,1.5]);
  const raster=new T.Group();put(raster,box([7.4,.2,.55],colors.Graphics,.3),[0,0,0]);label(raster,'RASTER ENGINE',[0,.12,0],3);add('raster',raster,[0,.2,-2.35]);instances('rop',[[-2,.2,2.35],[2,.2,2.35]],[3.5,.22,.55]);
 } else if(level==='tpc'){
  instances('sm',[[-2,.2,0],[2,.2,0]],[3.4,.32,3.5]);const poly=new T.Group();put(poly,box([7.3,.2,.6],colors.Graphics,.3),[0,0,0]);label(poly,'POLYMORPH ENGINE',[0,.12,0],3.9);add('polymorph',poly,[0,.18,-2.25]);
 } else {
  const cuda:Vec3[]=[],tensor:Vec3[]=[],sched:Vec3[]=[],regs:Vec3[]=[],tex:Vec3[]=[],ls:Vec3[]=[],sfu:Vec3[]=[];
  for(let q=0;q<4;q++){const x=(q-1.5)*2.1;for(let i=0;i<32;i++)cuda.push([x+(i%4-1.5)*.43,.2,-1.1+Math.floor(i/4)*.34]);tensor.push([x,.2,2.05]);sched.push([x,.2,-2.65]);regs.push([x,.2,-2.05]);tex.push([x,.2,2.75]);ls.push([x-.48,.2,1.57]);sfu.push([x+.48,.2,1.57])}
  instances('cuda',cuda,[.35,.16,.24]);instances('tensor',tensor,[1.8,.26,.53],0,'#cab886');instances('scheduler',sched,[1.8,.2,.4],0,'#a7bab3');instances('register',regs,[1.8,.18,.43]);instances('texture',tex,[1.8,.19,.42]);instances('loadstore',ls,[.8,.17,.25]);instances('sfu',sfu,[.8,.17,.25]);
  const l1=new T.Group();put(l1,box([8.1,.18,.55],colors.Memory,.3),[0,0,0]);label(l1,'L1 / SHARED MEMORY · 128 KB',[0,.11,0],4.8);add('l1',l1,[0,.15,3.45]);const rt=new T.Group();put(rt,box([8.1,.2,.65],colors.Graphics,.3),[0,0,0]);label(rt,'4TH GENERATION RT CORE',[0,.12,0],4.5);add('rt',rt,[0,.15,-3.5]);
 }
 return {root,pieces};
}


