import AsyncStorage from '@react-native-async-storage/async-storage';

export const ALL_NOTIFICATIONS_STORAGE_KEY = '@LegalNews:allNotifications';
export const DELETED_NOTIFICATIONS_STORAGE_KEY = '@LegalNews:deletedNotifications';
export const READ_NOTIFICATIONS_STORAGE_KEY = '@LegalNews:readNotifications';

/**
 * Get all notifications stored locally
 * @returns {Promise<Array>} Array of notification objects
 */
export const getAllNotifications = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(ALL_NOTIFICATIONS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
};

/**
 * Save all notifications locally
 * @param {Array} notifications - All notifications to save
 * @returns {Promise<void>}
 */
export const saveAllNotifications = async (notifications) => {
  try {
    await AsyncStorage.setItem(ALL_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
};

/**
 * Get IDs of deleted notifications
 * @returns {Promise<Object>} Object with notification IDs as keys and true as values
 */
export const getDeletedNotifications = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(DELETED_NOTIFICATIONS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Error loading deleted notifications:', error);
    return {};
  }
};

/**
 * Delete a notification (mark as deleted)
 * @param {string} notificationId - ID of the notification to delete
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const deletedNotifications = await getDeletedNotifications();
    deletedNotifications[notificationId] = true;
    await AsyncStorage.setItem(DELETED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(deletedNotifications));
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

/**
 * Restore a deleted notification
 * @param {string} notificationId - ID of the notification to restore
 * @returns {Promise<void>}
 */
export const restoreNotification = async (notificationId) => {
  try {
    const deletedNotifications = await getDeletedNotifications();
    delete deletedNotifications[notificationId];
    await AsyncStorage.setItem(DELETED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(deletedNotifications));
  } catch (error) {
    console.error('Error restoring notification:', error);
  }
};

/**
 * Get IDs of read notifications
 * @returns {Promise<Object>} Object with notification IDs as keys and true as values
 */
export const getReadNotifications = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Error loading read notifications:', error);
    return {};
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification to mark as read
 * @returns {Promise<void>}
 */
export const markAsRead = async (notificationId) => {
  try {
    const readNotifications = await getReadNotifications();
    readNotifications[notificationId] = true;
    await AsyncStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(readNotifications));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Mark all notifications as read
 * @param {Array} notificationIds - Array of notification IDs to mark as read
 * @returns {Promise<void>}
 */
export const markAllAsRead = async (notificationIds = []) => {
  try {
    const readNotifications = await getReadNotifications();
    
    notificationIds.forEach(id => {
      readNotifications[id] = true;
    });
    
    await AsyncStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(readNotifications));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

/**
 * Clear all notification data (mostly for testing/debugging)
 * @returns {Promise<void>}
 */
export const clearAllNotificationData = async () => {
  try {
    await AsyncStorage.multiRemove([
      ALL_NOTIFICATIONS_STORAGE_KEY, 
      DELETED_NOTIFICATIONS_STORAGE_KEY,
      READ_NOTIFICATIONS_STORAGE_KEY
    ]);
  } catch (error) {
    console.error('Error clearing notification data:', error);
  }
}; 