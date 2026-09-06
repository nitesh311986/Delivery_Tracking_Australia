import type { NextFunction, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role, ShiftStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import type { CustomRequest } from '../types/express.js';

function adminGate(req: CustomRequest, res: Response<unknown>): boolean {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized', details: null },
    });
    return false;
  }
  if (req.user.role !== Role.ADMIN) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Forbidden', details: null },
    });
    return false;
  }
  return true;
}

const nullableString = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : null));

const createSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('A valid email is required'),
  temporaryPassword: z.string().min(6, 'Temporary password must be at least 6 characters'),
  rego: nullableString,
  subcontractorName: nullableString,
  businessName: nullableString,
  yardLocation: nullableString,
});

const updateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('A valid email is required').optional(),
  rego: nullableString,
  subcontractorName: nullableString,
  businessName: nullableString,
  yardLocation: nullableString,
  isActive: z.boolean().optional(),
});

const paramsSchema = z.object({
  id: z.string().uuid(),
});

type AdminDriverListItem = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  rego: string | null;
  subcontractorName: string | null;
  businessName: string | null;
  yardLocation: string | null;
  totalShifts: number;
};

function toListItem(user: {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  rego: string | null;
  subcontractorName: string | null;
  businessName: string | null;
  yardLocation: string | null;
  _count?: { runsheets?: number } | null;
}): AdminDriverListItem {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    isActive: user.isActive,
    rego: user.rego,
    subcontractorName: user.subcontractorName,
    businessName: user.businessName,
    yardLocation: user.yardLocation,
    totalShifts: user._count?.runsheets ?? 0,
  };
}

const countSelect = {
  _count: {
    select: {
      runsheets: {
        where: { status: ShiftStatus.COMPLETED },
      },
    },
  },
};

export const listDrivers = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const users = await prisma.user.findMany({
      where: { role: 'DRIVER' },
      orderBy: { fullName: 'asc' },
      include: countSelect,
    });

    res.status(200).json(users.map(toListItem));
  } catch (error) {
    next(error);
  }
};

export const createDriver = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const data = createSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'A driver with this email already exists', details: null },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(data.temporaryPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash,
        role: 'DRIVER',
        isActive: true,
        rego: data.rego,
        subcontractorName: data.subcontractorName,
        businessName: data.businessName ?? 'Velocity Taxi Trucks',
        yardLocation: data.yardLocation,
      },
      include: countSelect,
    });

    res.status(201).json(toListItem(user));
  } catch (error) {
    next(error);
  }
};

export const updateDriver = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const { id } = paramsSchema.parse(req.params);
    const data = updateSchema.parse(req.body);

    const driver = await prisma.user.findUnique({ where: { id } });
    if (!driver) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Driver not found', details: null },
      });
      return;
    }

    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existing) {
        res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'A driver with this email already exists', details: null },
        });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        email: data.email,
        rego: data.rego,
        subcontractorName: data.subcontractorName,
        businessName: data.businessName,
        yardLocation: data.yardLocation,
        isActive: data.isActive,
      },
      include: countSelect,
    });

    res.status(200).json(toListItem(updated));
  } catch (error) {
    next(error);
  }
};

export const deactivateDriver = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const { id } = paramsSchema.parse(req.params);

    const driver = await prisma.user.findUnique({ where: { id } });
    if (!driver) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Driver not found', details: null },
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: countSelect,
    });

    res.status(200).json(toListItem(updated));
  } catch (error) {
    next(error);
  }
};
