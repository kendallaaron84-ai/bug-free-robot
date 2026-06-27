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
    
    // Defensive parameter fallbacks to ensure unmapped fields never trip a 400 block
    const authorEmail = body.authorEmail || "kendallaaron84@gmail.com";
    const bookTitle = body.bookTitle || body.title || "Untitled Sovereign Publication Asset";
    
    let price = "0.00";
    if (body.price !== undefined && body.price !== null && body.price !== "") {
      price = body.price.toString();
    }

    const type = body.type || "Audiobook";
    const authorName = body.authorName || "Kendall Aaron";
    const synopsis = body.synopsis || "";
    const sections = body.sections || ["Featured Publications"];
    const coverUrl = body.coverUrl || body.coverArtUrl || "";
    const bgImageUrl = body.bgImageUrl || "";
    const ebookPayload = body.ebookPayload || null;

    if (!authorEmail || !bookTitle) {
      return NextResponse.json({ success: false, error: "Missing core deployment identifiers." }, { status: 400 });
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

    let targetWpDomain = "koba-dev.local"; 
    const wpPublishUrl = `http://${targetWpDomain}/wp-json/kobai/v1/publish-vault`;
    const emailForWordPress = "dev-email@wpengine.local";

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
        price: price.toString() === "0.00" ? "0" : price.toString()
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