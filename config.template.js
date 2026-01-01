// API Configuration - Generated during deployment
// DO NOT commit config.js - it contains sensitive keys
const CONFIG = {
  ODDS_API_KEYS: [
    { 
      key: '__ODDS_API_KEY__',  // This will be replaced during build
      limit: 500, 
      name: 'Primary', 
      type: 'odds' 
    }
  ],
  APP_VERSION: '5.4.0',
  CACHE_VERSION: 'ai-betting-v5.2.2'
};

if (typeof window !== 'undefined') {
  window.APP_CONFIG = CONFIG;
}
