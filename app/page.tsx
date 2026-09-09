'use client';
import { useState } from 'react';
import { Cpu, Search, RotateCcw, Layers3, ArrowUpRight, Maximize, Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import Viewer from './viewer';

export default function Home() {
 const [explode, setExplode] = useState(0);
 return <main className="atlas">
 <header className="topbar"><a className="brand" href="/"><Cpu size={23}/><span>DIE<span className="brand-light">DIVE</span></span><span className="edition">GPU ATLAS / 01</span></a><button className="search-button"><Search size={17}/> Find a component <kbd>/</kbd></button></header>
 <section className="specimen-heading"><p className="eyebrow"><span className="status-dot"/> INTERACTIVE HARDWARE ATLAS</p><h1>GeForce RTX 5090</h1><p>Blackwell architecture <span>·</span> NVIDIA GB202</p></section>
 <Viewer explode={explode}/>
 <aside className="layers panel"><div className="panel-title"><Layers3 size={17}/> Systems <span>6</span></div><div className="presets"><button className="active">All systems</button><button>Hardware</button></div>{['Cooling','Board','Power','Memory','Compute','Graphics'].map((name,i)=><div className="layer-row" key={name}><i style={{background:['#acb8b9','#719a8c','#d5a06b','#7ca6cf','#8db7a0','#b197c4'][i]}}/>{name}<Switch defaultChecked aria-label={name}/></div>)}<div className="panel-foot">Physical + logical structures</div></aside>
 <div className="view-controls panel"><button title="Perspective view">¾</button><button title="Top view">T</button><button title="Front view">F</button><hr/><button title="Fit view"><Maximize size={17}/></button><button title="Reset"><RotateCcw size={17}/></button></div>
 <div className="scene-caption"><span className="caption-line"/> {explode===0?'COMPLETE ASSEMBLY':explode===100?'COMPONENT INVENTORY':'SEPARATED STRUCTURES'} <span className="caption-line"/></div>
 <section className="explode panel"><div className="explode-main"><div className="explode-title"><span><Layers3 size={18}/> Explode GPU</span><output>{explode}<small>%</small></output></div><Slider value={[explode]} onValueChange={v=>setExplode(Array.isArray(v)?v[0]:v)} aria-label="Explode GPU"/><div className="range-labels"><span>Assembled</span><span>Every component</span></div></div><button className="reset" onClick={()=>setExplode(0)}><RotateCcw size={19}/><span>Reset</span></button></section>
 <div className="specimen-meta"><span>01 / REFERENCE SPECIMEN</span><strong>92.2B <small>transistors</small></strong><p>32 GB GDDR7 <span>·</span> 575 W</p></div>
 <footer><span>Drag to orbit <b>·</b> Scroll to zoom <b>·</b> Click to inspect</span><button><Info size={14}/> About & sources <ArrowUpRight size={14}/></button></footer>
 </main>
}
