import AsyncStorage from '@react-native-async-storage/async-storage';

export const BOOKMARKS_STORAGE_KEY = '@LegalNews:bookmarks';

/**
 * Get all bookmarked notifications
 * @returns {Promise<Object>} Object with notification IDs as keys and true as values
 */
export const getBookmarks = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    return {};
  }
};

/**
 * Get all bookmarked notification data with full content
 * @param {Array} allNotifications - All notifications to filter
 * @returns {Promise<Array>} Array of bookmarked notification objects
 */
export const getBookmarkedNotifications = async (allNotifications = []) => {
  try {
    const bookmarks = await getBookmarks();
    return allNotifications.filter(notification => bookmarks[notification.id]);
  } catch (error) {
    console.error('Error getting bookmarked notifications:', error);
    return [];
  }
};

/**
 * Toggle a bookmark status for a notification
 * @param {string} notificationId - ID of the notification to toggle
 * @returns {Promise<boolean>} New bookmark status
 */
export const toggleBookmark = async (notificationId) => {
  try {
    const bookmarks = await getBookmarks();
    
    // Toggle the bookmark status
    const newBookmarks = {
      ...bookmarks,
      [notificationId]: !bookmarks[notificationId]
    };
    
    // If the value is false, remove the key entirely to keep storage minimal
    if (!newBookmarks[notificationId]) {
      delete newBookmarks[notificationId];
    }
    
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(newBookmarks));
    return !!newBookmarks[notificationId];
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return false;
  }
};

/**
 * Check if a notification is bookmarked
 * @param {string} notificationId - ID of the notification to check
 * @returns {Promise<boolean>} True if notification is bookmarked
 */
export const isBookmarked = async (notificationId) => {
  try {
    const bookmarks = await getBookmarks();
    return !!bookmarks[notificationId];
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};

/**
 * Remove a bookmark
 * @param {string} notificationId - ID of the notification to unbookmark
 * @returns {Promise<void>}
 */
export const removeBookmark = async (notificationId) => {
  try {
    const bookmarks = await getBookmarks();
    delete bookmarks[notificationId];
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Error removing bookmark:', error);
  }
};

/**
 * Clear all bookmarks
 * @returns {Promise<void>}
 */
export const clearAllBookmarks = async () => {
  try {
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify({}));
  } catch (error) {
    console.error('Error clearing bookmarks:', error);
  }
}; 