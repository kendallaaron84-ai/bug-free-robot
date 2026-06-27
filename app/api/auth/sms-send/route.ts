// app/api/auth/sms-send/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
import { initializeApp, getApps, cert } from "firebase-admin/app"; // 🚀 Target sub-paths directly
import { getFirestore } from "firebase-admin/firestore";          // 🚀 Target Firestore directly

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://koba-dev.local",
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

    // app/api/auth/sms-send/route.ts

    // Strip out everything except numbers
    let cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, "");

    // If it's a standard 10-digit US number, prepend +1
    if (cleanPhone.length === 10) {
      cleanPhone = `+1${cleanPhone}`;
    } 
    // If they typed the 1 but forgot the plus sign (11 digits), prepend +
    else if (cleanPhone.length === 11 && cleanPhone.startsWith("1")) {
      cleanPhone = `+${cleanPhone}`;
    } 
    // Fallback case if they actually typed the plus sign originally
    else if (phoneNumber.includes("+")) {
      cleanPhone = `+${cleanPhone}`;
    }

    // 🛠️ FAIL-SAFE MODULAR INITIALIZATION
    if (getApps().length === 0) {
      initializeApp({
        projectId: "jubilee-command-center---dev"
      });
    }

    // Explicitly grab the DB connection using the standalone function
    const db = getFirestore();
    const entitlementsRef = db.collection("entitlements");
    
    let queryRef = entitlementsRef
      .where("userPhone", "==", cleanPhone)
      .where("status", "==", "active");

    if (assetKey) {
      queryRef = queryRef.where("assetKey", "==", assetKey.trim());
    }

    const snapshot = await queryRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ 
        success: false, 
        error: `No active entitlement found for phone ${cleanPhone} matching asset key.` 
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