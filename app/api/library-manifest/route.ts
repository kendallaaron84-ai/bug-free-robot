// app/api/library-manifest/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 📦 The Master Fallback Catalog (Updated to support Atkinson Hyperlegible default for cold passes)
const fallbackCatalog = [
  {
    assetId: "asset_duncan_audio_01",
    title: "Duncan the Man Hunter - Unabridged",
    author: "Kendall O'Brian Aaron",
    coverArt: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500",
    bgImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000",
    type: "Audiobook",
    price: "14.99",
    description: "A cinematic long-form audio drama experience set in a neon-drenched cyberpunk landscape.",
    pubDate: "2026",
    chapters: [
      { id: "duncan_ch1", title: "Chapter 1: Rain-Slicked Streets", url: "http://localhost:3000/api/stream/duncan_01" }
    ]
  },
  {
    assetId: "short_story_sovereign",
    title: "The Sovereign Decentral",
    author: "Kendall O'Brian Aaron",
    coverArt: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=500",
    bgImage: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=1000",
    type: "E-Book",
    price: "0.00", 
    description: "An immersive text exploring digital ownership, decentralized pipelines, and creative autonomy.",
    pubDate: "2026",
    ebookPayload: {
      fontPreference: "Atkinson Hyperlegible",
      chapters: [
        { 
          id: "sov_ch1", 
          title: "The Decoupled Blueprint", 
          textContent: "The corporate middlemen had built glass towers on the backs of uncompensated vocal cords. But deep in the local subnets, the independent nodes began to sing directly to their listeners..." 
        }
      ]
    }
  }
];

// 🚀 Unified GET Request Handler
export async function GET() {
  try {
    // 🔥 DYNAMIC RUNTIME IMPORT: Keeps Firebase completely isolated from the build compiler
    const admin = require("firebase-admin");

    if (!admin || !admin.apps || !admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      } catch (e) {
        console.warn("⚠️ Firebase Admin initialization bypassed during build pass.");
        return NextResponse.json(fallbackCatalog, { headers: { "Access-Control-Allow-Origin": "*" } });
      }
    }

    const db = admin.firestore();
    
    // Fetch live production publications flagged as Active
    const snapshot = await db.collection("products").where("status", "==", "Active").get();
    
    if (snapshot.empty) {
      return NextResponse.json(fallbackCatalog, { headers: { "Access-Control-Allow-Origin": "*" } });
    }
    
// ... (keep the database fetch query logic exactly the same)

const manifest = snapshot.docs.map((doc: any) => {
  const data = doc.data();
  const isEbook = data.type === "E-Book";

  return {
    assetId: data.assetKey || doc.id,
    assetKey: data.assetKey || doc.id, // 🚀 FIXED: Explicitly map assetKey for frontend includes validation checks!
    title: data.title || "Untitled",
    author: data.author || "Kendall O'Brian Aaron",
    type: data.type || "Audiobook", 
    price: data.price || "19.99",
    description: data.description || "",
    pubDate: data.pubDate || "2026",
    coverArt: data.coverArtUrl || data.image || "", 
    bgImage: data.bgImageUrl || data.image || "",

        // Dynamic properties based on deployment criteria
        chaptersCount: isEbook 
          ? (data.ebookPayload?.chapters?.length || 0)
          : (data.studioTracks?.length || 0),
        
        chapters: !isEbook ? (data.studioTracks || []) : [],
        
        ebookPayload: isEbook ? {
          fontPreference: data.ebookPayload?.fontPreference || "Atkinson Hyperlegible",
          chapters: data.ebookPayload?.chapters || []
        } : null
      };
    });

    return NextResponse.json(manifest, { headers: { "Access-Control-Allow-Origin": "*" } });

  } catch (error) {
    console.error("❌ Library Manifest Runtime Error:", error);
    return NextResponse.json(fallbackCatalog, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
}