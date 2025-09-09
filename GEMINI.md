## Project Overview

This is a Single Page Application (SPA) built with vanilla JavaScript for managing a cookbook. It uses Vite for development and bundling, and Jest for testing. The application integrates with Firebase for backend services, including Authentication, Firestore, and Storage.

The project was initially created for learning purposes and, as a result, employs various techniques and patterns. It is currently being refactored to follow a more uniform design.

## Building and Running

### Prerequisites

- Node.js and npm

### Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

### Development

For a lightweight development server, you can use Vite:

```bash
npm run dev
```

For a more accurate production-like environment that includes Netlify's features (e.g., redirects, functions), use the Netlify CLI:

```bash
netlify dev
```

### Build

To build the application for production:

```bash
npm run build
```

### Serve

To preview the production build:

```bash
npm run serve
```

### Testing

To run the tests:

```bash
npm run test
```

### Linting

To lint the code:

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

## Development Conventions

*   **JavaScript:** The project uses modern JavaScript (ES modules).
*   **Styling:** CSS is used for styling, with files organized by component and page.
*   **Testing:** Tests are written with Jest and are located in the `tests` directory.
*   **Code Formatting:** Prettier is used for code formatting.
*   **Linting:** ESLint is used for code linting.
*   **Firebase:** The project uses Firebase for backend services. Configuration is in `firebase.json` and `src/js/config/firebase-config.js`.
*   **Vite:** The project uses Vite as a build tool. Configuration is in `vite.config.js`.
