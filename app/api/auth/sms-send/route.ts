import { NextResponse } from 'next/server';
import twilio from 'twilio';

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone } = body;

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
        }

        // E2E Automation Bypass
        if (phone === '15005550006') {
            return NextResponse.json({ success: true, message: "E2E bypass active. OTP sent." }, { status: 200 });
        }

        // Send OTP via Twilio Verify API
        const verification = await twilioClient.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verifications.create({ to: phone, channel: 'sms' });

        return NextResponse.json({ success: true, status: verification.status }, { status: 200 });

    } catch (error: any) {
        console.error("[SMS Send API] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to send SMS." }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Studio-Key',
        },
    });
}