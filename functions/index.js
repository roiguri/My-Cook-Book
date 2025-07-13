const { onMessagePublished } = require('firebase-functions/v2/pubsub');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const sharp = require('sharp');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const storage = getStorage();

async function processRecipeImages(recipeId, images, category, originalUserId) {
  const processedImages = [];
  
  console.log(`Processing ${images.length} images for recipe ${recipeId}`);
  
  for (const [index, imageData] of images.entries()) {
    try {
      console.log(`Processing image ${index + 1}/${images.length}: ${imageData.filename}`);
      
      // Download image from signed URL
      const response = await fetch(imageData.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      
      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);
      
      console.log(`Downloaded image: ${imageData.filename}, size: ${buffer.length} bytes`);
      
      // Generate unique filename and ID
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const imageId = `img-${timestamp}-${randomId}`;
      const fileName = imageData.filename || `image-${index + 1}.jpg`;
      
      // Upload full-size image
      const fullPath = `img/recipes/full/${category}/${recipeId}/${fileName}`;
      const bucket = storage.bucket();
      const fullFile = bucket.file(fullPath);
      
      await fullFile.save(buffer, {
        metadata: {
          contentType: imageData.contentType || 'image/jpeg',
          metadata: {
            originalSource: 'recipe-reader-transfer',
            transferredAt: new Date().toISOString()
          }
        }
      });
      
      console.log(`Uploaded full image to: ${fullPath}`);
      
      // Create compressed version
      let compressedBuffer;
      try {
        compressedBuffer = await sharp(buffer)
          .resize(800, 600, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch (compressionError) {
        console.warn(`Compression failed for ${fileName}, using original:`, compressionError.message);
        compressedBuffer = buffer;
      }
      
      // Upload compressed image
      const compressedPath = `img/recipes/compressed/${category}/${recipeId}/${fileName}`;
      const compressedFile = bucket.file(compressedPath);
      
      await compressedFile.save(compressedBuffer, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            originalSource: 'recipe-reader-transfer',
            transferredAt: new Date().toISOString(),
            compressed: true
          }
        }
      });
      
      console.log(`Uploaded compressed image to: ${compressedPath}`);
      
      // Create Firestore image object
      const firestoreImage = {
        access: 'public',
        compressed: compressedPath,
        fileName: fileName,
        full: fullPath,
        id: imageId,
        isPrimary: index === 0, // First image is primary
        uploadTimestamp: new Date(),
        uploadedBy: originalUserId
      };
      
      processedImages.push(firestoreImage);
      
      console.log(`Successfully processed image ${index + 1}: ${fileName}`);
      
    } catch (error) {
      console.error(`Failed to process image ${index + 1} (${imageData.filename}):`, error.message);
      // Continue with other images - don't fail the entire transfer
    }
  }
  
  console.log(`Successfully processed ${processedImages.length}/${images.length} images`);
  return processedImages;
}

