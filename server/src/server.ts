// import 'dotenv/config';
// import express, { type Application, type Request, type Response, type NextFunction } from 'express';
// import cors from 'cors';
// import { ZodError } from 'zod';

// import { httpLogger } from './middleware/httpLogger.js';
// import { logger } from './utils/logger.js';
// import runsheetRoutes from './routes/runsheetRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';
// import authRoutes from './routes/authRoutes.js';

// const app: Application = express();

// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:5174'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));
// app.use(express.json({ limit: '10mb' }));
// app.use(httpLogger);

// app.get('/health', (_req: Request, res: Response): void => {
//   res.status(200).json({ success: true, data: { status: 'ok' } });
// });

// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/runsheets', runsheetRoutes);
// app.use('/api/v1/admin', adminRoutes);

// app.use((_req: Request, res: Response, _next: NextFunction): void => {
//   res.status(404).json({
//     success: false,
//     error: {
//       code: 'NOT_FOUND',
//       message: 'The requested resource could not be found',
//       details: null,
//     },
//   });
// });

// app.use((err: unknown, req: Request, res: Response, _next: NextFunction): void => {
//   if (err instanceof ZodError) {
//     const issues = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
//     logger.warn('Validation error', { issues, path: req.path });
//     res.status(400).json({
//       success: false,
//       error: {
//         code: 'VALIDATION_ERROR',
//         message: 'Request validation failed',
//         details: issues,
//       },
//     });
//     return;
//   }

//   if (err instanceof SyntaxError && 'body' in err) {
//     logger.warn('Malformed JSON body', { path: req.path });
//     res.status(400).json({
//       success: false,
//       error: {
//         code: 'BAD_REQUEST',
//         message: 'Malformed JSON body',
//         details: null,
//       },
//     });
//     return;
//   }

//   const message = err instanceof Error ? err.message : 'Internal server error';
//   const stack = err instanceof Error ? err.stack : undefined;

//   logger.error('Unhandled error', { error: message, stack, path: req.path });
//   res.status(500).json({
//     success: false,
//     error: {
//       code: 'INTERNAL_ERROR',
//       message,
//       details: null,
//     },
//   });
// });

// const PORT = Number(process.env.PORT) || 5000;
// app.listen(PORT, () => {
//   logger.info(`Server running on port ${PORT}`);
// });


import 'dotenv/config';
import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';

import { httpLogger } from './middleware/httpLogger.js';
import { logger } from './utils/logger.js';
import runsheetRoutes from './routes/runsheetRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app: Application = express();

// Allowed origins: local dev + production Vercel frontend + env override
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://delivery-tracking-australia.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, Postman, or requests matching allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(httpLogger);

app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/runsheets', runsheetRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use((_req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource could not be found',
      details: null,
    },
  });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    logger.warn('Validation error', { issues, path: req.path });
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: issues,
      },
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Malformed JSON body', { path: req.path });
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON body',
        details: null,
      },
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error('Unhandled error', { error: message, stack, path: req.path });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      details: null,
    },
  });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});