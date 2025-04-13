import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { preventCache } from "./middleware/cacheControl.js";
import { errorHandler } from "./middleware/errorHandler.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Apply middleware
app.use(cors());
app.use(express.json());
app.use(preventCache);

// Apply routes
app.use("/api", notificationRoutes);
app.use("/api/user", userRoutes);

// Apply error handler middleware (must be last)
app.use(errorHandler);

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Available endpoints:`);
  console.log(`- GET /api/notifications - Fetch latest legal notifications from Austrian RIS`);
  console.log(`- GET /api/state-notifications - Fetch latest state legal notifications from Austrian RIS`);
  console.log(`- GET /api/stored-notifications - Retrieve stored notifications from Firestore`);
  console.log(`- GET /api/user/subscriptions/:userId - Get user subscriptions`);
  console.log(`- GET /api/test - Test API connectivity`);

});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Gracefully shutdown after logging the error
  process.exit(1);
});
