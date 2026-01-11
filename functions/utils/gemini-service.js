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
      description: 'List of ingredients (Flat list). Use ONLY if there are no sections.',
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
      nullable: true,
    },
    ingredientSections: {
      type: SchemaType.ARRAY,
      description:
        'List of ingredient sections (e.g. for "Cake", "Frosting"). Use ONLY if there are sections.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
            description: 'Section title',
            nullable: false,
          },
          items: {
            type: SchemaType.ARRAY,
            description: 'Ingredients in this section',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                item: { type: SchemaType.STRING, nullable: false },
                amount: { type: SchemaType.STRING, nullable: true },
                unit: { type: SchemaType.STRING, nullable: true },
              },
              required: ['item'],
            },
          },
        },
        required: ['title', 'items'],
      },
      nullable: true,
    },
    instructions: {
      type: SchemaType.ARRAY,
      description: 'List of instruction steps (Flat list). Use ONLY if there are no stages.',
      items: {
        type: SchemaType.STRING,
        description: 'A single instruction step',
      },
      nullable: true,
    },
    stages: {
      type: SchemaType.ARRAY,
      description:
        'List of preparation stages. Use ONLY if the instructions are divided into named stages.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
            description: 'Stage title',
            nullable: false,
          },
          instructions: {
            type: SchemaType.ARRAY,
            description: 'List of instructions for this stage',
            items: { type: SchemaType.STRING },
          },
        },
        required: ['title', 'instructions'],
      },
      nullable: true,
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
  required: ['name'],
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
  
  CRITICAL RULES FOR STRUCTURE:
  1. ANALYZE STRUCTURE FIRST: Look specifically for titled sections (e.g., "For the Dough", "For the Sauce", "Preparation", "Baking").
  2. FORCE SECTIONS: If ANY titled sections are present in the image for ingredients, you MUST use 'ingredientSections' and set 'ingredients' to null.
  3. FORCE STAGES: If ANY titled sections are present for instructions, you MUST use 'stages' and set 'instructions' to null.
  4. EXCLUSIVITY: Never populate both flat lists and sections.
  
  Data Formatting:
  - Ingredients: Split into item, amount, and unit.
  - Instructions: Split into logical steps.
  - Language: Translate to Hebrew if not already in Hebrew.`;

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
