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
      return NextResponse.json({ authenticated: false, error: "Missing identity parameters." }, { status: 400 });
    }

    const firebaseAdmin = require("firebase-admin");
    const admin = firebaseAdmin.default || firebaseAdmin;

    if (!admin.apps.length) {
      const keyPath = path.resolve(process.cwd(), "secrets/firebase-service-account.json");
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
          storageBucket: "jubilee-command-center---dev.appspot.com"
        });
      }
    }

    const db = admin.firestore();
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
      return NextResponse.json({ authenticated: false, owned: false, message: "No entitlement validated." }, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const entitlementData = snapshot.docs[0].data();
    let productTracksFallback = [{ id: "ch1", title: "Chapter 1", duration: "0:00" }];
    let bookTitleFallback = "Sovereign Publication Track";

    try {
      const productDoc = await db.collection("products").doc(assetKey).get();
      if (productDoc.exists) {
        const pData = productDoc.data();
        if (pData.studioTracks && pData.studioTracks.length > 0) productTracksFallback = pData.studioTracks;
        if (pData.title) bookTitleFallback = pData.title;
      }
    } catch (err) {}

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
    } catch (err) {}

    return NextResponse.json({
      authenticated: true,
      owned: true,
      unlockedAt: entitlementData.purchasedAt || new Date().toISOString(),
      invoiceUrl: entitlementData.stripeSessionId || "free_bypass_token",
      assetType: entitlementData.type || "Audiobook",
      streamUrl: streamUrl,
      title: bookTitleFallback,
      tracks: productTracksFallback,
    }, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
    });

  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}