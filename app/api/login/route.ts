// app/api/login/route.ts
import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "No identity token provided." }, { status: 400 });
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

    const firebaseAuth = getAuth();
    // 1. Verify the incoming short-lived client ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    
    // 2. Create the secure Session Cookie (Valid for 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; 
    const sessionCookie = await firebaseAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ 
      success: true, 
      uid: decodedToken.uid,
      email: decodedToken.email 
    }, { status: 200 });

    // 3. Attach the cookie to the browser! (This stops the redirect loop)
    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;

  } catch (error: any) {
    console.error("❌ Token Verification Crash:", error.message);
    return NextResponse.json({ error: "Server rejected identity exchange token verification." }, { status: 401 });
  }
}