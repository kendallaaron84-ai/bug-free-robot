// app/api/products/public/route.ts
import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorSlug = searchParams.get("author") || "kendall";
    const readerEmail = searchParams.get("email")?.toLowerCase().trim() || null;
    const readerPhone = searchParams.get("phone") || null;

    if (getApps().length === 0) {
      const keyPath = path.resolve(process.cwd(), "secrets/firebase-service-account.json");
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
      } else {
        initializeApp({ projectId: "jubilee-command-center---dev" });
      }
    }

    const adminDb = getFirestore();

    // 🚀 FIX 1: ENFORCE STATUS CHECK - Grabs ONLY active products, completely hiding Drafts!
    const productsSnapshot = await adminDb.collection("products")
      .where("authorSlug", "==", authorSlug)
      .where("status", "==", "Active")
      .get();

    const productsList = productsSnapshot.docs.map(doc => doc.data());

    // 🚀 FIX 2: DYNAMIC DUAL-CHANNEL ENTITLEMENT QUERY
    const entitlementsList: string[] = [];
    const entitlementsRef = adminDb.collection("entitlements");

    if (readerEmail) {
      const emailSnapshot = await entitlementsRef
        .where("userEmail", "==", readerEmail)
        .where("status", "==", "Active")
        .get();
      emailSnapshot.forEach(doc => entitlementsList.push(doc.data().assetKey));
    }

    if (readerPhone) {
      const cleanPhone = readerPhone.replace(/[^0-9+]/g, "");
      const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : `+1${cleanPhone}`;
      
      const phoneSnapshot = await entitlementsRef
        .where("userPhone", "==", formattedPhone)
        .where("status", "==", "Active")
        .get();
      phoneSnapshot.forEach(doc => entitlementsList.push(doc.data().assetKey));
    }

    return NextResponse.json({
      success: true,
      products: productsList,
      entitlements: [...new Set(entitlementsList)] // Removes any duplicate tracking references cleanly
    }, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}