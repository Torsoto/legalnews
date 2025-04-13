import * as userService from '../service/userService.js';

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
    
    const userSubscriptions = await userService.getUserSubscriptions(userId);
    
    return res.status(200).json({
      success: true,
      subscriptions: userSubscriptions
    });
    
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return res.status(error.message === "User ID is required" ? 400 : 500).json({ 
      error: "Failed to fetch user subscriptions",
      message: error.message 
    });
  }
};

/**
 * Remove a subscription category for a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeUserSubscription = async (req, res) => {
  try {
    const { userId, category } = req.params;
    
    if (!userId || !category) {
      return res.status(400).json({ error: "User ID and category are required" });
    }
    
    const result = await userService.removeUserSubscription(userId, category);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error("Error removing user subscription:", error);
    
    if (error.message === "Subscription not found") {
      return res.status(404).json({ 
        success: false,
        message: "Subscription not found" 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: "Failed to remove subscription",
      message: error.message 
    });
  }
}; 