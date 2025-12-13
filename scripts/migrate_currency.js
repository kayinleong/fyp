/*
  Script: migrate_currency.js
  Purpose: Update Jobs collection documents where currency variants like "RM"/"rm" are present and normalize them to "MYR".

  Usage:
    - Ensure you have Node.js installed.
    - Set environment variables used by your app for Firebase service account (same as used in src/lib/firebase/server.ts):
      NEXT_PRIVATE_SA_PROJECT_ID, NEXT_PRIVATE_CLIENT_EMAIL, NEXT_PRIVATE_SA_PRIVATE_KEY
    - From the repository root run:
        node scripts/migrate_currency.js

  WARNING: This script will modify Firestore documents. Run in a dev environment first and/or back up your data.
*/

const admin = require('firebase-admin');

function getEnvOrThrow(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return v;
}

// Initialize admin using same env vars as the app
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: getEnvOrThrow('NEXT_PRIVATE_SA_PROJECT_ID'),
      clientEmail: getEnvOrThrow('NEXT_PRIVATE_CLIENT_EMAIL'),
      privateKey: getEnvOrThrow('NEXT_PRIVATE_SA_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
  });
} catch (err) {
  console.error('Firebase initialize error (continuing if already initialized):', err?.message || err);
}

const db = admin.firestore();

function normalizeCurrency(input) {
  if (!input) return undefined;
  const raw = String(input).trim();
  if (raw === '') return undefined;
  const upper = raw.toUpperCase();
  const map = {
    RM: 'MYR',
    MYR: 'MYR',
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    SGD: 'SGD',
    AUD: 'AUD',
    CAD: 'CAD',
    CNY: 'CNY',
    JPY: 'JPY',
    INR: 'INR',
  };
  const cleaned = upper.replace(/[^A-Z0-9]/g, '');
  if (map[cleaned]) return map[cleaned];
  if (/^[A-Z]{3}$/.test(cleaned)) return cleaned;
  return undefined;
}

(async function main() {
  console.log('Starting currency migration for Jobs collection...');
  try {
    const jobsRef = db.collection('Jobs');
    const snapshot = await jobsRef.get();
    console.log(`Found ${snapshot.size} job documents`);
    let updates = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const cur = data.currency;
      const normalized = normalizeCurrency(cur);
      if (normalized === 'MYR' && cur !== 'MYR') {
        // update
        await doc.ref.update({ currency: 'MYR' });
        console.log(`Updated ${doc.id}: currency ${JSON.stringify(cur)} -> 'MYR'`);
        updates++;
      } else {
        skipped++;
      }
    }

    console.log(`Migration complete. Updated: ${updates}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
