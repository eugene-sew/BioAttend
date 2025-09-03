/**
 * Application configuration
 * Exposes environment variables for use throughout the application
 */

const config = {
  // API Configuration
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
  },

  // Pusher (Channels) Configuration
  pusher: {
    key: import.meta.env.VITE_PUSHER_KEY || '',
    cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'mt1',
    // App ID and Secret should NOT be used on the frontend
  },

  // Environment
  env: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

// Validate required configuration
const validateConfig = () => {
  const required = ['VITE_API_URL', 'VITE_WS_URL', 'VITE_PUSHER_KEY', 'VITE_PUSHER_CLUSTER'];
  const missing = [];

  for (const key of required) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
    console.warn('Using default values. Please check your .env file.');
  }
};

// Run validation in development
if (config.isDevelopment) {
  validateConfig();
}

export default config;
