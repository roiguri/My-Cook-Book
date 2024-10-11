# MissingImageUpload Component Manual

## Introduction
The MissingImageUpload component is a custom web component that allows users to upload missing images for recipes. It provides a modal interface for image selection and upload.

## Installation

1. Include the component's JavaScript file in your HTML:

```html
<script src="path/to/missing-image-upload.js"></script>
```

2. Add the component to your HTML:

```html
<missing-image-upload></missing-image-upload>
```

## Usage

### Adding Upload Buttons

For each recipe that needs an image upload option, add a button with the following structure:

```html
<button class="upload-missing-image-button" data-recipe-id="12345">Upload Image</button>
```

Replace "12345" with the actual ID of the recipe.

### Styling

The component uses CSS variables for easy styling. You can override these in your main CSS file:

```css
:root {
  --primary-color: #bb6016;
  --primary-hover: #5c4033;
  --secondary-color: #e6dfd1;
  --background-color: #f5f2e9;
}
```

## Functionality

- Clicking an "Upload Image" button opens a modal for that specific recipe.
- Users can select an image file (jpg, jpeg, or png).
- The component validates the file type and displays error messages if needed.
- After selection, a preview of the image is shown.
- Users can clear their selection or proceed with the upload.

## Notes

- The component automatically adds click event listeners to all buttons with the class `upload-missing-image-button`.
- Ensure that each upload button has a unique `data-recipe-id` attribute corresponding to the recipe it's associated with.
