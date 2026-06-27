// app/api/auth/sms-verify/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://koba-dev.local",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();

    if (!phoneNumber || !code) {
      return NextResponse.json({ success: false, error: "Phone number and verification PIN are required." }, { status: 400, headers: corsHeaders });
    }

    // Standardize phone format exactly like the send route
    let cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `+1${cleanPhone}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith("1")) {
      cleanPhone = `+${cleanPhone}`;
    } else if (phoneNumber.includes("+")) {
      cleanPhone = `+${cleanPhone}`;
    }

    const cleanCode = code.trim();

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: cleanPhone, code: cleanCode });

    if (check.status === "approved") {
      return NextResponse.json({ 
        success: true, 
        message: "Device authenticated successfully. Vault door unlocked." 
      }, { status: 200, headers: corsHeaders });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid or expired authorization code. Please try again." 
      }, { status: 400, headers: corsHeaders });
    }

  } catch (error: any) {
    console.error("❌ SMS Verification Safety Boundary Crash:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}