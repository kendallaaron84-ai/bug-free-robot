import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/core/firebase-admin';
import twilio from 'twilio';

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, code, assetId, studioKey } = body;

        if (!phone || !code || !assetId || !studioKey) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // 1. Domain Locking: Verify Origin/Referer matches Firestore associatedWebsite
        const origin = req.headers.get('origin') || req.headers.get('referer') || '';
        
        // Lookup license/studio key to get associatedWebsite
        const licenseQuery = await adminDb.collection('licenses')
            .where('key', '==', studioKey)
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (licenseQuery.empty) {
            return NextResponse.json({ error: "Invalid Studio Key." }, { status: 403 });
        }

        const licenseData = licenseQuery.docs[0].data();
        const associatedWebsite = licenseData.associatedWebsite;

        if (associatedWebsite && origin) {
            try {
                const originUrl = new URL(origin);
                const allowedUrl = new URL(associatedWebsite);
                if (originUrl.hostname !== allowedUrl.hostname) {
                    console.error(`Domain lock failure. Expected ${allowedUrl.hostname}, got ${originUrl.hostname}`);
                    return NextResponse.json({ error: "Domain unauthorized." }, { status: 403 });
                }
            } catch (e) {
                // If parsing fails, fall back to simple string inclusion
                if (!origin.includes(associatedWebsite)) {
                     console.error(`Domain lock strict failure. Origin: ${origin}, Allowed: ${associatedWebsite}`);
                     return NextResponse.json({ error: "Domain unauthorized." }, { status: 403 });
                }
            }
        }

        // 2. OTP Verification
        let isVerified = false;

        // E2E Automation Bypass
        if (phone === '15005550006' && code === '123456') {
            isVerified = true;
            console.log("[SMS Verify API] E2E bypass successful.");
        } else {
            const verificationCheck = await twilioClient.verify.v2
                .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
                .verificationChecks.create({ to: phone, code: code });

            if (verificationCheck.status === 'approved') {
                isVerified = true;
            }
        }

        if (!isVerified) {
            return NextResponse.json({ error: "Invalid verification code." }, { status: 401 });
        }

        // 3. Query GCS and return 10-hour V4 Signed URL
        const bucket = adminStorage.bucket('koba-i-jubilee-vault');
        
        // Fetch the product to get the file path
        const productRef = await adminDb.collection('products').doc(assetId).get();
        if (!productRef.exists) {
            return NextResponse.json({ error: "Asset not found." }, { status: 404 });
        }
        
        const productData = productRef.data();
        // Assuming your product doc stores the raw file path in GCS under 'storagePath' or similar
        const storagePath = productData?.storagePath || `assets/${assetId}/master.mp3`; 
        
        const file = bucket.file(storagePath);
        
        const [exists] = await file.exists();
        if (!exists) {
            return NextResponse.json({ error: "Media file not found in vault." }, { status: 404 });
        }

        // Generate V4 Signed URL valid for 10 hours
        const [signedUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 10 * 60 * 60 * 1000, // 10 hours
        });

        return NextResponse.json({ 
            success: true, 
            signedUrl,
            asset: productData
        }, { status: 200 });

    } catch (error: any) {
        console.error("[SMS Verify API] Error:", error);
        return NextResponse.json({ error: error.message || "Verification failed." }, { status: 500 });
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