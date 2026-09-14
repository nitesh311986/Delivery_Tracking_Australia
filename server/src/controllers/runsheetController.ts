import type { NextFunction, Response } from 'express';
import { Prisma, ShiftStatus, Role } from '@prisma/client';
import { prisma, runsheetInclude } from '../lib/prisma.js';
import type { CustomRequest } from '../types/express.js';
import { computeBreakEndTime, computeTravelTime } from '../utils/timeCalculations.js';
import {
  createRunsheetSchema,
  createLegSchema,
  completeRunsheetSchema,
  runsheetQuerySchema,
  updateRunsheetSchema,
  type CreateRunsheetInput,
  type CreateLegInput,
  type CompleteRunsheetInput,
  type UpdateRunsheetInput,
  type RunsheetQueryInput,
} from '../schemas/runsheet.schema.js';

function forbidden(res: Response<unknown>): void {
  res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource', details: null },
  });
}

function notFound(res: Response<unknown>): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Runsheet not found', details: null },
  });
}

function assertUser(req: CustomRequest): { id: string; role: Role } {
  if (!req.user) {
    throw new Error('Unauthorized');
  }
  return req.user;
}

export const getRunsheets = async (req: CustomRequest, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    const user = assertUser(req);
    const query: RunsheetQueryInput = runsheetQuerySchema.parse(req.query);

    const where: Prisma.RunsheetWhereInput = {};
    if (user.role !== Role.ADMIN) {
      where.driverId = user.id;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.startDate || query.endDate) {
      where.shiftDate = {};
      if (query.startDate) where.shiftDate.gte = query.startDate;
      if (query.endDate) where.shiftDate.lte = query.endDate;
    }

    const runsheets = await prisma.runsheet.findMany({
      where,
      include: runsheetInclude,
      orderBy: { shiftDate: 'desc' },
    });

    res.status(200).json(runsheets);
  } catch (error) {
    next(error);
  }
};

export const getRunsheetById = async (req: CustomRequest, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    const user = assertUser(req);
    const { id } = req.params;

    const runsheet = await prisma.runsheet.findUnique({
      where: { id },
      include: runsheetInclude,
    });

    if (!runsheet) {
      notFound(res);
      return;
    }

    if (runsheet.driverId !== user.id && user.role !== Role.ADMIN) {
      forbidden(res);
      return;
    }

    res.status(200).json(runsheet);
  } catch (error) {
    next(error);
  }
};

export const createRunsheet = async (req: CustomRequest, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized', details: null },
      });
      return;
    }

    const data: CreateRunsheetInput = createRunsheetSchema.parse(req.body);

    const runsheet = await prisma.runsheet.create({
      data: {
        driverId: req.user.id,
        shiftDate: data.shiftDate,
        odometerStart: new Prisma.Decimal(data.odometerStart),
        startTime: data.startTime,
        originYard: data.yardLocation,
        yardLocation: data.yardLocation,
        subcontractorName: data.subcontractorName?.trim() || null,
        rego: data.rego?.trim() || null,
        businessName: data.businessName?.trim() || null,
      },
    });

    res.status(201).json(runsheet);
  } catch (error) {
    next(error);
  }
};

