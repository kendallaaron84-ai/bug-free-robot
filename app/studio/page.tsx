"use client";

import React, { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  ChevronLeft, Mic, Lock, FileAudio, FileVideo, 
  Save, GripVertical, Trash2, Languages 
} from "lucide-react";
import Link from "next/link";

export default function ProductionStudio({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = use(params); 

  const [productData, setProductData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("media");
  const [mediaType, setMediaType] = useState("audio");
  const [vaultStatus, setVaultStatus] = useState("unprotected");
  const [tracks, setTracks] = useState<any[]>([]);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", assetId); 
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProductData(data);
          if (data.vaultStatus) setVaultStatus(data.vaultStatus);
          if (data.studioTracks) setTracks(data.studioTracks);
        }
      } catch (error) {
        console.error("Studio Load Fault:", error);
      }
    };
    fetchProduct();
  }, [assetId]);

  const handleSaveConfiguration = async () => {
    try {
      const docRef = doc(db, "products", assetId); 
      await updateDoc(docRef, { studioTracks: tracks, vaultStatus: vaultStatus });
    } catch (e) { console.error(e); }
  };

  const addNewTrackRow = () => {
    setTracks([...tracks, {
      id: `track_${Date.now()}`,
      chapterNumber: tracks.length + 1,
      title: `Chapter ${tracks.length + 1}: Untitled`,
      fileName: "No file attached",
      uploadStatus: "empty"
    }]);
  };

  const triggerTranscription = async (trackId: string) => {
    if (transcribingId) return;
    setTranscribingId(trackId);
    try {
      // Pings your centralized master-key backend route
      const response = await fetch(`/api/studio/transcribe`, {
        method: "POST",
        body: JSON.stringify({ trackId, assetId }),
      });
      if (response.ok) {
        setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isTranscribed: true } : t));
        handleSaveConfiguration();
      }
    } catch (e) { console.error(e); }
    finally { setTranscribingId(null); }
  };

  if (!productData) return <div className="h-screen flex items-center justify-center bg-slate-950 text-[#F9B437] font-mono">Initializing Studio...</div>;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-[#7C2B22]/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-[#7C2B22]/30 flex items-center gap-3">
          <Link href="/products" className="p-1.5 bg-slate-100 dark:bg-[#7C2B22]/20 rounded-md hover:bg-slate-200 dark:hover:bg-[#7C2B22]/40 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-[#F9B437]" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Master Deck</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F9B437] truncate">{productData.title}</span>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("media")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${activeTab === "media" ? "bg-slate-100 dark:bg-[#7C2B22] text-[#F9B437]" : "text-slate-500"}`}>
            <Mic className="w-4 h-4" /> Production Manifest
          </button>
          <button onClick={() => setActiveTab("vault")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${activeTab === "vault" ? "bg-emerald-900/20 text-emerald-400" : "text-slate-500"}`}>
            <Lock className="w-4 h-4" /> Cloud Voice Vault
          </button>
        </div>
      </div>

      {/* Main Studio Console */}
      <div className="flex-1 flex flex-col relative bg-slate-100 dark:bg-[#070a11]">
        <div className="h-16 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
                <button onClick={() => setMediaType("audio")} className={`text-xs font-bold uppercase ${mediaType === 'audio' ? 'text-[#F9B437]' : 'text-slate-500'}`}>Audio Mode</button>
                <button onClick={() => setMediaType("video")} className={`text-xs font-bold uppercase ${mediaType === 'video' ? 'text-[#F9B437]' : 'text-slate-500'}`}>Video Mode</button>
            </div>
            <button onClick={handleSaveConfiguration} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-emerald-500">
                Save Studio
            </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === "media" && (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-[#F9B437]">Track Manifest</h2>
                    <button onClick={addNewTrackRow} className="bg-[#7C2B22] text-[#F9B437] text-xs font-bold uppercase px-4 py-2 rounded-lg">+ Add Chapter</button>
                </div>
                {tracks.map((track, index) => (
                    <div key={track.id} className="bg-white dark:bg-[#0b0f19] border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                        <GripVertical className="text-slate-600" />
                        <div className="flex-1">
                            <input value={track.title} onChange={(e) => {
                                const t = [...tracks]; t[index].title = e.target.value; setTracks(t);
                            }} className="bg-transparent w-full font-bold text-xs text-slate-200 focus:outline-none" />
                        </div>
                        <button onClick={() => triggerTranscription(track.id)} className="text-[10px] font-bold uppercase bg-slate-800 px-3 py-1 rounded">
                            {transcribingId === track.id ? "Working..." : "Transcribe"}
                        </button>
                        <Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => setTracks(tracks.filter(t => t.id !== track.id))} />
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}