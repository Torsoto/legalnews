import { db } from '../../config/firebase-admin.js';

/**
 * Sanitize a notification ID to be used as a Firestore document ID
 * Converts BGBl numbers to the format "bgbl-102025"
 * 
 * @param {string} id - The original notification ID (BGBl number)
 * @returns {string} - A sanitized document ID valid for Firestore
 */
function sanitizeDocId(id) {
  if (!id) return 'unknown';
  
  // Extract the BGBl number and year
  const match = id.match(/BGBl\.\s+(\w+)\s+Nr\.\s+(\d+)\/(\d+)/i);
  
  if (match) {
    const type = match[1].toLowerCase(); // I or II
    const number = match[2];
    const year = match[3];
    
    // Format as bgbl-i-10-2025 (for BGBl. I Nr. 10/2025)
    return `bgbl-${type}-${number}-${year}`;
  }
  
  // Alternative format handling for BGBLA_YEAR_TYPE_NUMBER
  const altMatch = id.match(/BGBLA_(\d+)_(\w+)_(\d+)/i);
  if (altMatch) {
    const year = altMatch[1];
    const type = altMatch[2].toLowerCase();
    const number = altMatch[3];
    
    return `bgbl-${type}-${number}-${year}`;
  }
  
  // Fallback sanitization for other formats
  return id.toLowerCase()
           .replace(/[^a-z0-9]/g, '-')
           .replace(/--+/g, '-')
           .replace(/^-|-$/g, '')
           .trim();
}

/**
 * Save notifications array to Firestore.
 *
 * @param {Array} notifications - The array of notification objects to store.
 * @returns {Promise<void>}
 */
export async function saveNotifications(notifications) {
  try {
    console.log(`Speichere ${notifications.length} Benachrichtigungen in Firestore...`);
    
    // Batch write for better performance and atomicity
    const batch = db.batch();
    
    // Loop through each notification
    notifications.forEach((notification) => {
      // Use the Bgblnummer as document ID since it should be unique
      const originalId = notification.id || notification.Bgblnummer;
      const docId = sanitizeDocId(originalId);
      const docRef = db.collection('notifications').doc(docId);
      
      // Add server timestamp and original ID for reference
      const notificationWithTimestamp = {
        ...notification,
        original_id: originalId, // Store the original unsanitized ID
        id: docId, // Replace with sanitized ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Convert complex objects to strings if needed
      if (notificationWithTimestamp.articles && notificationWithTimestamp.articles.length > 0) {
        notificationWithTimestamp.articles = notificationWithTimestamp.articles.map(article => {
          if (typeof article === 'object') return article;
          return JSON.parse(article);
        });
      }
      
      if (notificationWithTimestamp.changes && notificationWithTimestamp.changes.length > 0) {
        notificationWithTimestamp.changes = notificationWithTimestamp.changes.map(change => {
          if (typeof change === 'object') return change;
          return JSON.parse(change);
        });
      }
      
      // Add to batch - use set with merge to update existing documents
      batch.set(docRef, notificationWithTimestamp, { merge: true });
    });
    
    // Commit the batch
    await batch.commit();
    console.log(`✓ ${notifications.length} Benachrichtigungen erfolgreich in Firestore gespeichert.`);
  } catch (error) {
    console.error('Fehler beim Speichern in Firestore:', error);
    throw error;
  }
}

/**
 * Check if notification with same ID already exists in Firestore
 * 
 * @param {string} notificationId - The ID of the notification to check
 * @returns {Promise<boolean>} - True if notification exists, false otherwise
 */
export async function notificationExists(notificationId) {
  try {
    const docId = sanitizeDocId(notificationId);
    const docRef = db.collection('notifications').doc(docId);
    const doc = await docRef.get();
    return doc.exists;
  } catch (error) {
    console.error('Fehler beim Prüfen auf vorhandene Benachrichtigung:', error);
    return false;
  }
}

/**
 * Get a notification by ID from Firestore
 * 
 * @param {string} notificationId - The ID of the notification to get
 * @returns {Promise<Object|null>} - The notification object or null if not found
 */
export async function getNotification(notificationId) {
  try {
    const docId = sanitizeDocId(notificationId);
    const docRef = db.collection('notifications').doc(docId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      ...data,
      id: data.original_id || doc.id, // Return the original ID for consistency
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Benachrichtigung:', error);
    return null;
  }
}

/**
 * Get all notifications from Firestore
 * 
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Promise<Array>} - Array of notification objects
 */
export async function getAllNotifications(limit = 50) {
  try {
    const snapshot = await db.collection('notifications')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();
    
    if (snapshot.empty) {
      console.log('No notifications found in Firestore');
      return [];
    }
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: data.original_id || doc.id, // Return the original ID for consistency
      };
    });
  } catch (error) {
    console.error('Fehler beim Abrufen aller Benachrichtigungen:', error);
    return [];
  }
} 