import type { NextFunction, Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma, runsheetInclude } from '../lib/prisma.js';
import { fetchRunsheets, exportRunsheetsToCsv, generateRunsheetPdf, getKpiData } from '../services/reportService.js';
import { sendRunsheetPdf } from '../services/mailService.js';
import type { CustomRequest } from '../types/express.js';

const isoDate = (input: unknown): Date | undefined => {
  if (!input) return undefined;
  const parsed = new Date(String(input));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const kpiQuerySchema = z.object({
  driverId: z.string().uuid().optional(),
  start: z.string().optional().transform(isoDate),
  end: z.string().optional().transform(isoDate),
  company: z.string().optional(),
});

const runsheetQuerySchema = z.object({
  driverId: z.string().uuid().optional(),
  start: z.string().optional().transform(isoDate),
  end: z.string().optional().transform(isoDate),
  company: z.string().optional(),
  status: z.enum(['DRAFT', 'COMPLETED']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(25),
  sortBy: z.enum(['shiftDate', 'createdAt', 'status']).default('shiftDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const csvQuerySchema = runsheetQuerySchema.omit({ page: true, limit: true });

const pdfParamsSchema = z.object({
  id: z.string().uuid(),
});

const dispatchSchema = z.object({
  runsheetId: z.string().uuid(),
  to: z.string().email(),
});

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

export const getDrivers = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const drivers = await prisma.user.findMany({
      where: { role: 'DRIVER' },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });
    res.status(200).json(drivers);
  } catch (error) {
    next(error);
  }
};

export const getCompanies = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const [collectionRows, deliveryRows] = await Promise.all([
      prisma.runsheetLeg.findMany({
        where: { collectionCompany: { not: null } },
        distinct: ['collectionCompany'],
        select: { collectionCompany: true },
      }),
      prisma.runsheetLeg.findMany({
        where: { deliveryCompany: { not: null } },
        distinct: ['deliveryCompany'],
        select: { deliveryCompany: true },
      }),
    ]);

    const companies = Array.from(
      new Set([
        ...collectionRows.map((r) => r.collectionCompany),
        ...deliveryRows.map((r) => r.deliveryCompany),
      ])
    )
      .filter((c): c is string => Boolean(c))
      .sort((a, b) => a.localeCompare(b));

    res.status(200).json(companies);
  } catch (error) {
    next(error);
  }
};

export const getKpis = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const query = kpiQuerySchema.parse(req.query);
    const kpis = await getKpiData(query);
    res.status(200).json({
      period: {
        start: query.start ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: query.end ?? new Date(),
      },
      ...kpis,
    });
  } catch (error) {
    next(error);
  }
};

export const getRunsheets = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const query = runsheetQuerySchema.parse(req.query);
    const result = await fetchRunsheets(query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const exportCsv = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const query = csvQuerySchema.parse(req.query);
    const { items } = await fetchRunsheets({ ...query, page: 1, limit: 10000 });
    const csv = exportRunsheetsToCsv(items);
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="runsheets.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

export const getRunsheetPdf = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const { id } = pdfParamsSchema.parse(req.params);

    const runsheet = await prisma.runsheet.findUnique({
      where: { id },
      include: runsheetInclude,
    });

    if (!runsheet) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Runsheet not found', details: null },
      });
      return;
    }

    // Set a strict 15-second timeout to prevent indefinite socket hangs
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timed out after 15s')), 15000)
    );

    const pdfBuffer = await Promise.race([
      generateRunsheetPdf(runsheet),
      timeoutPromise,
    ]);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generator returned an empty buffer');
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="runsheet-${id}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
      'Cache-Control': 'no-cache',
    });

    res.status(200).end(pdfBuffer);
  } catch (error) {
    if (res.headersSent) {
      return next(error);
    }
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid runsheet ID parameter', details: error.issues },
      });
      return;
    }
    next(error);
  }
};

export const dispatchReport = async (
  req: CustomRequest,
  res: Response<unknown>,
  next: NextFunction
): Promise<void> => {
  if (!adminGate(req, res)) return;

  try {
    const data = dispatchSchema.parse(req.body);
    const runsheet = await prisma.runsheet.findUnique({
      where: { id: data.runsheetId },
      include: runsheetInclude,
    });

    if (!runsheet) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Runsheet not found', details: null },
      });
      return;
    }

    const pdf = await generateRunsheetPdf(runsheet);
    const { emailId } = await sendRunsheetPdf({
      to: data.to,
      pdfBuffer: pdf,
      driverName: runsheet.driver?.fullName ?? undefined,
      runsheetDate: new Date(runsheet.shiftDate).toISOString().split('T')[0],
    });

    res.status(200).json({
      success: true,
      emailId,
    });
  } catch (error) {
    next(error);
  }
};