// Cookbook schema validation
function validateCookbookRecipe(recipeData) {
  const errors = [];
  
  // Required string fields
  if (!recipeData.name || typeof recipeData.name !== 'string') {
    errors.push('Missing or invalid name');
  }
  
  if (!recipeData.category || typeof recipeData.category !== 'string') {
    errors.push('Missing or invalid category');
  }
  
  // Required numeric fields
  if (typeof recipeData.prepTime !== 'number' || recipeData.prepTime < 0) {
    errors.push('Missing or invalid prepTime');
  }
  
  if (typeof recipeData.waitTime !== 'number' || recipeData.waitTime < 0) {
    errors.push('Missing or invalid waitTime');
  }
  
  if (typeof recipeData.servings !== 'number' || recipeData.servings < 1) {
    errors.push('Missing or invalid servings');
  }
  
  // Required ingredients array
  if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
    errors.push('Missing or invalid ingredients array');
  } else {
    // Validate ingredient structure
    recipeData.ingredients.forEach((ingredient, index) => {
      if (!ingredient.item || typeof ingredient.item !== 'string') {
        errors.push(`Ingredient ${index}: missing or invalid item`);
      }
      if (ingredient.amount && typeof ingredient.amount !== 'string') {
        errors.push(`Ingredient ${index}: amount must be string`);
      }
      if (ingredient.unit && typeof ingredient.unit !== 'string') {
        errors.push(`Ingredient ${index}: unit must be string`);
      }
    });
  }
  
  // Validate ONE OF: stages OR instructions (not both, not neither)
  const hasStages = recipeData.stages && Array.isArray(recipeData.stages);
  const hasInstructions = recipeData.instructions && Array.isArray(recipeData.instructions);
  
  if (!hasStages && !hasInstructions) {
    errors.push('Must have either stages or instructions');
  }
  
  if (hasStages && hasInstructions) {
    errors.push('Cannot have both stages and instructions - choose one');
  }
  
  // Validate stages structure if present
  if (hasStages) {
    recipeData.stages.forEach((stage, index) => {
      if (!stage.title || typeof stage.title !== 'string') {
        errors.push(`Stage ${index}: missing or invalid title`);
      }
      if (!stage.instructions || !Array.isArray(stage.instructions) || stage.instructions.length === 0) {
        errors.push(`Stage ${index}: missing or invalid instructions array`);
      }
    });
  }
  
  // Validate instructions if present
  if (hasInstructions && !recipeData.instructions.every(instruction => typeof instruction === 'string')) {
    errors.push('All instructions must be strings');
  }
  
  // Optional fields validation (if present)
  if (recipeData.difficulty && typeof recipeData.difficulty !== 'string') {
    errors.push('Invalid difficulty: must be string');
  }
  
  if (recipeData.mainIngredient && typeof recipeData.mainIngredient !== 'string') {
    errors.push('Invalid mainIngredient: must be string');
  }
  
  if (recipeData.tags && (!Array.isArray(recipeData.tags) || !recipeData.tags.every(tag => typeof tag === 'string'))) {
    errors.push('Invalid tags: must be array of strings');
  }
  
  if (recipeData.comments && (!Array.isArray(recipeData.comments) || !recipeData.comments.every(comment => typeof comment === 'string'))) {
    errors.push('Invalid comments: must be array of strings');
  }
  
  // Future fields validation (if present)
  if (recipeData.description && typeof recipeData.description !== 'string') {
    errors.push('Invalid description: must be string');
  }
  
  if (recipeData.sourceUrl && typeof recipeData.sourceUrl !== 'string') {
    errors.push('Invalid sourceUrl: must be string');
  }
  
  return errors;
}

// Prepare recipe for Firestore storage
function prepareCookbookRecipe(recipeData, metadata) {
  const now = new Date();
  const firestoreTimestamp = {
    seconds: Math.floor(now.getTime() / 1000),
    nanoseconds: 0
  };
  
  // TODO: Remove these logs once description and sourceUrl are added to database schema
  if (recipeData.description) {
    console.log(`TODO: Store description field once added to database: "${recipeData.description}"`);
  }
  
  if (recipeData.sourceUrl) {
    console.log(`TODO: Store sourceUrl field once added to database: "${recipeData.sourceUrl}"`);
  }

  // TODO: Log transfer metadata for tracking (store once added to database schema)
  console.log('TODO: Store transfer metadata once added to database schema:', {
    transferredFrom: 'recipe-reader-demo',
    transferDate: metadata.timestamp,
    originalUserId: metadata.userId,
    originalUserEmail: metadata.userEmail
  });
  
  return {
    // Required fields
    name: recipeData.name,
    category: recipeData.category,
    prepTime: recipeData.prepTime,
    waitTime: recipeData.waitTime,
    servings: recipeData.servings,
    ingredients: recipeData.ingredients,
    
    // ONE OF: stages OR instructions
    ...(recipeData.stages && { stages: recipeData.stages }),
    ...(recipeData.instructions && { instructions: recipeData.instructions }),
    
    // Optional fields (with defaults for arrays)
    ...(recipeData.difficulty && { difficulty: recipeData.difficulty }),
    ...(recipeData.mainIngredient && { mainIngredient: recipeData.mainIngredient }),
    tags: recipeData.tags || [],
    comments: recipeData.comments || [],
    
    // TODO: Uncomment when added to database schema
    // ...(recipeData.description && { description: recipeData.description }),
    // ...(recipeData.sourceUrl && { sourceUrl: recipeData.sourceUrl }),
    // transferredFrom: 'recipe-reader-demo',
    // transferDate: metadata.timestamp,
    // originalUserId: metadata.userId,
    // originalUserEmail: metadata.userEmail,

    // System fields
    approved: false,
    allowImageSuggestions: true,
    images: [],
    pendingImages: [],
    creationTime: firestoreTimestamp,
  };
}

