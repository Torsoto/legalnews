/**
 * Middleware to prevent caching of API responses
 */
export const preventCache = (req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
}; 