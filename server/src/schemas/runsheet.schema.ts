import { z } from 'zod';
import { LegType } from '@prisma/client';

export const createRunsheetSchema = z.object({
  shiftDate: z.coerce.date(),
  odometerStart: z.number().min(0),
  startTime: z.string().min(1),
  yardLocation: z.string().min(1),
  subcontractorName: z.string().optional(),
  rego: z.string().optional(),
  businessName: z.string().optional(),
});

export const createLegSchema = z
  .object({
    legOrder: z.number().int().min(0),
    type: z.nativeEnum(LegType),
    collectionCompany: z.string().optional(),
    collectionSuburb: z.string().optional(),
    deliveryCompany: z.string().optional(),
    deliverySuburb: z.string().optional(),
    arrivalTime: z.string().min(1),
    departureTime: z.string().min(1),
    authorisedPerson: z.string().optional(),
    itemCount: z.number().int().min(0).default(1),
    itemDescription: z.string().optional(),
    notes: z.string().optional(),
    tollUsed: z.boolean().default(false),
    tollAmount: z.number().min(0).default(0),
    tollAuthorizedBy: z.string().optional(),
  })
  .refine(
    (data) => !(data.type === 'PICKUP' && !data.collectionCompany?.trim()),
    { message: 'Collection company is required for Pick Up legs', path: ['collectionCompany'] }
  )
  .refine(
    (data) => !(data.type === 'PICKUP' && !data.collectionSuburb?.trim()),
    { message: 'Collection suburb is required for Pick Up legs', path: ['collectionSuburb'] }
  )
  .refine(
    (data) => !(data.type === 'DELIVERY' && !data.deliveryCompany?.trim()),
    { message: 'Delivery company is required for Delivery legs', path: ['deliveryCompany'] }
  )
  .refine(
    (data) => !(data.type === 'DELIVERY' && !data.deliverySuburb?.trim()),
    { message: 'Delivery suburb is required for Delivery legs', path: ['deliverySuburb'] }
  );

export const completeRunsheetSchema = z.object({
  odometerFinish: z.number().min(0),
  endTime: z.string().min(1),
  depotEndLocation: z.string().min(1),
  firstArrival: z.string().optional(),
  travelTime: z.string().optional(),
  finalDepart: z.string().optional(),
  lastEndTime: z.string().optional(),
  returnTime: z.string().optional(),
  break1: z.string().optional(),
  break2: z.string().optional(),
  break3: z.string().optional(),
  break4: z.string().optional(),
  comments: z.string().optional(),
  signatureUrl: z.string().refine(
    (value) => value.startsWith('data:image/') && value.includes(';base64,'),
    { message: 'signatureUrl must be a valid base64 data URL' }
  ),
  yardLocation: z.string().min(1),
  subcontractorName: z.string().optional(),
  rego: z.string().optional(),
  businessName: z.string().optional(),
});

export const updateRunsheetSchema = z.object({
  shiftDate: z.coerce.date().optional(),
  odometerStart: z.number().min(0).optional(),
  startTime: z.string().min(1).optional(),
  yardLocation: z.string().min(1).optional(),
  subcontractorName: z.string().optional(),
  rego: z.string().optional(),
  businessName: z.string().optional(),
});

export const runsheetQuerySchema = z.object({
  status: z.enum(['DRAFT', 'COMPLETED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateRunsheetInput = z.infer<typeof createRunsheetSchema>;
export type CreateLegInput = z.infer<typeof createLegSchema>;
export type CompleteRunsheetInput = z.infer<typeof completeRunsheetSchema>;
export type UpdateRunsheetInput = z.infer<typeof updateRunsheetSchema>;
export type RunsheetQueryInput = z.infer<typeof runsheetQuerySchema>;
