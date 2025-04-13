import express from "express";
import { getUserSubscriptions } from "../controllers/userController.js";

const router = express.Router();

/**
 * @route   GET /api/user/subscriptions/:userId
 * @desc    Fetch user subscriptions
 * @access  Public
 */
router.get("/subscriptions/:userId", getUserSubscriptions); 

export default router; 