const { GoogleGenAI } = require('@google/genai');
const { defineSecret } = require('firebase-functions/params');

// Define secret for API key
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const RECIPE_SCHEMA = {
  description: 'Recipe data extraction schema',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'The name of the recipe',
      nullable: false,
    },
    description: {
      type: 'string',
      description: 'A short description of the recipe',
      nullable: true,
    },
    prepTime: {
      type: 'number',
      description: 'Preparation time in minutes',
      nullable: true,
    },
    waitTime: {
      type: 'number',
      description: 'Wait/Cooking time in minutes',
      nullable: true,
    },
    servings: {
      type: 'number',
      description: 'Number of servings',
      nullable: true,
    },
    difficulty: {
      type: 'string',
      description:
        'Difficulty level in Hebrew. Infer from recipe complexity if not explicitly stated: קלה (few ingredients, simple techniques), בינונית (moderate effort), קשה (many steps, advanced techniques)',
      enum: ['קלה', 'בינונית', 'קשה'],
      nullable: false,
    },
    category: {
      type: 'string',
      description:
        'Recipe category ID. MUST be one of the allowed values. Infer based on recipe type if not explicitly stated.',
      enum: [
        'appetizers',
        'main-courses',
        'side-dishes',
        'soups-stews',
        'salads',
        'desserts',
        'breakfast-brunch',
        'breads-pastries',
        'snacks',
        'beverages',
      ],
      nullable: false,
    },
    mainIngredient: {
      type: 'string',
      description:
        'The primary/main ingredient of the recipe (e.g., chicken, pasta, chocolate). Infer from the most prominent ingredient if not stated.',
      nullable: true,
    },
    ingredients: {
      type: 'array',
      description: 'List of ingredients (Flat list). Use ONLY if there are no sections.',
      items: {
        type: 'object',
        properties: {
          item: {
            type: 'string',
            description: 'The ingredient name',
            nullable: false,
          },
          amount: {
            type: 'string',
            description: 'The amount of the ingredient (e.g. "2", "1/2")',
            nullable: true,
          },
          unit: {
            type: 'string',
            description: 'The unit of measurement (e.g. "cups", "g", "tbsp")',
            nullable: true,
          },
        },
        required: ['item'],
      },
      nullable: true,
    },
    ingredientSections: {
      type: 'array',
      description:
        'List of ingredient sections (e.g. for "Cake", "Frosting"). Use ONLY if there are sections.',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Section title',
            nullable: false,
          },
          items: {
            type: 'array',
            description: 'Ingredients in this section',
            items: {
              type: 'object',
              properties: {
                item: { type: 'string', nullable: false },
                amount: { type: 'string', nullable: true },
                unit: { type: 'string', nullable: true },
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
      type: 'array',
      description: 'List of instruction steps (Flat list). Use ONLY if there are no stages.',
      items: {
        type: 'string',
        description: 'A single instruction step',
      },
      nullable: true,
    },
    stages: {
      type: 'array',
      description:
        'List of preparation stages. Use ONLY if the instructions are divided into named stages.',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Stage title',
            nullable: false,
          },
          instructions: {
            type: 'array',
            description: 'List of instructions for this stage',
            items: { type: 'string' },
          },
        },
        required: ['title', 'instructions'],
      },
      nullable: true,
    },
    comments: {
      type: 'array',
      description: 'Chef notes or comments',
      items: {
        type: 'string',
      },
      nullable: true,
    },
    tags: {
      type: 'array',
      description: 'Tags for the recipe',
      items: {
        type: 'string',
      },
      nullable: true,
    },
  },
  required: ['name'],
};

const IMAGE_EXTRACTION_PROMPT = `Extract the complete recipe details from the provided image(s). 
  
CRITICAL RULES FOR STRUCTURE:
1. COMBINE INFORMATION: The images may be pages of the same recipe or different parts. Combine all information into a single recipe.
2. ANALYZE STRUCTURE FIRST: Look specifically for titled sections (e.g., "For the Dough", "For the Sauce", "Preparation", "Baking").
3. FORCE SECTIONS: If ANY titled sections are present in the image for ingredients, you MUST use 'ingredientSections' and set 'ingredients' to null.
4. FORCE STAGES: If ANY titled sections are present for instructions, you MUST use 'stages' and set 'instructions' to null.
5. EXCLUSIVITY: Never populate both flat lists and sections.

REQUIRED METADATA (always populate these based on recipe content):
- category: Choose the BEST matching category from the allowed enum values based on recipe type
- difficulty: Assess complexity based on number of ingredients, steps, and techniques required
- mainIngredient: Identify the primary/central ingredient (in Hebrew)

Data Formatting:
- Ingredients: Split into item, amount, and unit.
- Instructions: Split into logical steps.
- Language: Translate ALL text to Hebrew.`;

