import rateLimit from 'express-rate-limit';

// Rate limiter for admin login attempts
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 login attempts per 15 minutes
  message: {
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful logins from counting against the limit
  skipSuccessfulRequests: false,
});

// Rate limiter for 2FA setup
export const twoFactorSetupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 setup attempts per hour
  message: {
    message: 'Too many 2FA setup attempts. Please try again later.'
  },
});

// General admin API rate limiter
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per 15 minutes
  message: {
    message: 'Too many requests from this IP. Please try again later.'
  },
});