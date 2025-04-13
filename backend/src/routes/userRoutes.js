import express from "express";
import { getUserSubscriptions, removeUserSubscription } from "../controllers/userController.js";
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/user/subscriptions/:userId
 * @desc    Fetch user subscriptions
 * @access  Protected (requires Firebase authentication)
 */
router.get("/subscriptions/:userId", verifyFirebaseToken, getUserSubscriptions); 

/**
 * @route   DELETE /api/user/subscriptions/:userId/:category
 * @desc    Remove a specific subscription category for a user
 * @access  Protected (requires Firebase authentication)
 */
router.delete("/subscriptions/:userId/:category", verifyFirebaseToken, removeUserSubscription);

export default router; 