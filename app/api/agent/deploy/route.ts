// app/api/agent/deploy/route.ts
import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore"; 
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Safe clone to print parameters payload to the console tracking log
  const rawBody = await request.clone().json();
  console.log("📥 AGENT HIT! Raw parameters payload dropped:", rawBody);

  try {
    const body = await request.json();
    
    // Core payload properties with defensive fallbacks
    const authorEmail = body.authorEmail || "kendallaaron84@gmail.com";
    const bookTitle = body.bookTitle || body.title || "Untitled Sovereign Publication Asset";
    const statusState = body.status || "Active"; 
    
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

    // Initialize Firebase Admin cleanly
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

    // Compile everything we've built for the Firestore write payload
    const writePayload: any = {
      id: assetKey,
      assetKey: assetKey,
      authorSlug: authorSlug,
      authorEmail: authorEmail,
      title: bookTitle,
      price: price.toString(),
      type: type, 
      synopsis: synopsis || "",
      status: statusState, 
      sections: sections || ["Featured Publications"],
      coverArtUrl: coverUrl || "",
      bgImageUrl: bgImageUrl || "",
      createdAt: new Date().toISOString()
    };

    if (type === "E-Book") {
      writePayload.ebookPayload = ebookPayload || {
        fontPreference: "Atkinson Hyperlegible",
        chapters: [{ id: `${assetKey}_ch1`, title: "Chapter 1", textContent: "Staged canvas template text." }]
      };
    }

    // Write clean data row straight to Firestore
    const productRef = adminDb.collection("products").doc(assetKey);
    await productRef.set(writePayload, { merge: true });

    // Pack the outbound payload cleanly inside an isolated local data block to prevent any compilation token errors
    const syncPayload = {
      authorEmail: "dev-email@wpengine.local",
      author_email: "dev-email@wpengine.local",
      authorSlug: authorSlug,
      author_slug: authorSlug,
      bookTitle: bookTitle,
      title: bookTitle,
      book_title: bookTitle,
      bookSlug: cleanBookSlug.replace(/_/g, '-'),
      slug: cleanBookSlug.replace(/_/g, '-'),
      book_slug: cleanBookSlug.replace(/_/g, '-'),
      assetKey: assetKey,
      asset_key: assetKey,
      koba_asset_key: assetKey,
      coverArt: coverUrl || "",
      cover_url: coverUrl || "",
      bgImage: bgImageUrl || "",
      bg_image: bgImageUrl || "",
      type: type, 
      price: price.toString(),
      _price: price.toString(),
      _koba_price: price.toString()
    };

    let targetWpDomain = "koba-dev.local"; 
    const wpPublishUrl = `http://${targetWpDomain}/wp-json/kobai/v1/update-chapter-audio`;

    // Fire network handshake to WordPress
    const wpResponse = await fetch(wpPublishUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-KOBA-KEY": "JUBI-TEST-1234-5678" 
      },
      body: JSON.stringify(syncPayload)
    });

    let wpResult = { success: false, message: "No initial bridge tracking captured." };
    const contentType = wpResponse.headers.get("content-type");

    if (wpResponse.ok && contentType && contentType.includes("application/json")) {
      wpResult = await wpResponse.json();
    } else {
      const errorText = await wpResponse.text();
      console.warn("⚠️ WordPress Handshake Stalled:", errorText);
      return NextResponse.json({
        success: false,
        error: "WordPress destination server dropped an invalid format.",
        details: errorText.substring(0, 200)
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      assetKey: assetKey,
      authorSlug: authorSlug,
      wpDeployment: wpResult
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Agent Autonomous Deployment Fault:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}