// app/api/webhook/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import path from "path";
import fs from "fs";
import { Resend } from "resend"; // 🔑 Import the Transactional Email Client

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Initialize Resend with an API key from your environment file
const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig) throw new Error("Missing stripe-signature header");
    
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Webhook Signature Verification Failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the successful transaction event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userEmail = session.customer_details?.email || session.metadata?.user_email;
    const assetKey = session.metadata?.assetKey; 
    const productType = session.metadata?.productType || "Audiobook";
    const originDomain = session.metadata?.originDomain || "koba-dev.local";
    const userPhone = session.customer_details?.phone || ""; 
    
    // Pull the book title dynamically from the line items to use in the email body
    const bookTitle = session.line_items?.[0]?.description || "Your Digital Publication";
    const totalAmount = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";

    if (!userEmail || !assetKey) {
      console.error("❌ Webhook missing critical user identification or asset keys.");
      return NextResponse.json({ received: true, error: "Missing identity metadata." });
    }

    try {
      // 🛠️ FIREBASE ADMIN SDK BOUNDING
      const firebaseAdmin = require("firebase-admin");
      const admin = firebaseAdmin.default || firebaseAdmin;

      if (!admin.apps || !admin.apps.length) {
        const keyPath = path.resolve(process.cwd(), "secrets/firebase-service-account.json");
        if (fs.existsSync(keyPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
          });
        } else {
          admin.initializeApp({ projectId: "jubilee-command-center---dev" });
        }
      }

      const db = admin.firestore();
      const entitlementsRef = db.collection("entitlements");
      
      const entitlementId = `ent_${Math.random().toString(36).substring(2, 11)}`;

      await entitlementsRef.doc(entitlementId).set({
        assetKey: assetKey,
        id: entitlementId,
        purchasedAt: new Date().toISOString(),
        status: "active",
        stripeConnectId: session.stripe_account || "",
        stripeSessionId: session.id, 
        type: productType,
        userEmail: userEmail.toLowerCase().trim(),
        userPhone: userPhone.trim(), 
        userId: ""
      });

      console.log(`🎉 Entitlement securely activated for ${userEmail} (${assetKey})`);

      // 📧 🚀 STEP B: AUTOMATED TRANSACTIONAL RECEIPT DISPATCH ENGINE
      try {
        await resend.emails.send({
          from: "Jubilee Works Studio <vault@koba-i.com>", // Swap with your verified custom domain address later
          to: userEmail.toLowerCase().trim(),
          subject: `🔒 Vault Access Granted: ${bookTitle}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; background: #0d1117; color: #c9d1d9; border-radius: 10px; border: 1px solid #30363d;">
              <h2 style="color: #f97316; margin-top: 0;">Order Confirmed!</h2>
              <p>Thank you for your purchase. Access to your sovereign digital publication has been securely whitelisted.</p>
              
              <div style="background: #161b22; border: 1px solid #30363d; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #fff; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em;">Asset Invoice Summary</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                  <tr>
                    <td style="padding: 6px 0; color: #8b949e;">Publication:</td>
                    <td style="padding: 6px 0; text-align: right; color: #fff; font-weight: 500;">${bookTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #8b949e;">Access Identifier:</td>
                    <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #f97316;">${assetKey}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #8b949e;">Amount Paid:</td>
                    <td style="padding: 6px 0; text-align: right; color: #fff; font-weight: bold;">$${totalAmount} USD</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 0.9rem; color: #8b949e; line-height: 1.5;">
                To listen right now, make sure you are logged into your author platform library, or open your custom link via the vault dashboard page.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="http://${originDomain}/bookshelf/" style="display: inline-block; background: #f97316; color: #000; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 6px;">
                  Open My Bookshelf
                </a>
              </div>
            </div>
          `
        });
        console.log(`📧 Receipt successfully broadcasted to ${userEmail}`);
      } catch (emailError: any) {
        console.error("⚠️ Fulfillment complete, but receipt dispatch failed:", emailError.message);
        // We do not return 500 here because the purchase itself succeeded in the database!
      }

    } catch (dbError: any) {
      console.error("❌ Failed to write active entitlement to Firestore:", dbError.message);
      return NextResponse.json({ error: "Database transaction failure." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}