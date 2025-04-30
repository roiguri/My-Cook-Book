import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'firebase',
              importNames: ['default'],
              message:
                'Default import of Firebase is restricted. Use only named imports for helpers or use firebase-service.js.',
            },
            {
              name: 'firebase/auth',
              importNames: ['default'],
              message:
                'Default import of Firebase Auth is restricted. Use only named imports for helpers or use firebase-service.js.',
            },
            {
              name: 'firebase/firestore',
              importNames: ['default'],
              message:
                'Default import of Firestore is restricted. Use only named imports for helpers or use firebase-service.js.',
            },
            {
              name: 'firebase/storage',
              importNames: ['default'],
              message:
                'Default import of Storage is restricted. Use only named imports for helpers or use firebase-service.js.',
            },
          ],
          patterns: [{ group: ['firebase/compat/*'], message: 'Do not use compat API' }],
        },
      ],
      // Add more rules as needed
    },
  },
];
