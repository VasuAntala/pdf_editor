// API Configuration
export const API_CONFIG = {
  // In development, try to detect the current host and use it for the API
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:5000/api`
      : 'http://localhost:5000/api'),
  
  // Fallback URLs for different scenarios
  fallbackUrls: [
    'http://localhost:5000/api',
    'http://127.0.0.1:5000/api',
    'https://localhost:5000/api'
  ]
};

// Helper function to get the best API URL
export const getApiUrl = (): string => {
  // If we're in the browser, try to use the current host
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    
    // If accessing from a different device (not localhost), use the current host
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      return `${currentProtocol}//${currentHost}:5000/api`;
    }
  }
  
  return API_CONFIG.baseUrl;
};

export const API_BASE_URL = 'http://localhost:5000/api'; 