const URL_EXTRACTION_PROMPT = `Extract the complete recipe details from the webpage at the provided URL.

CRITICAL RULES FOR STRUCTURE:
1. ANALYZE STRUCTURE FIRST: Look specifically for titled sections (e.g., "For the Dough", "For the Sauce", "Preparation", "Baking").
2. FORCE SECTIONS: If ANY titled sections are present for ingredients, you MUST use 'ingredientSections' and set 'ingredients' to null.
3. FORCE STAGES: If ANY titled sections are present for instructions, you MUST use 'stages' and set 'instructions' to null.
4. EXCLUSIVITY: Never populate both flat lists and sections.

REQUIRED METADATA (always populate these based on recipe content):
- category: Choose the BEST matching category from the allowed enum values based on recipe type
- difficulty: Assess complexity based on number of ingredients, steps, and techniques required
- mainIngredient: Identify the primary/central ingredient (in Hebrew)

Data Formatting:
- Ingredients: Split into item, amount, and unit.
- Instructions: Split into logical steps.
- Language: Translate ALL text to Hebrew.

IMPORTANT: If you cannot find a valid recipe on the page, return a response with name set to null to indicate failure.`;

/**
 * Creates a configured Gemini client
 */
function createClient() {
  if (!geminiApiKey.value()) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenAI({ apiKey: geminiApiKey.value() });
}

/**
 * Validates extracted recipe data
 * @param {Object} data - The extracted recipe data
 * @returns {boolean} - Whether the data is valid
 */
function validateRecipeData(data) {
  if (!data) return false;
  if (!data.name || data.name.trim() === '') return false;

  // Check for at least some ingredients or instructions
  const hasIngredients =
    (data.ingredients && data.ingredients.length > 0) ||
    (data.ingredientSections && data.ingredientSections.length > 0);

  const hasInstructions =
    (data.instructions && data.instructions.length > 0) || (data.stages && data.stages.length > 0);

  return hasIngredients || hasInstructions;
}

/**
 * Extracts recipe data from images using Gemini.
 *
 * @param {Array} images - Array of {base64, mimeType} objects
 * @returns {Promise<Object>} The extracted recipe data.
 */
async function extractRecipeFromImage(images) {
  const client = createClient();

  const imageParts = images.map((img) => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType || 'image/jpeg',
    },
  }));

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: IMAGE_EXTRACTION_PROMPT }, ...imageParts] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: RECIPE_SCHEMA,
      },
    });

    const responseText = response.text;
    const data = JSON.parse(responseText);

    if (!validateRecipeData(data)) {
      throw new Error('Could not extract valid recipe data from the image(s)');
    }

    return data;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error.message.includes('Could not extract')) {
      throw error;
    }
    throw new Error('Failed to extract recipe from image');
  }
}

/**
 * Extracts recipe data from a URL using Gemini with URL Context tool.
 * Uses a two-step approach since urlContext can't be combined with JSON response schema.
 *
 * @param {string} url - The URL of the recipe webpage.
 * @returns {Promise<Object>} The extracted recipe data.
 */
async function extractRecipeFromUrl(url) {
  const client = createClient();

  // Step 1: Fetch and extract recipe using URL Context (returns text)
  const extractionPrompt = `${URL_EXTRACTION_PROMPT}

URL to analyze: ${url}

Return the recipe data as a valid JSON object with this structure:
{
  "name": "recipe name in Hebrew",
  "description": "short description",
  "prepTime": number (minutes),
  "waitTime": number (minutes),
  "servings": number,
  "difficulty": "קלה" | "בינונית" | "קשה",
  "category": "appetizers" | "main-courses" | "side-dishes" | "soups-stews" | "salads" | "desserts" | "breakfast-brunch" | "breads-pastries" | "snacks" | "beverages",
  "mainIngredient": "main ingredient in Hebrew",
  "ingredients": [{"item": "name", "amount": "amount", "unit": "unit"}] OR null if using sections,
  "ingredientSections": [{"title": "section name", "items": [...]}] OR null if using flat list,
  "instructions": ["step 1", "step 2"] OR null if using stages,
  "stages": [{"title": "stage name", "instructions": [...]}] OR null if using flat list,
  "comments": ["note 1"],
  "tags": ["tag1", "tag2"]
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [extractionPrompt],
      config: {
        tools: [{ urlContext: {} }],
      },
    });

    let responseText = response.text;

    // Log URL context metadata for debugging
    if (response.candidates?.[0]?.urlContextMetadata) {
      console.log(
        'URL Context Metadata:',
        JSON.stringify(response.candidates[0].urlContextMetadata),
      );
    }

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.slice(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3);
    }
    responseText = responseText.trim();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Initial JSON parsing failed, attempting cleanup with structured output...');

      // Fallback: Use another Gemini call with JSON response type to clean up
      try {
        const cleanupResponse = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            `Convert the following recipe text into a valid JSON object matching the schema. 
Extract all recipe information and return ONLY the JSON object.

Recipe text:
${responseText}`,
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: RECIPE_SCHEMA,
          },
        });

        data = JSON.parse(cleanupResponse.text);
        console.log('Successfully parsed recipe using cleanup call');
      } catch (cleanupError) {
        console.error('Failed to parse Gemini response as JSON:', responseText.substring(0, 500));
        console.error('Cleanup call also failed:', cleanupError.message);
        throw new Error('Could not extract valid recipe data - response was not valid JSON');
      }
    }

    if (!validateRecipeData(data)) {
      throw new Error(
        'Could not extract valid recipe data from this URL. The page may require login, use JavaScript rendering, or not contain a recognizable recipe.',
      );
    }

    return data;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error.message.includes('Could not extract')) {
      throw error;
    }
    throw new Error('Failed to extract recipe from URL');
  }
}

module.exports = {
  extractRecipeFromImage,
  extractRecipeFromUrl,
};
