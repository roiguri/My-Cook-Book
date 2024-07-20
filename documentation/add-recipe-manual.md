# Manual: How to Add a New Recipe

To add a new recipe to the website, follow these steps:

1. Open the `recipeData.js` file in the `js` directory.

2. Locate the `recipes` array in the file.

3. Add a new recipe object to the array. Use the following template:

   ```javascript
   {
     id: [Unique ID number],
     name: "[Recipe Name]",
     category: "[Category]",
     cookingTime: [Cooking time in minutes],
     difficulty: "[easy/medium/hard]",
     mainIngredient: "[Main ingredient]",
     image: "[image-filename.jpg]",
     tags: ["tag1", "tag2", "tag3"]
   }
   ```

4. Fill in the details for your new recipe:
   - `id`: Assign a unique ID number (increment the highest existing ID).
   - `name`: The name of your recipe.
   - `category`: One of the existing categories (appetizers, main-courses, side-dishes, soups-stews, salads, desserts, breakfast-brunch, snacks, beverages).
   - `cookingTime`: The total cooking time in minutes.
   - `difficulty`: Choose from "easy", "medium", or "hard".
   - `mainIngredient`: The primary ingredient in the recipe.
   - `image`: The filename of the recipe image (make sure to add this image to the `img/recipes` directory).
   - `tags`: An array of relevant tags for the recipe.

5. Save the `recipeData.js` file.

6. Add the recipe image:
   - Name your image file according to what you specified in the recipe object.
   - Place the image file in the `img/recipes` directory.

7. Test the website to ensure the new recipe appears in the correct category and can be filtered appropriately.

## Example

Here's an example of adding a new recipe:

```javascript
{
  id: 4,
  name: "Margherita Pizza",
  category: "main-courses",
  cookingTime: 30,
  difficulty: "medium",
  mainIngredient: "cheese",
  image: "margherita-pizza.jpg",
  tags: ["italian", "vegetarian", "quick"]
}
```

## Important Notes

- Ensure that the `id` is unique for each recipe.
- The `category` must match one of the existing categories exactly.
- The `difficulty` must be either "easy", "medium", or "hard".
- Make sure the image file exists in the `img/recipes` directory and matches the filename specified in the recipe object.
- Tags are used for filtering, so choose them carefully to help users find the recipe.

After adding a new recipe, always test the website to ensure everything works correctly.
