# Manual for Adding Recipes to Our Kitchen Chronicles

## 1. Recipe Data Structure

Each recipe is an object in the Firestore database. Here's the basic structure:

```javascript
{
    id: number,
    name: string,
    category: string,
    cookingTime: number,
    difficulty: string,
    mainIngredient: string,
    image: string,
    tags: array,
    servings: number,
    ingredients: array,
    instructions: array,
    stages: array (optional)
}
```

## 2. Field Details

- `id`: Unique identifier for the recipe. Use the following convention:
  - 1xx: Appetizers
  - 2xx: Main Courses
  - 3xx: Side Dishes
  - 4xx: Soups & Stews
  - 5xx: Salads
  - 6xx: Desserts
  - 7xx: Breakfast & Brunch
  - 8xx: Snacks
  - 9xx: Beverages

- `name`: The recipe name in Hebrew.
- `category`: One of the following: "appetizers", "main-courses", "side-dishes", "soups-stews", "salads", "desserts", "breakfast-brunch", "snacks", "beverages".
- `cookingTime`: Total time in minutes, including preparation and cooking.
- `difficulty`: One of the following in Hebrew: "קלה", "בינונית", "קשה".
- `mainIngredient`: The primary ingredient of the dish in Hebrew.
- `image`: Filename of the recipe image, including extension (e.g., "recipe-name.jpg").
- `tags`: An array of relevant keywords in Hebrew.
- `servings`: The number of servings the recipe yields.
- `ingredients`: An array of ingredient objects, each containing:
  ```javascript
  { item: string, amount: number, unit: string }
  ```
- `instructions`: An array of strings, each representing a step in the recipe (for recipes without distinct stages).
- `stages`: An array of stage objects (for recipes with distinct stages), each containing:
  ```javascript
  { title: string, instructions: array }
  ```

## 3. Instructions vs. Stages

- Use `instructions` for recipes with a simple, linear set of steps.
- Use `stages` for recipes with distinct phases or when grouping steps makes the recipe easier to follow.

Example with `instructions`:
```javascript
instructions: [
    "Mix flour and salt in a bowl.",
    "Add water and knead into a dough.",
    "Let the dough rest for 30 minutes.",
    "Roll out and bake at 200°C for 15 minutes."
]
```

Example with `stages`:
```javascript
stages: [
    {
        title: "הכנת הבצק",
        instructions: [
            "Mix flour and salt in a bowl.",
            "Add water and knead into a dough.",
            "Let the dough rest for 30 minutes."
        ]
    },
    {
        title: "אפייה",
        instructions: [
            "Roll out the dough.",
            "Bake at 200°C for 15 minutes."
        ]
    }
]
```

## 4. Image Guidelines

- Save recipe images in the appropriate category folder: `img/recipes/[category]/`.
- Save size recipe compressed images in the appropriate category folder: `img/recipes-compressed/[category]/`.
- Make sure to alwayd add the image to both recipes and reciped-compressed.
- Use descriptive, kebab-case filenames (e.g., "chocolate-chip-cookies.jpg").
- Optimize images for web use (compress and resize as needed).

## 5. Adding a New Recipe

1. Choose the next available ID in the appropriate category range.
2. Fill in all required fields in the recipe object.
3. Add the recipe object to the Firestore database.
4. Save the recipe image in the correct folder with the filename specified in the `image` field.

## 6. Naming Conventions

- Use kebab-case for image filenames and URL-related strings.
- Use camelCase for JavaScript variable and property names.
- Use Title Case for recipe names and stage titles.

## 7. Hebrew Text

- Ensure all Hebrew text is right-to-left (RTL) compatible.
- Use Unicode Hebrew characters (not transliterations).

## 8. Tags

- Use relevant, concise tags in Hebrew.
- Include main ingredients, cooking methods, and dietary information (e.g., "vegetarian", "gluten-free").
- Make sure to check if there is already a relevant Main Ingredient before choosing a different one.

## 9. Links and Navigation

- Ensure the recipe ID in the URL hash matches the `id` in the recipe object.
- Update any necessary navigation elements or category pages to include the new recipe.

## 10. Testing

- After adding a new recipe, test the following:
  - Recipe loads correctly on the recipe page.
  - All links to the recipe work.
  - Image displays properly.
  - Ingredient amounts adjust correctly with serving size changes.
  - Print functionality works as expected.

## 11. Maintenance

- Regularly review and update recipes for accuracy and consistency.
- Consider adding new categories or tags as the recipe collection grows.

Remember to maintain consistency across all recipes and follow these guidelines to ensure a smooth user experience on Our Kitchen Chronicles.
