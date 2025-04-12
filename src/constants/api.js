import { PORT } from "@env";

/**
 * API URLs and settings
 */
export const API = {
  // Base URL for the backend API
  BASE_URL: `http://192.168.0.136:${PORT}/api`,
  
  // Endpoints
  ENDPOINTS: {
    NOTIFICATIONS: "/notifications",
    STORED_NOTIFICATIONS: "/stored-notifications",
    TEST: "/test",
  },
  
  // Default request options
  OPTIONS: {
    headers: {
      "Content-Type": "application/json",
    },
  },
}; 