// import type { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import type { AuthenticatedUser } from '../types/express.js';
// import { logger } from '../utils/logger.js';

// const JWT_SECRET = ((): string => {
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     logger.warn('JWT_SECRET is not set; using a development fallback. Set JWT_SECRET in production.');
//     return 'dev-secret-change-in-production';
//   }
//   return secret;
// })();

// export const authGuard = (req: Request, res: Response<unknown>, next: NextFunction): void => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     res.status(401).json({
//       success: false,
//       error: { code: 'UNAUTHORIZED', message: 'Missing authorization header', details: null },
//     });
//     return;
//   }

//   const parts = authHeader.split(' ');
//   if (parts.length !== 2 || parts[0] !== 'Bearer') {
//     res.status(401).json({
//       success: false,
//       error: { code: 'UNAUTHORIZED', message: 'Invalid authorization header format', details: null },
//     });
//     return;
//   }

//   const token = parts[1];

//   try {
//     const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
//     req.user = payload;
//     next();
//   } catch {
//     res.status(401).json({
//       success: false,
//       error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token', details: null },
//     });
//   }
// };


import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser } from '../types/express.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = ((): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.warn('JWT_SECRET is not set; using a development fallback. Set JWT_SECRET in production.');
    return 'dev-secret-change-in-production';
  }
  return secret;
})();

export const authGuard = (req: Request, res: Response<unknown>, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;

  let token: string | undefined;

  // 1. Check Authorization Header (Bearer token)
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    } else {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid authorization header format', details: null },
      });
      return;
    }
  } 
  // 2. Fallback to ?token= query parameter (for direct browser/PDF downloads)
  else if (queryToken) {
    token = queryToken;
  }

  // If no token was provided in either location
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing authorization header or token query parameter', details: null },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token', details: null },
    });
  }
};