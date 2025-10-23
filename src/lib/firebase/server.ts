/* eslint-disable @typescript-eslint/no-explicit-any */
import admin from "firebase-admin";


try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PRIVATE_SA_PROJECT_ID,
      clientEmail: process.env.NEXT_PRIVATE_CLIENT_EMAIL,
      privateKey: process.env.NEXT_PRIVATE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    })
  });
} catch (error: any) {
  /*
   * We skip the "already exists" message which is
   * not an actual error when we're hot-reloading.
   */
  if (!/already exists/u.test(error.message)) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

export default admin;
