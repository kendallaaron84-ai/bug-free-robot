// app/api/products/public/route.ts
import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore"; // 🔑 Use Admin Firestore to bypass public security gates
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorSlug = searchParams.get("author") || "global";
    const readerEmail = searchParams.get("email") ? searchParams.get("email")!.trim().toLowerCase() : "";

    // 1. PRIVILEGED FIREBASE ADMIN INITIALIZATION
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

    // 2. Fetch Active Products for the designated Author via Superuser
    const productsCollection = adminDb.collection("products");
    let snapshot;

    if (authorSlug === "global") {
      snapshot = await productsCollection.where("status", "==", "Active").get();
    } else {
      snapshot = await productsCollection
        .where("authorSlug", "==", authorSlug)
        .where("status", "==", "Active")
        .get();
    }

    const productsList: any[] = [];
    snapshot.forEach((doc) => {
      productsList.push({ id: doc.id, ...doc.data() });
    });

    // 3. Fetch Reader Entitlements dynamically if an email exists
    const entitlementsList: string[] = [];
    if (readerEmail) {
      const entSnapshot = await adminDb.collection("entitlements")
        .where("userEmail", "==", readerEmail)
        .where("status", "==", "Active")
        .get();

      entSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.assetKey) {
          entitlementsList.push(data.assetKey);
        }
      });
    }

    // 4. Return unified payload with permissive CORS headers for local testing
    return NextResponse.json({
      success: true,
      products: productsList,
      entitlements: entitlementsList
    }, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });

  } catch (error: any) {
    console.error("❌ Public Products Retrieval Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}