exports.processRecipeTransfer = onMessagePublished(
  'recipe-transfers',
  async (event) => {
    const messageId = event.id;
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] Recipe transfer request received:`, messageId);
    
    try {
      // Parse the Pub/Sub message
      const messageData = event.data.message.data;
      
      if (!messageData) {
        throw new Error('No message data received');
      }
      
      // Decode base64 message
      let transferRequest;
      try {
        const decodedMessage = Buffer.from(messageData, 'base64').toString();
        transferRequest = JSON.parse(decodedMessage);
      } catch (parseError) {
        throw new Error(`Failed to parse message JSON: ${parseError.message}`);
      }
      
      console.log('Processing recipe transfer for:', transferRequest.recipeData?.name);
      console.log('User:', transferRequest.metadata?.userEmail);
      console.log('Images count:', transferRequest.images?.length || 0);
      
      // Basic message structure validation
      if (!transferRequest.type || transferRequest.type !== 'recipe-transfer-requested') {
        throw new Error('Invalid message type');
      }
      
      if (!transferRequest.recipeData || !transferRequest.metadata) {
        throw new Error('Missing recipeData or metadata');
      }
      
      // Validate Cookbook recipe format
      const validationErrors = validateCookbookRecipe(transferRequest.recipeData);
      if (validationErrors.length > 0) {
        throw new Error(`Recipe validation failed: ${validationErrors.join(', ')}`);
      }
      
      console.log('Recipe validation passed');
      
      // Prepare recipe for Firestore
      const cookbookRecipe = prepareCookbookRecipe(transferRequest.recipeData, transferRequest.metadata);
      
      console.log('Prepared recipe for storage:', {
        name: cookbookRecipe.name,
        category: cookbookRecipe.category,
        hasStages: !!cookbookRecipe.stages,
        hasInstructions: !!cookbookRecipe.instructions,
        stagesCount: cookbookRecipe.stages?.length || 0,
        instructionsCount: cookbookRecipe.instructions?.length || 0,
        prepTime: cookbookRecipe.prepTime,
        waitTime: cookbookRecipe.waitTime,
        servings: cookbookRecipe.servings,
        approved: cookbookRecipe.approved,
        transferredFrom: cookbookRecipe.transferredFrom
      });
      
      // Store recipe in Firestore
      const recipeRef = await db.collection('recipes').add(cookbookRecipe);
      const recipeId = recipeRef.id;
      
      console.log(`Recipe stored successfully with ID: ${recipeId}`);
      
      // Process images if present
      const images = transferRequest.images || [];
      let processedImages = [];

      if (images.length > 0) {
      console.log(`Starting image transfer for ${images.length} images`);
        
        try {
                processedImages = await processRecipeImages(
                recipeId, 
                images, 
                transferRequest.recipeData.category,
                transferRequest.metadata.userId
            );
                
            // Update recipe with processed images
            if (processedImages.length > 0) {
                await recipeRef.update({ images: processedImages });
                console.log(`Updated recipe with ${processedImages.length} images`);
            }
                
        } catch (imageError) {
            console.error('Image processing failed:', imageError.message);
            // Recipe transfer succeeds even if images fail
        }
      }
      
      console.log(`Recipe transfer completed successfully: ${cookbookRecipe.name} (ID: ${recipeId})`);
      
      return { 
        success: true, 
        messageId: messageId,
        recipeId: recipeId,
        recipeName: cookbookRecipe.name,
        processedAt: timestamp
      };
      
    } catch (error) {
      console.error(`Recipe transfer failed [${messageId}]:`, error.message);
      console.error('Full error:', error);
      
      // Re-throw to trigger retry mechanism
      throw error;
    }
  }
);