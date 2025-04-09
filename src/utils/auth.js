import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../config/firebase';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

export const persistAuth = async (user) => {
  try {
    // Store the user's ID token
    const token = await user.getIdToken();
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

export const getPersistedAuth = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
    
    if (!token || !userData) {
      return null;
    }
    
    // Verify the token is still valid
    try {
      await auth.currentUser?.getIdToken(true);
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