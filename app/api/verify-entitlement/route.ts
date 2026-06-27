// app/api/verify-entitlement/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, userPhone, phone, assetKey } = body;

    const activeEmail = userEmail ? userEmail.toLowerCase().trim() : null;
    const activePhone = phone || userPhone || null;

    if (!assetKey || (!activeEmail && !activePhone)) {
      return NextResponse.json({ 
        authenticated: false, 
        error: "Missing identification parameters. Provide email or phone context." 
      }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // 🔥 Dynamic runtime import with default export mapping
    const firebaseAdmin = require("firebase-admin");
    const admin = firebaseAdmin.default || firebaseAdmin;

    // 🔑 THE FIX: Deep safety check before ever touching .length
    if (!admin || !admin.apps || !admin.apps.length) {
      try {
        const keyPath = path.resolve(process.cwd(), "secrets/firebase-service-account.json");
        
        if (fs.existsSync(keyPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
          
          admin.initializeApp({
            credential: admin.credential ? admin.credential.cert(serviceAccount) : {
              getAccessToken: () => Promise.resolve({ access_token: "", expires_in: 0 }),
              cert: serviceAccount
            },
            projectId: serviceAccount.project_id,
            storageBucket: "jubilee-command-center---dev.appspot.com"
          });
          console.log("🚀 Firebase core bound successfully via direct object mapping!");
        } else {
          admin.initializeApp({
            projectId: "jubilee-command-center---dev"
          });
        }
      } catch (error: any) {
        console.warn("⚠️ Firebase Admin initialization logic fallback triggered.");
      }
    }

    // 🔑 THE FIX: Deep safety check for database assignment
    const db = admin && admin.apps && admin.apps.length ? admin.firestore() : null;
    if (!db) {
      return NextResponse.json({ authenticated: false, error: "Database engine offline." }, { status: 503 });
    }

    // 🚀 FIXED: Dynamic Query Selector for Email vs. Phone SMS sessions
    const entitlementsRef = db.collection("entitlements");
    let queryRef = entitlementsRef.where("assetKey", "==", assetKey).where("status", "==", "active");

    if (activeEmail) {
      queryRef = queryRef.where("userEmail", "==", activeEmail);
    } else if (activePhone) {
      const cleanPhone = activePhone.replace(/[^0-9+]/g, "");
      const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : `+1${cleanPhone}`;
      queryRef = queryRef.where("userPhone", "==", formattedPhone);
    }

    const snapshot = await queryRef.get();
    if (snapshot.empty) {
      return NextResponse.json({ authenticated: false, owned: false, message: "No entitlement match found." });
    }

    const entitlementData = snapshot.docs[0].data();

    // 🚀 NEW: Pull matching data structures out of your products document
    let productTracksFallback = [
      { id: "ch1", title: "Chapter 1", duration: "0:00" }
    ];
    let bookTitleFallback = "Sovereign Publication Track";

    try {
      const productDoc = await db.collection("products").doc(assetKey).get();
      if (productDoc.exists) {
        const pData = productDoc.data();
        if (pData.studioTracks && pData.studioTracks.length > 0) {
          productTracksFallback = pData.studioTracks;
        }
        if (pData.title) {
          bookTitleFallback = pData.title;
        }
      }
    } catch (err) {
      console.warn("⚠️ Failed to look up product metadata context maps.");
    }

    // Cryptographic Signed URL Generation
    const bucket = admin.storage().bucket("jubilee-command-center---dev.appspot.com");
    const secureFile = bucket.file(`vault/audiobooks/${assetKey}.mp3`);

    let streamUrl = null;
    try {
      const [generatedUrl] = await secureFile.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 2 * 60 * 60 * 1000, 
      });
      streamUrl = generatedUrl;
    } catch (signatureError) {
      console.error("Failed to generate cryptographic key:", signatureError);
    }

    // 🚀 FIXED: Return the complete metadata structure the client context layout expects
    return NextResponse.json({
      authenticated: true,
      owned: true,
      unlockedAt: entitlementData.purchasedAt || new Date().toISOString(),
      invoiceUrl: entitlementData.stripeSessionId || "free_bypass_token",
      assetType: entitlementData.type || "Audiobook",
      streamUrl: streamUrl,
      title: bookTitleFallback,
      tracks: productTracksFallback, // Passes the chapter markers down to drop loading frames
      message: "Access Authorization Granted. Cryptographic key generated.",
    }, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });

  } catch (error: any) {
    console.error("❌ Entitlement verification crash sequence:", error);
    return NextResponse.json({ authenticated: false, error: "Internal server verification breakdown." }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}