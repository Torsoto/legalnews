import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Fetch latest legal notifications from RIS API
 * @access  Public
 */
router.get('/notifications', notificationController.getLatestNotifications);

/**
 * @route   GET /api/stored-notifications
 * @desc    Retrieve stored notifications from Firestore
 * @access  Public
 */
router.get('/stored-notifications', notificationController.getStoredNotifications);

/**
 * @route   GET /api/test
 * @desc    Test API connectivity
 * @access  Public
 */
router.get('/test', notificationController.testEndpoint);

export default router; 