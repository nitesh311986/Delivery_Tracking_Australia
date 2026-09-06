import { Prisma, PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export const runsheetInclude = Prisma.validator<Prisma.RunsheetInclude>()({
  driver: {
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      businessName: true,
      subcontractorName: true,
      rego: true,
      yardLocation: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  legs: { orderBy: { legOrder: 'asc' } },
});

export type RunsheetWithDetails = Prisma.RunsheetGetPayload<{ include: typeof runsheetInclude }>;
