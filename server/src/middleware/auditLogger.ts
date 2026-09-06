import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import type { CustomRequest } from '../types/express.js';

export const recordAudit = (action: string, resource: string) => {
  return (req: CustomRequest, res: Response<unknown>, next: NextFunction): void => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.id || null,
              action,
              resource,
              payload: (req.body ?? Prisma.JsonNull) as Prisma.InputJsonValue,
              ipAddress: req.ip || req.socket.remoteAddress || null,
            },
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.error('Failed to persist audit log', { error: errorMessage });
        }
      }
    });
    next();
  };
};