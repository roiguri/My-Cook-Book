/**
 * remove-compressed-field.js
 *
 * BACKFILL SCRIPT
 * This script removes the legacy 'compressed' field from all recipe images in Firestore.
 *
 * Usage in Cloud Shell:
 * 1. node remove-compressed-field.js
 */

const admin = require('firebase-admin');

// Initialize
admin.initializeApp();

const db = admin.firestore();

async function backfillRemoveCompressed() {
  console.log('--- Starting Backfill: Removing Legacy "compressed" Fields ---');

  const recipesSnapshot = await db.collection('recipes').get();
  console.log(`Scanning ${recipesSnapshot.size} recipes...`);

  let batch = db.batch();
  let count = 0;
  let totalUpdatedDocs = 0;
  let totalImagesCleaned = 0;

  for (const doc of recipesSnapshot.docs) {
    const recipe = doc.data();
    let hasChanges = false;

    // Helper to clean image arrays
    const cleanImages = (imgArray) => {
      if (!Array.isArray(imgArray)) return imgArray;
      return imgArray.map((img) => {
        if (img.compressed) {
          const { compressed, ...rest } = img;
          hasChanges = true;
          totalImagesCleaned++;
          return rest;
        }
        return img;
      });
    };

    const updatedImages = cleanImages(recipe.images);
    const updatedPendingImages = cleanImages(recipe.pendingImages);

    if (hasChanges) {
      const updateData = {};
      if (recipe.images !== undefined) updateData.images = updatedImages;
      if (recipe.pendingImages !== undefined) updateData.pendingImages = updatedPendingImages;

      batch.update(doc.ref, updateData);

      count++;
      totalUpdatedDocs++;

      // Commit batch every 500 documents
      if (count === 500) {
        console.log(`Committing batch of 500 updates...`);
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
  }

  // Commit remaining
  if (count > 0) {
    console.log(`Committing final batch of ${count} updates...`);
    await batch.commit();
  }

  console.log('\n--- Backfill Summary ---');
  console.log(`Total Recipes Scanned: ${recipesSnapshot.size}`);
  console.log(`Total Recipes Updated: ${totalUpdatedDocs}`);
  console.log(`Total Image Objects Cleaned: ${totalImagesCleaned}`);
  console.log('\nSUCCESS: Legacy "compressed" fields have been removed from Firestore.');
}

backfillRemoveCompressed().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
