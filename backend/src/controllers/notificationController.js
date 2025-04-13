import { ApiError } from '../middleware/errorHandler.js';
import * as notificationService from '../service/notificationService.js';

/**
 * Fetch and process the latest legal notifications
 */
export const getLatestNotifications = async (req, res, next) => {
  try {
    console.log("Processing request for latest notifications");

    const result = await notificationService.fetchLatestNotifications();

    // Send response
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch and process the latest state law notifications
 */
export const getStateNotifications = async (req, res, next) => {
  try {
    console.log("Processing request for latest state notifications");

    const result = await notificationService.fetchStateNotifications();

    // Send response
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get stored notifications from the database
 */
export const getStoredNotifications = async (req, res, next) => {
  try {
    console.log("Getting stored notifications");
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const notifications = await notificationService.getStoredNotifications(limit);
    
    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Test endpoint for health checks
 */
export const testEndpoint = (req, res) => {
  res.json({
    success: true,
    message: "Notification service is working",
    timestamp: new Date().toISOString()
  });
}; 