import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  max: process.env.NODE_ENV === 'test' ? 10000 : 10000,
  message: 'You have exceeded the 100 requests in 24 hrs limit!', 
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicPostRouteRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1h
    max: 5,
    message: 'You have exceeded the 100 requests in 24 hrs limit!', 
    standardHeaders: true,
    legacyHeaders: false,
});

export const publicGetRouteRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: 'You have exceeded the 100 requests in 24 hrs limit!', 
    standardHeaders: true,
    legacyHeaders: false,
});
