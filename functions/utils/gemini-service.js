const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { defineSecret } = require('firebase-functions/params');

// Define secret for API key
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const RECIPE_SCHEMA = {
  description: 'Recipe data extraction schema',
  type: SchemaType.OBJECT,
  properties: {
    name: {
      type: SchemaType.STRING,
      description: 'The name of the recipe',
      nullable: false,
    },
    description: {
      type: SchemaType.STRING,
      description: 'A short description of the recipe',
      nullable: true,
    },
    prepTime: {
      type: SchemaType.NUMBER,
      description: 'Preparation time in minutes',
      nullable: true,
    },
    waitTime: {
      type: SchemaType.NUMBER,
      description: 'Wait/Cooking time in minutes',
      nullable: true,
    },
    servings: {
      type: SchemaType.NUMBER,
      description: 'Number of servings',
      nullable: true,
    },
    difficulty: {
      type: SchemaType.STRING,
      description: 'Difficulty level (Easy, Medium, Hard)',
      enum: ['Easy', 'Medium', 'Hard'],
      nullable: true,
    },
    category: {
      type: SchemaType.STRING,
      description: 'Recipe category (e.g., Main Course, Dessert, Salad)',
      nullable: true,
    },
    ingredients: {
      type: SchemaType.ARRAY,
      description: 'List of ingredients',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: {
            type: SchemaType.STRING,
            description: 'The ingredient name',
            nullable: false,
          },
          amount: {
            type: SchemaType.STRING,
            description: 'The amount of the ingredient (e.g. "2", "1/2")',
            nullable: true,
          },
          unit: {
            type: SchemaType.STRING,
            description: 'The unit of measurement (e.g. "cups", "g", "tbsp")',
            nullable: true,
          },
        },
        required: ['item'],
      },
    },
    instructions: {
      type: SchemaType.ARRAY,
      description: 'List of instruction steps',
      items: {
        type: SchemaType.STRING,
        description: 'A single instruction step',
      },
    },
    comments: {
      type: SchemaType.ARRAY,
      description: 'Chef notes or comments',
      items: {
        type: SchemaType.STRING,
      },
      nullable: true,
    },
    tags: {
      type: SchemaType.ARRAY,
      description: 'Tags for the recipe',
      items: {
        type: SchemaType.STRING,
      },
      nullable: true,
    },
  },
  required: ['name', 'ingredients', 'instructions'],
};

/**
 * Extracts recipe data from an image using Gemini 3.0 Flash.
 *
 * @param {string} imageBase64 - The base64 encoded image string.
 * @param {string} mimeType - The mime type of the image (e.g. 'image/jpeg').
 * @returns {Promise<Object>} The extracted recipe data.
 */
async function extractRecipeFromImage(imageBase64, mimeType = 'image/jpeg') {
  if (!geminiApiKey.value()) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey.value());

  // Use gemini-3.0-flash-preview as requested, or fallback to stable if needed
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RECIPE_SCHEMA,
    },
  });

  const prompt = `Extract the recipe details from this image. 
  If any field is missing or cannot be inferred, leave it null or empty.
  Ensure ingredients are split into item, amount, and unit where possible.
  Ensure instructions are split into logical steps.
  Translate to Hebrew if the recipe is in another language, but keep original if it is already in Hebrew.`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to extract recipe from image');
  }
}

module.exports = {
  extractRecipeFromImage,
};
