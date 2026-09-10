import {test} from 'node:test';
import assert from 'node:assert/strict';
import {manifest,byId,initialState,selectSearch,searchConcepts,levelPath,colors,categories} from '../lib/manifest.ts';
import {inventoryLayout,smoothstep,finiteBounds} from '../lib/layout.ts';

await test('all concepts have unique identities, reciprocal parents, sources and no cycles',()=>{
 assert.equal(new Set(manifest.map(c=>c.id)).size,manifest.length);
 for(const c of manifest){assert.ok(c.description&&c.purpose&&c.sources.length&&c.quantity);assert.ok(categories.includes(c.category));assert.ok(colors[c.category]);assert.ok(c.physicalAccuracy.length>30);if(c.parent){assert.ok(byId[c.parent]);assert.ok(byId[c.parent].children.includes(c.id))}for(const child of c.children)assert.equal(byId[child].parent,c.id);const visited=new Set<string>();let id:string|null=c.id;while(id){assert.ok(!visited.has(id),'cycle at '+id);visited.add(id);id=byId[id].parent}}
});
await test('shipping SKU counts are distinct from full-chip capacity',()=>{assert.equal(byId.die.specifications.SMs,'170');assert.equal(byId.die.specifications.TPCs,'85');assert.equal(byId.die.specifications.GPCs,'11');assert.equal(Number(byId.die.specifications['CUDA cores'].replace(',','')),170*128);assert.equal(byId.l2.specifications.Capacity,'96 MB');assert.equal(byId.gpc.specifications['Full GPC'],'8 TPCs / 16 SMs')});
await test('search covers requested concepts, plurals and case without irrelevant misses',()=>{
 for(const [query,id] of [['Tensor Core','tensor'],['GDDR7','gddr7'],['L2','l2'],['all SMs','sm'],['VRM','vrm'],['RT Core','rt'],['CUDA','cuda']])assert.ok(searchConcepts(query).some(c=>c.id===id),query);
 assert.equal(searchConcepts('nonsense missing component').length,0);
});
await test('search restores hidden layers, selects groups and navigates to the correct context',()=>{const hidden={...initialState,visible:[],hidden:['tensor'],isolated:true};const next=selectSearch(hidden,'tensor');assert.equal(next.level,'sm');assert.ok(next.visible.includes('Compute'));assert.ok(!next.hidden.includes('tensor'));assert.equal(next.selection?.concept,'tensor');assert.equal(next.selection?.instance,undefined);assert.equal(next.isolated,false);assert.ok(next.focusRevision>hidden.focusRevision);assert.equal(hidden.hidden.length,1);assert.deepEqual(levelPath.sm,['card','die','gpc','tpc','sm'])});
await test('deterministic inventories fit every normalized component without overlap at supported aspect ratios',()=>{
 for(const n of [0,1,28,52,154,233])for(const aspect of [.45,.7,1,1.8,2.4]){const p=inventoryLayout(n,aspect);assert.equal(p.length,n);assert.ok(finiteBounds(p));assert.deepEqual(p,inventoryLayout(n,aspect));for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)assert.ok(Math.abs(p[i][0]-p[j][0])>=1.12||Math.abs(p[i][2]-p[j][2])>=1.12,'component cells intersect')}
});
await test('explosion stage interpolation clamps boundaries and progresses monotonically',()=>{assert.equal(smoothstep(.2,.7,0),0);assert.equal(smoothstep(.2,.7,1),1);let last=0;for(let x=0;x<=100;x++){const v=smoothstep(.2,.7,x/100);assert.ok(v>=last&&v<=1);last=v}});

