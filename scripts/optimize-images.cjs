/**
 * Image Optimization Trigger Script
 * --------------------------------
 * This script iterates through all recipe images in Firebase Storage and
 * updates their metadata. This "touches" the files, which triggers the
 * "Resize Images" Firebase Extension to generate optimized WebP versions.
 *
 * Prerequisites:
 * 1. Service Account Key: Download from Firebase Console -> Project Settings -> Service Accounts.
 * 2. Environment Variable: Set GOOGLE_APPLICATION_CREDENTIALS to the path of your key file.
 *    Or place the service-account.json in the project root (it is gitignored).
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/**
 * Simple helper to load .env files manually since Node doesn't do it automatically
 * and we want to avoid requiring extra dependencies if possible.
 */
function loadEnv(envPath) {
  const fullPath = path.join(__dirname, '..', envPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
    console.log(`Loaded environment from ${envPath}`);
  }
}

// Load common env files
loadEnv('.env.local');

// Allow bucket name from command line argument: node optimize-images.cjs my-bucket.appspot.com
const manualBucket = process.argv[2];
const storageBucket =
  manualBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET;

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
  const config = {
    storageBucket: storageBucket,
  };

  if (fs.existsSync(serviceAccountPath)) {
    config.credential = admin.credential.cert(require(serviceAccountPath));
    console.log('Using service-account.json for authentication.');
  }

  if (!config.storageBucket) {
    console.error('Error: Bucket name not found in environment variables.');
    console.log('Please either:');
    console.log('1. Pass it as an argument: node scripts/optimize-images.cjs <your-bucket-name>');
    console.log('2. Ensure VITE_FIREBASE_STORAGE_BUCKET is set in your .env files');
    process.exit(1);
  }

  admin.initializeApp(config);
} catch (e) {
  console.error('Initialization error:', e.message);
  process.exit(1);
}

const bucket = admin.storage().bucket();

async function triggerResize() {
  console.log('--- Starting Image Optimization Trigger ---');

  try {
    // Only target the 'full' directory where original images are stored
    const [files] = await bucket.getFiles({ prefix: 'img/recipes/full/' });

    console.log(`Found ${files.length} files to process.`);

    let processed = 0;
    for (const file of files) {
      // Ignore existing optimized/resized files if they were somehow picked up
      if (file.name.includes('_400x400') || file.name.includes('_1080x1080')) {
        continue;
      }

      // Updating metadata triggers the Storage 'object.finalize' event
      // which the Resize Images extension listens to.
      await file.setMetadata({
        metadata: {
          optimizedAt: Date.now().toString(),
        },
      });

      processed++;
      console.log(`[${processed}/${files.length}] Triggered resize for: ${file.name}`);
    }

    console.log('--- Success: All images have been queued for optimization ---');
    console.log('Note: The actual resizing happens asynchronously in Cloud Functions.');
    process.exit(0);
  } catch (error) {
    console.error('Error triggering optimization:', error);
    process.exit(1);
  }
}

triggerResize();
