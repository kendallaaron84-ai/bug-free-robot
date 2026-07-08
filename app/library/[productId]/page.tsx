"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Script from "next/script";

export default function BlankCanvasPlayer() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const audioNodeRef = useRef<HTMLAudioElement>(null);
  
  const [engineLoaded, setEngineLoaded] = useState(false);

  // Directly bind a pre-hydration audio node so the agnostic engine can attach without triggering React re-renders.
  useEffect(() => {
    if (!audioNodeRef.current) return;
    
    // The engine looks for specific mount points. We create a resilient DOM structure.
    console.log("[Blank Canvas] Immersive mode pre-hydration ready.");
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0f172a] text-white flex flex-col items-center justify-center overflow-hidden">
      {/* Top Nav (Immersive mode escape hatch) */}
      <button 
        onClick={() => router.push('/library')}
        className="absolute top-6 left-6 z-[100000] p-3 bg-slate-900/50 hover:bg-slate-800 text-white rounded-full border border-slate-700/50 transition-colors backdrop-blur-md shadow-lg"
        title="Return to Library"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Load React via CDN for the agnostic engine to use (simulating external environment) */}
      <Script src="https://unpkg.com/react@18/umd/react.production.min.js" strategy="beforeInteractive" />
      <Script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" strategy="beforeInteractive" />
      
      {/* Load the Agnostic Engine */}
      <Script 
        src="/assets/jubilee-core.js" 
        strategy="lazyOnload"
        onLoad={() => setEngineLoaded(true)}
      />

      <div className="w-full h-full flex flex-col items-center justify-center relative">
        {/* Pre-hydrated hardware audio node for anti-piracy shield to lock onto before the engine boots */}
        <audio ref={audioNodeRef} id="hardware-audio-node" style={{ display: 'none' }} crossOrigin="anonymous"></audio>

        {/* 
          The Engine Mount Point. 
          We use data-asset and standard config here. 
          The agnostic engine will auto-bootstrap into this node.
        */}
        <div 
          id="jubilee-bloom-root" 
          data-asset={productId} 
          data-studio-key="INTERNAL_DASHBOARD" // Tells the API this is internal
          className="w-full h-full"
        >
          {/* Loading State before engine takes over */}
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
             <div className="text-slate-400 font-semibold uppercase tracking-widest text-sm">
                Initializing Blank Canvas...
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