export const updateRunsheet = async (req: CustomRequest, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    const user = assertUser(req);
    const { id } = req.params;
    const data: UpdateRunsheetInput = updateRunsheetSchema.parse(req.body);

    const existing = await prisma.runsheet.findUnique({ where: { id } });
    if (!existing) {
      notFound(res);
      return;
    }

    if (existing.driverId !== user.id && user.role !== Role.ADMIN) {
      forbidden(res);
      return;
    }

    const updateData: Prisma.RunsheetUpdateInput = {};
    if (data.shiftDate !== undefined) updateData.shiftDate = data.shiftDate;
    if (data.odometerStart !== undefined) updateData.odometerStart = new Prisma.Decimal(data.odometerStart);
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.yardLocation !== undefined) {
      updateData.originYard = data.yardLocation;
      updateData.yardLocation = data.yardLocation;
    }
    if (data.subcontractorName !== undefined) updateData.subcontractorName = data.subcontractorName?.trim() || null;
    if (data.rego !== undefined) updateData.rego = data.rego?.trim() || null;
    if (data.businessName !== undefined) updateData.businessName = data.businessName?.trim() || null;

    if (data.odometerStart !== undefined && existing.odometerFinish !== null && existing.odometerFinish !== undefined) {
      const start = new Prisma.Decimal(data.odometerStart);
      const totalDistance = existing.odometerFinish.minus(start);
      updateData.totalDistance = totalDistance;
    }

    const updated = await prisma.runsheet.update({
      where: { id },
      data: updateData,
      include: runsheetInclude,
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteRunsheet = async (req: CustomRequest, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    const user = assertUser(req);
    const { id } = req.params;

    const existing = await prisma.runsheet.findUnique({ where: { id } });
    if (!existing) {
      notFound(res);
      return;
    }

    if (existing.driverId !== user.id && user.role !== Role.ADMIN) {
      forbidden(res);
      return;
    }

    await prisma.runsheet.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addLeg = async (req: CustomRequest, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    const user = assertUser(req);
    const { id } = req.params;
    const data: CreateLegInput = createLegSchema.parse(req.body);

    const runsheet = await prisma.runsheet.findUnique({ where: { id } });
    if (!runsheet) {
      notFound(res);
      return;
    }

    if (runsheet.driverId !== user.id && user.role !== Role.ADMIN) {
      forbidden(res);
      return;
    }

    const leg = await prisma.runsheetLeg.create({
      data: {
        runsheetId: id,
        legOrder: data.legOrder,
        type: data.type,
        collectionCompany: data.collectionCompany?.trim() || null,
        collectionSuburb: data.collectionSuburb?.trim() || null,
        deliveryCompany: data.deliveryCompany?.trim() || null,
        deliverySuburb: data.deliverySuburb?.trim() || null,
        arrivalTime: data.arrivalTime,
        departureTime: data.departureTime,
        authorisedPerson: data.authorisedPerson ?? null,
        itemCount: data.itemCount,
        itemDescription: data.itemDescription?.trim() || null,
        notes: data.notes?.trim() || null,
        tollUsed: data.tollUsed,
        tollAmount: new Prisma.Decimal(data.tollAmount),
        tollAuthorizedBy: data.tollAuthorizedBy?.trim() || null,
      },
    });

    res.status(201).json(leg);
  } catch (error) {
    next(error);
  }
};

export const completeRunsheet = async (req: CustomRequest, res: Response<unknown>, next: NextFunction): Promise<void> => {
  try {
    const user = assertUser(req);
    const { id } = req.params;
    const data: CompleteRunsheetInput = completeRunsheetSchema.parse(req.body);

    const runsheet = await prisma.runsheet.findUnique({ where: { id } });
    if (!runsheet) {
      notFound(res);
      return;
    }

    if (runsheet.driverId !== user.id && user.role !== Role.ADMIN) {
      forbidden(res);
      return;
    }

    const finish = new Prisma.Decimal(data.odometerFinish);
    const totalDistance = finish.minus(runsheet.odometerStart);

    const breakEndTime = (start: string | undefined, duration: number | undefined) =>
      start && duration ? computeBreakEndTime(start, duration) : null;

    const firstArrivalTime = data.firstArrivalTime || null;
    const travelTimeDuration =
      data.travelTimeDuration ||
      (firstArrivalTime && runsheet.startTime ? computeTravelTime(runsheet.startTime, firstArrivalTime) : null);

    const completed = await prisma.runsheet.update({
      where: { id },
      data: {
        odometerFinish: finish,
        endTime: data.endTime,
        depotEndLocation: data.depotEndLocation,

        break1StartTime: data.break1StartTime || null,
        break1Duration: data.break1Duration ?? null,
        break1EndTime: data.break1EndTime || breakEndTime(data.break1StartTime, data.break1Duration),
        break2StartTime: data.break2StartTime || null,
        break2Duration: data.break2Duration ?? null,
        break2EndTime: data.break2EndTime || breakEndTime(data.break2StartTime, data.break2Duration),
        break3StartTime: data.break3StartTime || null,
        break3Duration: data.break3Duration ?? null,
        break3EndTime: data.break3EndTime || breakEndTime(data.break3StartTime, data.break3Duration),
        break4StartTime: data.break4StartTime || null,
        break4Duration: data.break4Duration ?? null,
        break4EndTime: data.break4EndTime || breakEndTime(data.break4StartTime, data.break4Duration),

        firstArrivalTime,
        travelTimeDuration,
        finalDepartTime: data.finalDepartTime || null,
        lastEndTime: data.lastEndTime || null,
        returnTime: data.returnTime || data.lastEndTime || null,

        comments: data.comments ?? null,
        signatureUrl: data.signatureUrl,
        totalDistance,
        status: ShiftStatus.COMPLETED,
        originYard: data.yardLocation,
        yardLocation: data.yardLocation,
        subcontractorName: data.subcontractorName?.trim() || null,
        rego: data.rego?.trim() || null,
        businessName: data.businessName?.trim() || null,
      },
      include: runsheetInclude,
    });

    res.status(200).json(completed);
  } catch (error) {
    next(error);
  }
};
