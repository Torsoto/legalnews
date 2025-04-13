import express from "express";
import { getUserSubscriptions, removeUserSubscription } from "../controllers/userController.js";

const router = express.Router();

/**
 * @route   GET /api/user/subscriptions/:userId
 * @desc    Fetch user subscriptions
 * @access  Public
 */
router.get("/subscriptions/:userId", getUserSubscriptions); 

/**
 * @route   DELETE /api/user/subscriptions/:userId/:category
 * @desc    Remove a specific subscription category for a user
 * @access  Public
 */
router.delete("/subscriptions/:userId/:category", removeUserSubscription);

export default router; 