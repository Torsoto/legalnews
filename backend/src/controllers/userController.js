import { db } from "../../config/firebase-admin.js";

/**
 * Get all subscriptions for a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserSubscriptions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
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
    
    return res.status(200).json({
      success: true,
      subscriptions: userSubscriptions
    });
    
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return res.status(500).json({ 
      error: "Failed to fetch user subscriptions",
      message: error.message 
    });
  }
}; 