import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../constants/api';
import { auth } from '../../config/firebase';

const AUTH_TOKEN_KEY = '@auth_token';

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // Get the auth token from storage
    let token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    
    // If token doesn't exist or we need a fresh one
    if (!token && auth.currentUser) {
      token = await auth.currentUser.getIdToken(true);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    
    // Prepare headers with authentication
    const headers = {
      ...API.OPTIONS.headers,
      ...(options.headers || {}),
    };
    
    // Add the auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Make the request
    const response = await fetch(`${API.BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    // Handle token expiration
    if (response.status === 401) {
      // Try to refresh the token
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken(true);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        
        // Retry the request with the new token
        headers['Authorization'] = `Bearer ${token}`;
        const retryResponse = await fetch(`${API.BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        
        return await retryResponse.json();
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - Response data
 */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    method: 'GET',
    ...options,
  });
};

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - Response data
 */
export const post = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - Response data
 */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    ...options,
  });
}; 