import { db } from "../../config/firebase-admin.js";

/**
 * Get all subscriptions for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of user subscriptions
 */
export async function getUserSubscriptions(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  // Get list of all categories from Firestore
  const categoriesSnapshot = await db.collection("subscriptions").get();
  
  const userSubscriptions = [];
  
  // Check each category if the user is subscribed
  for (const categoryDoc of categoriesSnapshot.docs) {
    const categoryName = categoryDoc.id;
    
    // Check if user exists in this category
    const userRef = db.collection("subscriptions")
                      .doc(categoryName)
                      .collection("users")
                      .doc(userId);
    
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      userSubscriptions.push({
        category: categoryName,
        // Include subscription types but not the updatedAt timestamp
        types: {
          BR: userDoc.data().BR || false,
          EU: userDoc.data().EU || false,
          LR: userDoc.data().LR || false
        }
      });
    }
  }
  
  return userSubscriptions;
}

/**
 * Remove a subscription category for a specific user
 * @param {string} userId - The user ID
 * @param {string} category - The category to remove
 * @returns {Promise<Object>} - Result of the operation
 */
export async function removeUserSubscription(userId, category) {
  if (!userId || !category) {
    throw new Error("User ID and category are required");
  }
  
  // Reference to the user document in the specific category collection
  const userRef = db.collection("subscriptions")
                    .doc(category)
                    .collection("users")
                    .doc(userId);
  
  // Check if the document exists
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new Error("Subscription not found");
  }
  
  // Delete the user's subscription to this category
  await userRef.delete();
  
  return {
    success: true,
    message: `Subscription to ${category} removed successfully`
  };
} 