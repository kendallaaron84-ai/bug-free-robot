// app/api/webhook/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import path from "path";
import fs from "fs";
import crypto from "crypto"; 

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const payload = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature") as string;

  if (!sig) return NextResponse.json({ error: "Missing signature boundary" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`❌ Webhook Signature Violation: ${err.message}`);
    return NextResponse.json({ error: "Security validation failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        (event.data.object as any).id,
        { expand: ["line_items"] }
      );

      const assetKey     = session.metadata?.assetKey;
      const userEmail    = session.customer_details?.email?.toLowerCase().trim() || session.metadata?.user_email;
      const productType  = session.metadata?.productType || "Audiobook";
      const userPhone    = session.customer_details?.phone || "";

      if (!assetKey || !userEmail) {
        console.error("❌ Webhook aborted: Critical identity metadata context missing.");
        return NextResponse.json({ received: true, error: "Missing identity metadata." });
      }

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

      const deterministicHash = crypto
        .createHash("md5")
        .update(`${assetKey}_${userEmail}`)
        .digest("hex");
      
      const entitlementId = `ent_${deterministicHash}`;

      // 🚀 DATA DISCIPLINE: Cross-Ecosystem User ID Generation
      // If Stripe didn't create a customer object, we generate a permanent KOBA-I Ecosystem ID based on their email.
      const ecosystemUserId = session.customer?.toString() || `usr_${crypto.createHash("md5").update(userEmail).digest("hex").substring(0, 16)}`;

      // 🚀 DATA DISCIPLINE: Robust StudioKey Extraction
      const productDoc = await db.collection("products").doc(assetKey).get();
      let assignedStudioKey = "";
      
      if (productDoc.exists) {
        const pData = productDoc.data() || {};
        // Checks all casing combinations to ensure it catches the string
        assignedStudioKey = pData.wpStudioKey || pData.WPStudioKey || pData.licenseKey || "PENDING_GENERATION";
      }

      const entitlementPayload = {
        id: entitlementId,
        assetKey: assetKey,
        userEmail: userEmail,
        userPhone: userPhone,
        userId: ecosystemUserId, // Now permanently populated
        stripeSessionId: session.id,
        stripeConnectId: session.stripe_account || "",
        status: "active",
        type: productType,
        purchasedAt: new Date().toISOString(),
        expiresAt: null,
        WPStudioKey: assignedStudioKey // Now perfectly mapped to your DB schema
      };

      await db.collection("entitlements").doc(entitlementId).set(entitlementPayload, { merge: true });
      console.log(`🎉 Automated Entitlement Verified & Set: ${entitlementId}`);

    } catch (processError: any) {
      console.error("❌ Critical runtime processing error:", processError.message);
      return NextResponse.json({ error: "Fulfillment processor execution stalled" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}