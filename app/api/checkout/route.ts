// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20" as any, 
});

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetId, title, price, product_type, stripeConnectId, origin_domain, userEmail, userPhone } = body;

    if (!assetId || !title || !price) {
      return NextResponse.json({ success: false, error: "Missing checkout parameters." }, { status: 400 });
    }

    const numericPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ""));
    const amountInCents = Math.round(numericPrice * 100);

    // 🚀 FIXED: Full Backend Stripe Access Bypass for Free Books ($0.00)
    if (amountInCents === 0) {
      console.log(`🎁 Provisioning free backend entitlement access token block for: ${assetId}`);
      
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

      const adminDb = getFirestore();
      const fallbackEntId = `ent_free_${Math.random().toString(36).substring(2, 11)}`;
      
      const targetEmail = userEmail ? userEmail.toLowerCase().trim() : "dev-email@wpengine.local";
      const targetPhone = userPhone || "+12106878982"; 

      await adminDb.collection("entitlements").doc(fallbackEntId).set({
        id: fallbackEntId,
        assetKey: assetId,
        userEmail: targetEmail,
        userPhone: targetPhone,
        type: product_type || "Audiobook",
        status: "active",
        purchasedAt: new Date().toISOString(),
        expiresAt: null,
        stripeSessionId: "free_bypass_token"
      });

      return NextResponse.json({ success: true, isFreeUnlock: true, entitlementId: fallbackEntId }, {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const baseHost = origin_domain ? `http://${origin_domain}` : "http://koba-dev.local";
    const authorSlug = "kendall";

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      phone_number_collection: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title,
              description: `Sovereign ${product_type || "Digital"} Asset Provision Key`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseHost}/bookshelf/?asset=${assetId}&success=true&author=${authorSlug}`,
      cancel_url: `${baseHost}/bookshelf/`,
      metadata: {
        assetKey: assetId,
        productType: product_type || "Audiobook",
        originDomain: origin_domain || "koba-dev.local"
      }
    };

    if (stripeConnectId && stripeConnectId.trim().startsWith("acct_")) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: Math.round(amountInCents * 0.10), 
        transfer_data: { destination: stripeConnectId.trim() },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ success: true, url: session.url }, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });

  } catch (error: any) {
    console.error("❌ Stripe Gateway Initiation Failure:", error.message);
    return NextResponse.json({ success: false, error: error.message }, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}