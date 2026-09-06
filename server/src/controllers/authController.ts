import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import type { CustomRequest } from '../types/express.js';

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.warn('JWT_SECRET is not set; using a development fallback. Set JWT_SECRET in production.');
    return 'dev-secret-change-in-production';
  }
  return secret;
})();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginInput = z.infer<typeof loginSchema>;

function publicUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  businessName: string | null;
  subcontractorName: string | null;
  rego: string | null;
  yardLocation: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    businessName: user.businessName,
    subcontractorName: user.subcontractorName,
    rego: user.rego,
    yardLocation: user.yardLocation,
  };
}

export const login = async (req: Request, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    const data: LoginInput = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', details: null },
      });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', details: null },
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: CustomRequest, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized', details: null },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        businessName: true,
        subcontractorName: true,
        rego: true,
        yardLocation: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found', details: null },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};
