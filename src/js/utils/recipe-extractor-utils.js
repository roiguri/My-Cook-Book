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
    comments: extractedData.comments || [],
    tags: extractedData.tags || [],
  };

  // Map ingredients - prioritize sections if available
  if (
    extractedData.ingredientSections &&
    Array.isArray(extractedData.ingredientSections) &&
    extractedData.ingredientSections.length > 0
  ) {
    mappedData.ingredientSections = extractedData.ingredientSections.map((section) => ({
      title: section.title || 'כללי',
      items: (section.items || []).map((ing) => ({
        item: ing.item || '',
        amount: ing.amount || '',
        unit: ing.unit || '',
      })),
    }));
    // Explicitly set ingredients to empty/undefined to avoid conflicts
    mappedData.ingredients = null;
  } else if (extractedData.ingredients && Array.isArray(extractedData.ingredients)) {
    mappedData.ingredients = extractedData.ingredients.map((ing) => ({
      item: ing.item || '',
      amount: ing.amount || '',
      unit: ing.unit || '',
    }));
    mappedData.ingredientSections = null;
  } else {
    mappedData.ingredients = []; // Default to empty flat list
  }

  // Map instructions - prioritize stages if available
  if (
    extractedData.stages &&
    Array.isArray(extractedData.stages) &&
    extractedData.stages.length > 0
  ) {
    mappedData.stages = extractedData.stages.map((stage) => ({
      title: stage.title || 'שלב',
      instructions: stage.instructions || [],
    }));
    mappedData.instructions = null;
  } else if (extractedData.instructions && Array.isArray(extractedData.instructions)) {
    mappedData.instructions = extractedData.instructions;
    mappedData.stages = null;
  } else {
    mappedData.instructions = []; // Default to empty flat list
  }

  return mappedData;
}
