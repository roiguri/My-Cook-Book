# Coding Standards for Our Kitchen Chronicles

## HTML Standards
- Use 2 spaces for indentation
- Use kebab-case for class and ID names (e.g., `recipe-card`, `ingredient-list`)
- Use semantic HTML elements where appropriate (e.g., `<nav>`, `<article>`, `<section>`)
- Always include alt text for images

## CSS Standards
- Follow BEM (Block Element Modifier) methodology for class naming
- Use kebab-case for class names (e.g., `.recipe-card__title--large`)
- Use a mobile-first approach for responsive design
- Define variables for colors and typography in :root
- Organize styles from general to specific
- Use CSS custom properties (variables) for repeated values
- Use logical and consistent file structure for CSS

## CSS File Structure
Organize CSS into the following files:
- base.css: Reset styles, typography, and general element styles
- layout.css: Grid systems and overall page structure
- components.css: Styles for reusable components (buttons, forms, etc.)
- pages.css: Page-specific styles
- utilities.css: Utility classes for common adjustments

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
