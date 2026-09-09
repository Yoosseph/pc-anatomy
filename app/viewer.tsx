'use client';
import { useEffect, useRef } from 'react';
import { createViewer } from '@/lib/scene';
export default function Viewer({explode}:{explode:number}) {
 const host=useRef<HTMLDivElement>(null);
 const engine=useRef<ReturnType<typeof createViewer>|null>(null);
 useEffect(()=>{if(!host.current)return;engine.current=createViewer(host.current);return()=>engine.current?.dispose()},[]);
 useEffect(()=>{engine.current?.update(explode)},[explode]);
 return <div ref={host} className="viewport" aria-label="Interactive 3D graphics card"/>;
}
