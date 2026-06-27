import * as admin from "firebase-admin";

// Ensure the server-side environment variables match your content-engine-prod project
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "content-engine-prod";

if (!admin.apps.length) {
  try {
    // If running inside Google Cloud / Cloud Run (production), it authenticates automatically
    if (process.env.NODE_ENV === "production") {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId,
      });
      console.log("🚀 Firebase Admin SDK initialized seamlessly via Application Default Credentials.");
    } else {
      // Local development fallback framework
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped line breaks if your private key string contains them
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
      console.log("🛠️ Firebase Admin SDK initialized locally via development environment keys.");
    }
  } catch (error) {
    console.error("❌ Firebase Admin SDK critical initialization failure:", error);
  }
}

const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

export { admin, auth, db, storage };