/**
 * Maps the extracted recipe data from Gemini to the RecipeForm structure.
 *
 * @param {Object} extractedData - The raw JSON data from Gemini
 * @returns {Object} The mapped data suitable for RecipeForm population
 */
export function mapExtractedDataToForm(extractedData) {
  if (!extractedData) return {};

  const mappedData = {
    name: extractedData.name || '',
    category: extractedData.category || '',
    prepTime: extractedData.prepTime || 0,
    waitTime: extractedData.waitTime || 0,
    servings: extractedData.servings || 1,
    difficulty: extractedData.difficulty || 'Medium',
    description: extractedData.description || '', // Kept for future use
    ingredients: [],
    instructions: [],
    comments: extractedData.comments || [],
    tags: extractedData.tags || [],
  };

  // Map ingredients
  if (Array.isArray(extractedData.ingredients)) {
    mappedData.ingredients = extractedData.ingredients.map((ing) => ({
      item: ing.item || '',
      amount: ing.amount || '',
      unit: ing.unit || '',
    }));
  }

  // Map instructions (stages or flat list)
  // The schema asks for a flat list of instructions, so we map to flat list.
  // If the form supports stages, we might want to enhance the schema later,
  // but for now we follow the schema which outputs an array of strings.
  if (Array.isArray(extractedData.instructions)) {
    mappedData.instructions = extractedData.instructions;
  }

  return mappedData;
}
