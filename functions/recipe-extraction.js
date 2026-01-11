const { onCall } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { defineSecret } = require('firebase-functions/params');

const apiKey = defineSecret('GOOGLE_AI_API_KEY');

// Define the schema for the recipe output
const recipeSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING, description: 'The name of the recipe' },
    description: { type: SchemaType.STRING, description: 'A short description of the recipe' },
    category: {
      type: SchemaType.STRING,
      description:
        "Category of the recipe. One of: 'עוגות', 'עוגיות', 'מאפים', 'קינוחים', 'עיקריות', 'תוספות', 'סלטים', 'מרקים', 'לחמים', 'אחר'",
      enum: [
        'עוגות',
        'עוגיות',
        'מאפים',
        'קינוחים',
        'עיקריות',
        'תוספות',
        'סלטים',
        'מרקים',
        'לחמים',
        'אחר',
      ],
    },
    prepTime: { type: SchemaType.NUMBER, description: 'Preparation time in minutes' },
    waitTime: { type: SchemaType.NUMBER, description: 'Wait/cooking time in minutes' },
    servings: { type: SchemaType.NUMBER, description: 'Number of servings' },
    difficulty: {
      type: SchemaType.STRING,
      description: "Difficulty level. One of: 'קל', 'בינוני', 'קשה'",
      enum: ['קל', 'בינוני', 'קשה'],
    },
    ingredients: {
      type: SchemaType.ARRAY,
      description: 'List of ingredients if no sections are used',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: { type: SchemaType.STRING, description: 'Ingredient name' },
          amount: { type: SchemaType.STRING, description: "Amount (e.g., '2', '1.5')" },
          unit: { type: SchemaType.STRING, description: "Unit (e.g., 'cup', 'kg', 'tablespoon')" },
        },
        required: ['item'],
      },
    },
    ingredientSections: {
      type: SchemaType.ARRAY,
      description:
        "List of ingredient sections if the recipe is divided (e.g., 'Dough', 'Filling')",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'Section title' },
          items: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                item: { type: SchemaType.STRING, description: 'Ingredient name' },
                amount: { type: SchemaType.STRING, description: 'Amount' },
                unit: { type: SchemaType.STRING, description: 'Unit' },
              },
              required: ['item'],
            },
          },
        },
        required: ['title', 'items'],
      },
    },
    instructions: {
      type: SchemaType.ARRAY,
      description: 'List of instruction steps',
      items: { type: SchemaType.STRING },
    },
    stages: {
      type: SchemaType.ARRAY,
      description: 'List of instruction stages if divided',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'Stage title' },
          instructions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['title', 'instructions'],
      },
    },
    tags: {
      type: SchemaType.ARRAY,
      description: 'List of tags',
      items: { type: SchemaType.STRING },
    },
    comments: {
      type: SchemaType.ARRAY,
      description: "Chef's notes or comments",
      items: { type: SchemaType.STRING },
    },
  },
  required: ['name', 'category', 'ingredients', 'instructions'],
};

exports.extractRecipeFromImage = onCall(
  {
    secrets: [apiKey],
    maxInstances: 10,
    timeoutSeconds: 60,
    cors: true,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    // Get images from request
    const { images } = request.data;
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with an array of images.',
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey.value());
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: recipeSchema,
        },
      });

      const prompt = `Extract a recipe from these images. Translate everything to Hebrew.
    Map the category to the closest one from the list.
    If there are distinct sections for ingredients (like 'dough', 'filling'), use 'ingredientSections'. Otherwise use 'ingredients'.
    Same for 'stages' vs 'instructions'.`;

      // Prepare image parts
      const imageParts = images.map((base64String) => {
        // Remove data URL prefix if present
        const cleanBase64 = base64String.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        return {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        };
      });

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      return JSON.parse(text);
    } catch (error) {
      console.error('Error extracting recipe:', error);
      throw new HttpsError('internal', 'Failed to extract recipe from images.', error.message);
    }
  },
);
