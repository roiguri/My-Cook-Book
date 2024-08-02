# Coding Standards for Our Kitchen Chronicles

## HTML Standards
- Use 2 spaces for indentation
- Use kebab-case for class and ID names (e.g., `recipe-card`, `ingredient-list`)
- Use semantic HTML elements where appropriate (e.g., `<nav>`, `<article>`, `<section>`)
- Always include alt text for images

## CSS Organization Rules:

File Structure:
Divide CSS into separate files: base.css, layout.css, components.css, pages.css, responsive.css, and print.css.
Use a main.css file to import all other CSS files.
- base.css: Include root variables, typography, and basic element styles.
Define global styles that apply throughout the site.
- layout.css: Contains styles for major layout components (header, footer, main content areas).
Focuses on the structure of the page rather than specific components.
- components.css: Include styles for reusable components (buttons, forms, cards, etc.).
Keep these styles generic and not tied to specific pages.
- pages.css: Contains page-specific styles.
Use page-specific classes as prefixes (e.g., .home-page, .category-page) to scope styles to particular pages.
- responsive.css: Group all media queries here.
Organize by component or page as needed.

Naming Conventions:
- Use kebab-case for class names (e.g., .recipe-card, .search-bar).
- Follow BEM (Block Element Modifier) methodology for naming when appropriate.

Specificity:
- Keep specificity as low as possible.
- Avoid using IDs for styling; prefer classes.

Comments:
- Use comments to separate major sections within each file.
- Briefly explain complex selectors or non-obvious style choices.

Reusability:
- Design components to be reusable across different pages when possible.
- Avoid overly specific selectors that tie styles to particular HTML structures.

Modularity:
- Group related styles together.
- Use CSS custom properties (variables) for repeated values.

Responsiveness:
- Use a mobile-first approach when writing media queries.

Optimization:
- Minimize the use of !important.
- Group related media queries together in the responsive.css file.

## JavaScript Standards
- Use ES6+ syntax
- Use camelCase for variable and function names
- Use const for variables that won't be reassigned, let otherwise
- Use arrow functions for callbacks and anonymous functions
- Use async/await for asynchronous operations instead of callbacks or promises

## JavaScript Modules
- Use ES6 modules to organize JavaScript code
- Create one module per file
- Use meaningful file names based on functionality
- Prefer named exports for multiple exports from a module
- Use default exports when a module primarily exports one thing
- Avoid side effects in modules; they should primarily define functionality

## General Practices
- Add comments for complex logic or non-obvious code
- Use descriptive variable and function names
- Commit messages should be concise and descriptive, starting with a verb in the present tense

## Version Control
- Create feature branches for new features or significant changes
- Use pull requests for code reviews before merging into the main branch

## Code Organization
- Separate concerns: HTML for structure, CSS for presentation, JavaScript for behavior
- Use modules to organize JavaScript code
- Keep functions small and focused on a single task

## File Organization
- Keep HTML, CSS, and JavaScript files in separate directories
- Use a src directory for source files and a dist directory for production-ready files
- Organize image assets in an img directory, further categorized by usage

This document serves as a starting point and can be expanded as the project evolves.
