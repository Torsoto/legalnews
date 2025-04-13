import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Fetch latest legal notifications from RIS API
 * @access  Protected (requires Firebase authentication)
 */
router.get('/notifications', verifyFirebaseToken, notificationController.getLatestNotifications);

/**
 * @route   GET /api/state-notifications
 * @desc    Fetch latest state legal notifications from RIS API
 * @access  Protected (requires Firebase authentication)
 */
router.get('/state-notifications', verifyFirebaseToken, notificationController.getStateNotifications);

/**
 * @route   GET /api/stored-notifications
 * @desc    Retrieve stored notifications from Firestore
 * @access  Protected (requires Firebase authentication)
 */
router.get('/stored-notifications', verifyFirebaseToken, notificationController.getStoredNotifications);

/**
 * @route   GET /api/test
 * @desc    Test API connectivity
 * @access  Public
 */
router.get('/test', notificationController.testEndpoint);

export default router; 