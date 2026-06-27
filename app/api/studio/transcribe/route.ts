// app/api/studio/transcribe/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { trackId, assetId } = await request.json();

    if (!trackId || !assetId) {
      return NextResponse.json({ success: false, message: "Missing tracking identifiers." }, { status: 400 });
    }

    // 1. Pull the Gemini API token from your .env.local file safely
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: "Gemini API key missing. Please insert GEMINI_API_KEY into your .env.local file." 
      }, { status: 500 });
    }

    // 2. 🚀 FIXED: Use modular admin initializers to guarantee .cert execution passes compiler passes
    const { getApps, initializeApp, cert } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");
    const { getStorage } = require("firebase-admin/storage");

    if (getApps().length === 0) {
      const keyPath = path.resolve(process.cwd(), "secrets/firebase-service-account.json");
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        initializeApp({
          credential: cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "jubilee-command-center---dev.appspot.com"
        });
        console.log("🚀 Firebase Admin successfully mounted via Service Account Key file.");
      } else {
        // Fallback placeholder if file is omitted in cold passes
        initializeApp({ projectId: "jubilee-command-center---dev" });
      }
    }

    const db = getFirestore();
    const bucket = getStorage().bucket();

    // 3. Retrieve the target row item context details from Firestore
    const productRef = db.collection("products").doc(assetId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json({ success: false, message: "Asset workspace not found." }, { status: 404 });
    }

    const productData = productDoc.data();
    const tracks = productData?.studioTracks || [];
    const targetTrack = tracks.find((t: any) => t.id === trackId);

    // 🚀 FIXED: Fallback to securedPlaybackUrl so legacy database items pass validation
    const activeAudioUrl = targetTrack?.url || targetTrack?.securedPlaybackUrl;

    if (!targetTrack || !activeAudioUrl) {
      return NextResponse.json({ 
        success: false, 
        message: "Target audio file reference is empty in the database master registry." 
      }, { status: 400 });
    }

    // 4. Download file bytes into memory buffer using the resolved URL
    console.log(`📡 Ingesting audio buffer for transcription from: ${targetTrack.fileName}`);
    const fileResponse = await fetch(activeAudioUrl);
    if (!fileResponse.ok) throw new Error("Failed to stream target track file from cloud cores.");
    const audioBuffer = await fileResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    // 5. Initialize the official Google Gen AI Client SDK
    const ai = new GoogleGenAI({ apiKey });

    console.log("⚡ Bootstrapping Gemini multimodal speech-to-text pipeline...");
    
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "audio/mp3", // Handles mp3, wav, ogg automatically
                data: base64Audio
              }
            },
            {
              text: `Analyze this audio file and return a strict JSON object formatting transcription alignments. 
              The response MUST be raw JSON matching this TypeScript schema definition exactly without Markdown wrappers:
              
              {
                "success": true,
                "transcriptText": "Full text string of audio",
                "wordTimeline": [
                  { "word": "string", "start": 0.0, "end": 0.5 }
                ]
              }
              
              Calculate 'start' and 'end' parameters as floating-point timestamps in seconds relative to the audio track timeline.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const rawJsonText = aiResponse.text;
    if (!rawJsonText) throw new Error("Gemini returned an empty transcription matrix template frame.");

    const parsedTranscriptionData = JSON.parse(rawJsonText.trim());

    // 6. Write the generated timeline JSON directly into your asset folders in Firebase Storage
    const transcriptFileName = `transcripts/${assetId}_${trackId}.json`;
    const transcriptFile = bucket.file(transcriptFileName);

    await transcriptFile.save(JSON.stringify(parsedTranscriptionData), {
      contentType: "application/json",
      metadata: { cacheControl: "public, max-age=31536000" }
    });

    // Make the transcript publicly accessible for bloom-player.js to fetch
    await transcriptFile.makePublic();
    const secureTranscriptUrl = `https://storage.googleapis.com/${bucket.name}/${transcriptFileName}`;

    return NextResponse.json({
      success: true,
      message: "Transcription successfully compiled and aligned.",
      transcriptUrl: secureTranscriptUrl,
      wordTimeline: parsedTranscriptionData.wordTimeline || []
    });

  } catch (error: any) {
    console.error("❌ Transcription Processing Pipeline Collapsed:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}