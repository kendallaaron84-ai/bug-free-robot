// app/api/auth/sms-send/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

const corsHeaders = {
  // Fixed to match local WordPress protocol
  "Access-Control-Allow-Origin": "http://koba-dev.local", 
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function POST(request: Request) {
  try {
    const { phoneNumber, assetKey } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Phone number required." }, { status: 400, headers: corsHeaders });
    }

    // 🚀 INTERNATIONAL E.164 PHONE SANITIZATION
    let cleanPhone = phoneNumber.trim();
    
    if (cleanPhone.startsWith("+")) {
      // If user provided the +, respect their country code entirely
      cleanPhone = "+" + cleanPhone.replace(/[^0-9]/g, "");
    } else {
      // Strip everything to check length
      const rawDigits = cleanPhone.replace(/[^0-9]/g, "");
      if (rawDigits.length === 10) {
        cleanPhone = "+1" + rawDigits; // Standardize US/CA implicitly
      } else {
        cleanPhone = "+" + rawDigits;  // Blindly prepend + for international users who forgot it
      }
    }

    // 🛠️ FIREBASE ADMIN CREDENTIAL MOUNT (FIXED)
    if (getApps().length === 0) {
      const keyPath = path.resolve(process.cwd(), "secrets/firebase-service-account.json");
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      } else {
        initializeApp({ projectId: "jubilee-command-center---dev" });
      }
    }

    const db = getFirestore();
    const entitlementsRef = db.collection("entitlements");
    
    let queryRef = entitlementsRef
      .where("userPhone", "==", cleanPhone)
      .where("status", "==", "active");

    if (assetKey) {
      queryRef = queryRef.where("assetKey", "==", assetKey.trim());
    }

    // 🔎 DIAGNOSTIC INSPECTOR: Dumping the collection state to logs
    console.log("🚀 Running Diagnostic Entitlement Fetch...");
    const snapshot = await entitlementsRef
      .where("userPhone", "==", cleanPhone)
      .where("status", "==", "active")
      .get();
    
    if (snapshot.empty) {
      console.error(`❌ Access Denied: User [+${cleanPhone}] has no ecosystem entitlements.`);
      return NextResponse.json({ 
        success: false, 
        error: "No active purchases found for this phone number." 
      }, { status: 404, headers: corsHeaders });
    }

    // Attempt the specific match only after logging
    const targetPhone = cleanPhone.replace(/\D/g, '');
    const foundRecord = snapshot.docs.find(doc => {
        const d = doc.data();
        const storedPhone = (d.userPhone || '').replace(/\D/g, '');
        const storedAsset = (d.assetKey || '').trim();
        const match = (storedPhone === targetPhone) && (storedAsset === assetKey.trim());
        return match;
    });

    if (!foundRecord) {
      console.error(`❌ Access Denied: No record found for [${cleanPhone}] among ${snapshot.size} candidates.`);
      return NextResponse.json({ 
        success: false, 
        error: `No active entitlement found for phone ${cleanPhone}.` 
      }, { status: 404, headers: corsHeaders });
    }

    // 📞 Twilio Verification Dispatch Engine
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        to: cleanPhone,
        channel: "sms"
      });

    return NextResponse.json({ 
      success: true, 
      status: verification.status,
      message: "WebOTP handshake dispatched safely to carrier networks." 
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("❌ SMS Dispatch Security Exception:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}