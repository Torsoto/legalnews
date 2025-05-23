import { PORT, IP } from "@env";

/**
 * API URLs and settings
 */
export const API = {
  // Base URL for the backend API
  BASE_URL: `http://${IP}:${PORT}/api`,

  // Endpoints
  ENDPOINTS: {
    NOTIFICATIONS: "/notifications",
    STATE_NOTIFICATIONS: "/state-notifications",
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
