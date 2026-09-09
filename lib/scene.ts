import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export function createViewer(host:HTMLDivElement) {
 const scene=new THREE.Scene();
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.6;host.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(10,12,15);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,0,0);controls.minDistance=5;controls.maxDistance=40;
 scene.add(new THREE.HemisphereLight(0xd6e6ff,0x555146,3));
 for(const [pos,power,color] of [[[3,9,3],100,0xffffff],[[-7,5,0],70,0xc2d8ef],[[0,3,-8],80,0xffe6cf]] as const){const light=new THREE.PointLight(color,power,40);light.position.set(pos[0],pos[1],pos[2]);scene.add(light)}
 const assembly=new THREE.Group();scene.add(assembly);assembly.rotation.y=-.16;
 const pieces:{object:THREE.Object3D,base:THREE.Vector3,delta:THREE.Vector3}[]=[];
 const mat=(c:string,metal=.5,rough=.4)=>new THREE.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});
 const dark=mat('#252b2c'),silver=mat('#9cabae',.85,.3),black=mat('#151a1b'),green=mat('#164439',.35),gold=mat('#b9a16b',.7),chip=mat('#111619'),copper=mat('#b48b6d',.8);
 const add=(object:THREE.Object3D,pos:number[],delta:number[])=>{object.position.set(pos[0],pos[1],pos[2]);assembly.add(object);pieces.push({object,base:object.position.clone(),delta:new THREE.Vector3(...delta)});return object};
 const box=(size:number[],m:THREE.Material,r=.03)=>new THREE.Mesh(new RoundedBoxGeometry(size[0],size[1],size[2],2,r),m);
 add(box([8,.12,3.2],green),[0,0,0],[0,-1,0]);add(box([8.7,.15,3.55],dark),[0,-.26,0],[0,-2.3,0]);
 add(box([1.6,.13,1.6],green),[-.3,.13,0],[0,1,0]);add(box([1.12,.1,1.12],silver),[-.3,.25,0],[0,1.2,0]);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;add(box([.43,.12,.4],chip),[-.3+Math.cos(a)*1.3,.14,Math.sin(a)*1.13],[Math.cos(a)*1.8,.5,Math.sin(a)*1.8])}
 for(let i=0;i<18;i++)add(box([.28,.25,.32],silver),[2.3+(i%3)*.42,.2,-1.1+Math.floor(i/3)*.43],[2,0,0]);
 add(box([2.4,.24,2.25],copper),[-.3,.43,0],[0,2.4,0]);
 for(let side=0;side<2;side++){const fins=new THREE.Group();for(let i=0;i<60;i++){const fin=box([.026,.68,3.13],silver,.005);fin.position.x=(i-30)*.058;fins.add(fin)}add(fins,[-2.12+side*4.24,.69,0],[side===0?-1:1,3,0])}
 const frame=new THREE.Group();for(const z of [-1.78,1.78]){const rail=box([8.9,.48,.16],silver);rail.position.set(0,1,z);frame.add(rail)}for(const x of [-4.38,4.38]){const rail=box([.17,.48,3.6],silver);rail.position.set(x,1,0);frame.add(rail)}const center=box([1.15,.2,3.4],dark);center.position.y=1.12;frame.add(center);add(frame,[0,0,0],[0,4.8,0]);
 for(const x of [-2.3,2.3]){const fan=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(1.47,.09,10,64),dark);ring.rotation.x=Math.PI/2;fan.add(ring);for(let i=0;i<11;i++){const blade=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,.065,3),black);const a=i*Math.PI*2/11;blade.scale.set(.7,1,1.05);blade.position.set(Math.cos(a)*.83,0,Math.sin(a)*.83);blade.rotation.y=-a+.5;fan.add(blade)}fan.add(new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.17,40),dark));const hub=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.18,32),silver);fan.add(hub);add(fan,[x,1.22,0],[x*.25,5.2,0])}
 add(box([.14,1.3,3.7],silver),[-4.55,.35,0],[-1.4,0,0]);add(box([3.4,.09,.35],gold),[-1.3,-.05,1.74],[0,-1.4,1]);add(box([.85,.4,.42],black),[1.1,.3,-1.7],[0,.4,-1.4]);
 let target=0,current=0,frameId=0;
 const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function render(){frameId=requestAnimationFrame(render);current=THREE.MathUtils.lerp(current,target,.09);for(const p of pieces)p.object.position.copy(p.base).addScaledVector(p.delta,current);controls.target.y=2*current;controls.update();renderer.render(scene,camera)}render();
 return {update:(value:number)=>{target=value/100},dispose:()=>{cancelAnimationFrame(frameId);observer.disconnect();controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});renderer.dispose();renderer.domElement.remove()}};
}

