import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../config/firebase';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

/**
 * Persists user authentication data to AsyncStorage
 * @param {Object} user - Firebase user object
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const persistAuth = async (user) => {
  try {
    // Store the user's ID token
    const token = await user.getIdToken(true);// Force refresh to ensure we have a fresh token
    //console.log('Token:', token); //ONLY FOR TESTING (e.g.: browser with extenstion or postman)
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    
    // Store basic user info
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    };
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    
    return true;
  } catch (error) {
    console.error('Error persisting auth:', error);
    return false;
  }
};

/**
 * Clears all authentication data from AsyncStorage
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const clearAuth = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing auth:', error);
    return false;
  }
};

/**
 * Retrieves and validates persisted authentication data
 * @returns {Promise<Object|null>} - User data if authenticated, null otherwise
 */
export const getPersistedAuth = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
    
    if (!token || !userData) {
      return null;
    }
    
    // Verify the token is still valid
    try {
      if (auth.currentUser) {
        // Refresh the token to ensure it's valid for API requests
        const newToken = await auth.currentUser.getIdToken(true);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
      }
      return JSON.parse(userData);
    } catch (error) {
      // Token is invalid or expired
      await clearAuth();
      return null;
    }
  } catch (error) {
    console.error('Error getting persisted auth:', error);
    return null;
  }
};

/**
 * Get the current ID token for the authenticated user
 * @param {boolean} forceRefresh - Whether to force token refresh
 * @returns {Promise<string|null>} - The ID token or null if not authenticated
 */
export const getAuthToken = async (forceRefresh = false) => {
  try {
    // Try to get from storage first
    let token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    
    // If no token in storage or refresh is forced, get a new one if user is logged in
    if ((!token || forceRefresh) && auth.currentUser) {
      token = await auth.currentUser.getIdToken(true);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}; 