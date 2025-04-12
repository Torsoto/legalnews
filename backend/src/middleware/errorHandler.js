/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

/**
 * Custom error class with status code
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
} 