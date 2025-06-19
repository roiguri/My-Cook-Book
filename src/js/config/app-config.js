/**
 * Application Configuration
 * Provides access to environment variables throughout the app
 */

export const AppConfig = {
  // App title with environment suffix (for page titles)
  title: import.meta.env.VITE_APP_TITLE || 'Our Kitchen Chronicles',

  // Base app name without environment suffix (for logos, footers, etc.)
  name: import.meta.env.VITE_APP_NAME || 'Our Kitchen Chronicles',

  // Icon path for current environment
  iconPath: import.meta.env.VITE_ICON_PATH || 'prod',

  // Manifest file for current environment
  manifestFile: import.meta.env.VITE_MANIFEST_FILE || 'site.webmanifest.json',

  // Get formatted title for pages (with suffix if needed)
  getPageTitle: (pageTitle = '') => {
    if (pageTitle) {
      return `${pageTitle} - ${AppConfig.title}`;
    }
    return AppConfig.title;
  },

  // Get base app name for branding
  getAppName: () => AppConfig.name,

  // Check if we're in a specific environment
  isDev: () => AppConfig.title.includes('[DEV]'),
  isStaging: () => AppConfig.title.includes('[STAGING]'),
  isProduction: () => !AppConfig.title.includes('[') && !AppConfig.title.includes(']'),
};

export default AppConfig;
