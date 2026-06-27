// app/api/agent/deploy/route.ts
import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore"; 
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      authorEmail, 
      authorName, 
      bookTitle, 
      price, 
      type, 
      synopsis, 
      sections, 
      coverUrl, 
      bgImageUrl,
      ebookPayload 
    } = body;

    if (!authorEmail || !bookTitle || (price === undefined || price === null || price === "")) {
      return NextResponse.json({ success: false, error: "Missing required deployment fields." }, { status: 400 });
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

    const adminDb = getFirestore();
    const authorSlug = "kendall"; 
    const cleanBookSlug = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, '');
    const assetKey = `abk_${authorSlug}_${cleanBookSlug}`;

    let finalEbookPayload = null;
    if (type === "E-Book") {
      finalEbookPayload = ebookPayload || {
        fontPreference: "Atkinson Hyperlegible",
        chapters: [
          {
            id: `${assetKey}_ebk_ch1`,
            title: "Chapter 1: Rain-Slicked Subnets",
            textContent: "The corporate neon reflected heavily in the pooling oil along the lower balcony floors..."
          }
        ]
      };
    }

    const writePayload: any = {
      id: assetKey,
      assetKey: assetKey,
      authorSlug: authorSlug,
      authorEmail: authorEmail,
      title: bookTitle,
      price: price.toString(),
      type: type, 
      synopsis: synopsis || "",
      status: "Active",
      sections: sections || ["Featured Publications"],
      coverArtUrl: coverUrl || "",
      bgImageUrl: bgImageUrl || "",
      createdAt: new Date().toISOString()
    };

    if (finalEbookPayload) {
      writePayload.ebookPayload = finalEbookPayload;
    }

    const productRef = adminDb.collection("products").doc(assetKey);
    await productRef.set(writePayload, { merge: true });

    if (price.toString() === "0.00" || price.toString() === "0") {
      const entitlementsRef = adminDb.collection("entitlements");
      const entitlementQuery = await entitlementsRef.where("assetKey", "==", assetKey).get();

      if (!entitlementQuery.empty) {
        for (const doc of entitlementQuery.docs) {
          await doc.ref.update({ type: type });
        }
      } else {
        const fallbackEntId = `ent_free_${Math.random().toString(36).substring(2, 11)}`;
        await entitlementsRef.doc(fallbackEntId).set({
          id: fallbackEntId,
          assetKey: assetKey,
          userEmail: "dev-email@wpengine.local", 
          type: type, 
          status: "active",
          purchasedAt: new Date().toISOString(),
          expiresAt: null,
          stripeSessionId: "free_bypass_token"
        });
      }
    }

    let targetWpDomain = "koba-dev.local"; 
    if (authorEmail.includes("sharon")) targetWpDomain = "audio.sharon-meeks.com";
    
    const wpPublishUrl = `http://${targetWpDomain}/wp-json/kobai/v1/publish-vault`;
    const emailForWordPress = targetWpDomain === "koba-dev.local" ? "dev-email@wpengine.local" : authorEmail;

    const wpResponse = await fetch(wpPublishUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-KOBA-KEY": "JUBI-TEST-1234-5678" 
      },
      body: JSON.stringify({
        authorEmail: emailForWordPress,
        authorSlug: authorSlug,
        bookTitle: bookTitle,
        bookSlug: cleanBookSlug.replace(/_/g, '-'),
        assetKey: assetKey,
        coverArt: coverUrl || "",
        bgImage: bgImageUrl || "",
        type: type, 
        price: price.toString()
      })
    });

    const wpResult = await wpResponse.json();

    return NextResponse.json({
      success: true,
      assetKey: assetKey,
      authorSlug: authorSlug,
      wpDeployment: wpResult
    }, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" }
    });

  } catch (error: any) {
    console.error("❌ Agent Autonomous Deployment Fault:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}