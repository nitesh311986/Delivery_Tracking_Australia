import * as React from 'react';
import { Prisma } from '@prisma/client';
import { prisma, runsheetInclude, type RunsheetWithDetails } from '../lib/prisma.js';
import {
  computeBreakEndTime,
  formatBreakInterval,
  computeTravelTime,
} from '../utils/timeCalculations.js';

export interface RunsheetFilters {
  driverId?: string;
  start?: Date;
  end?: Date;
  company?: string;
  status?: 'DRAFT' | 'COMPLETED';
  page?: number;
  limit?: number;
  sortBy?: 'shiftDate' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface KpisInput {
  driverId?: string;
  start?: Date;
  end?: Date;
  company?: string;
}

export interface KpisOutput {
  distanceDay: number;
  distanceWeek: number;
  distanceMonth: number;
  totalPickups: number;
  totalDeliveries: number;
  totalTollExpenses: number;
  activeDrivers: number;
  totalRunsheets: number;
  totalLegs: number;
}

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : value.toNumber();
}

function dateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buildWhere(filters: RunsheetFilters | KpisInput): Prisma.RunsheetWhereInput {
  const where: Prisma.RunsheetWhereInput = {};

  if ('status' in filters && filters.status) {
    where.status = filters.status;
  }

  if (filters.driverId) {
    where.driverId = filters.driverId;
  }

  if (filters.start || filters.end) {
    where.shiftDate = {};
    if (filters.start) where.shiftDate.gte = filters.start;
    if (filters.end) where.shiftDate.lte = filters.end;
  }

  if (filters.company) {
    where.legs = {
      some: {
        OR: [
          { collectionCompany: { contains: filters.company, mode: 'insensitive' } },
          { deliveryCompany: { contains: filters.company, mode: 'insensitive' } },
        ],
      },
    };
  }

  return where;
}

export async function fetchRunsheets(
  filters: RunsheetFilters
): Promise<{ items: RunsheetWithDetails[]; total: number }> {
  const where = buildWhere(filters);
  const orderBy: Prisma.RunsheetOrderByWithRelationInput = {};
  if (filters.sortBy) orderBy[filters.sortBy] = filters.sortOrder ?? 'asc';
  else orderBy.shiftDate = 'desc';

  const skip = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;
  const take = filters.limit ?? 50;

  const [items, total] = await Promise.all([
    prisma.runsheet.findMany({
      where,
      include: runsheetInclude,
      orderBy,
      skip,
      take,
    }),
    prisma.runsheet.count({ where }),
  ]);

  return { items, total };
}

function escapeCsvCell(value: unknown): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(values: unknown[]): string {
  return values.map(escapeCsvCell).join(',');
}

export function exportRunsheetsToCsv(runsheets: RunsheetWithDetails[]): string {
  const headers = [
    'Runsheet ID',
    'Driver',
    'Shift Date',
    'Origin Yard',
    'Odometer Start',
    'Odometer Finish',
    'Total Distance',
    'Status',
    'Legs',
    'Toll Expenses',
  ];

  const rows = runsheets.map((r) => {
    const tolls = r.legs.reduce((sum, l) => sum + toNumber(l.tollAmount), 0);
    const legs = r.legs
      .map(
        (l) =>
          `${l.legOrder + 1}. ${l.type} ` +
          `From: ${l.collectionCompany} (${l.collectionSuburb}) ` +
          `To: ${l.deliveryCompany} (${l.deliverySuburb})`
      )
      .join('; ');

    return [
      r.id,
      r.driver?.fullName ?? '',
      new Date(r.shiftDate).toISOString().split('T')[0],
      r.originYard,
      toNumber(r.odometerStart).toFixed(2),
      r.odometerFinish ? toNumber(r.odometerFinish).toFixed(2) : '',
      r.totalDistance ? toNumber(r.totalDistance).toFixed(2) : '',
      r.status,
      legs,
      tolls.toFixed(2),
    ];
  });

  return [csvRow(headers), ...rows.map(csvRow)].join('\n');
}

export async function getKpiData(filters: KpisInput): Promise<KpisOutput> {
  const where = buildWhere(filters);
  const dayRange = dateRange(1);
  const weekRange = dateRange(7);
  const monthRange = dateRange(30);

  const [day, week, month, pickups, deliveries, tolls, drivers, runsheets, legs] =
    await Promise.all([
      prisma.runsheet.aggregate({
        _sum: { totalDistance: true },
        where: { ...where, shiftDate: { gte: dayRange.start, lte: dayRange.end } },
      }),
      prisma.runsheet.aggregate({
        _sum: { totalDistance: true },
        where: { ...where, shiftDate: { gte: weekRange.start, lte: weekRange.end } },
      }),
      prisma.runsheet.aggregate({
        _sum: { totalDistance: true },
        where: { ...where, shiftDate: { gte: monthRange.start, lte: monthRange.end } },
      }),
      prisma.runsheetLeg.count({
        where: {
          type: 'PICKUP',
          runsheet: where,
        },
      }),
      prisma.runsheetLeg.count({
        where: {
          type: 'DELIVERY',
          runsheet: where,
        },
      }),
      prisma.runsheetLeg.aggregate({
        _sum: { tollAmount: true },
        where: { runsheet: where },
      }),
      prisma.runsheet
        .groupBy({
          by: ['driverId'],
          where,
          _count: { driverId: true },
        })
        .then((groups) => groups.length),
      prisma.runsheet.count({ where }),
      prisma.runsheetLeg.count({ where: { runsheet: where } }),
    ]);

  return {
    distanceDay: toNumber(day._sum.totalDistance),
    distanceWeek: toNumber(week._sum.totalDistance),
    distanceMonth: toNumber(month._sum.totalDistance),
    totalPickups: pickups,
    totalDeliveries: deliveries,
    totalTollExpenses: toNumber(tolls._sum.tollAmount),
    activeDrivers: drivers,
    totalRunsheets: runsheets,
    totalLegs: legs,
  };
}

// Helper to convert base64 PNG/JPEG data into raw Buffers so @react-pdf doesn't stall
function prepareSignatureImage(
  signatureUrl: string | null | undefined
): { data: Buffer; format: 'png' | 'jpg' } | null {
  if (!signatureUrl) return null;
  try {
    if (signatureUrl.startsWith('data:')) {
      const clean = signatureUrl.replace(/\s/g, '');
      const matches = clean.match(/^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/);
      if (matches && matches[2]) {
        const ext = matches[1].toLowerCase();
        const format: 'png' | 'jpg' = ext === 'png' ? 'png' : 'jpg';
        return { data: Buffer.from(matches[2], 'base64'), format };
      }
      return null;
    }

    // Support raw base64 payloads without a data URI prefix
    const trimmed = signatureUrl.trim().replace(/\s/g, '');
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length > 50) {
      return { data: Buffer.from(trimmed, 'base64'), format: 'png' };
    }
  } catch (err) {
    console.error('Failed to parse signature base64 buffer:', err);
  }
  return null;
}

export async function generateRunsheetPdf(runsheet: any): Promise<Buffer> {
  const ReactPDF = await import('@react-pdf/renderer');
  const { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } = ReactPDF;

  const formatDate = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  };

  const formatNumber = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    return toNumber(value).toFixed(2);
  };

  const styles = StyleSheet.create({
    page: { padding: 16, fontSize: 8, fontFamily: 'Helvetica', color: '#000000' },
    titleBar: {
      borderWidth: 1,
      borderColor: '#000000',
      alignItems: 'center',
      paddingVertical: 4,
      marginBottom: 6,
    },
    title: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      textDecoration: 'underline',
    },
    table: { width: '100%', borderWidth: 1, borderColor: '#000000', borderStyle: 'solid' },
    tr: { flexDirection: 'row' },
    th: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7,
      textAlign: 'center',
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      paddingVertical: 3,
      paddingHorizontal: 1,
      minHeight: 18,
    },
    td: {
      fontSize: 7,
      textAlign: 'center',
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      paddingVertical: 3,
      paddingHorizontal: 1,
      minHeight: 18,
    },
    tdLast: { borderRightWidth: 0 },
    tdLastRow: { borderBottomWidth: 0 },
    blockTable: { width: '100%', borderWidth: 1, borderColor: '#000000', borderStyle: 'solid' },
    blockHeader: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 8,
      textAlign: 'center',
      borderBottomWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      paddingVertical: 3,
    },
    labelCell: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      paddingVertical: 3,
      paddingHorizontal: 3,
      width: '45%',
      minHeight: 18,
    },
    valueCell: {
      fontSize: 7,
      borderBottomWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      paddingVertical: 3,
      paddingHorizontal: 3,
      width: '55%',
      minHeight: 18,
    },
    guidelineBox: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      padding: 4,
      marginTop: 4,
    },
    guidelineTitle: { fontFamily: 'Helvetica-Bold', fontSize: 7, marginBottom: 2 },
    guidelineText: { fontSize: 7, marginBottom: 1 },
    contractorGrid: { width: '100%', borderWidth: 1, borderColor: '#000000', borderStyle: 'solid', marginTop: 6 },
    contractorRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000000', borderStyle: 'solid' },
    contractorRowLast: { flexDirection: 'row' },
    contractorCell: { width: '50%', borderRightWidth: 1, borderColor: '#000000', borderStyle: 'solid' },
    contractorCellLast: { width: '50%' },
    contractorInner: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 3, minHeight: 18 },
    contractorLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7,
      width: '45%',
    },
    contractorValue: { fontSize: 7, width: '55%' },
    sigRow: { width: '100%', flexDirection: 'row', borderWidth: 1, borderColor: '#000000', borderStyle: 'solid' },
    sigCell: { width: '50%', borderRightWidth: 1, borderColor: '#000000', borderStyle: 'solid', padding: 4, minHeight: 55 },
    dateCell: { width: '50%', padding: 4 },
    sigLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 2 },
    signature: { width: 140, height: 45 },
    signaturePlaceholder: { fontSize: 7, color: '#444444', fontStyle: 'italic' },
    commentBox: { width: '100%', borderWidth: 1, borderTopWidth: 0, borderColor: '#000000', borderStyle: 'solid', padding: 4, minHeight: 45 },
    commentLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 2 },
    commentText: { fontSize: 8 },
    travelTimeContainer: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      marginTop: 12,
      marginBottom: 12,
    },
    travelTimeBody: { flexDirection: 'row' },
    travelTimeColumn: { width: '50%' },
    travelTimeLeftColumn: { width: '50%', borderRightWidth: 1, borderColor: '#000000', borderStyle: 'solid' },
    travelTimeRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000000', borderStyle: 'solid' },
    travelTimeLastRow: { flexDirection: 'row', borderBottomWidth: 0 },
    travelTimeLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 8,
      padding: 4,
      width: '45%',
      minHeight: 18,
    },
    travelTimeValue: {
      fontSize: 8,
      padding: 4,
      width: '55%',
      minHeight: 18,
    },
  });

  const columns = [
    { key: 'order', label: '#', width: '3%' },
    { key: 'colCompany', label: 'Collection Company', width: '15%' },
    { key: 'colSuburb', label: 'Suburb', width: '10%' },
    { key: 'delCompany', label: 'Delivery Company', width: '15%' },
    { key: 'delSuburb', label: 'Suburb', width: '10%' },
    { key: 'arrTime', label: 'Arrival Time', width: '7%' },
    { key: 'depTime', label: 'Depart Time', width: '7%' },
    { key: 'toll', label: 'Tolls (Y/N)', width: '7%' },
    { key: 'items', label: 'No. Items', width: '5%' },
    { key: 'desc', label: 'Description (Pallets, cases)', width: '11%' },
    { key: 'auth', label: 'Name (Authorised Person)', width: '10%' },
  ] as const;

  const lastCol = columns.length - 1;

  const tableHeader = React.createElement(
    View,
    { style: styles.tr },
    ...columns.map((col, i) =>
      React.createElement(
        Text,
        { key: col.key, style: [styles.th, { width: col.width }, i === lastCol ? styles.tdLast : {}] },
        col.label
      )
    )
  );

  const legs: any[] = runsheet.legs || [];
  const rowCount = Math.max(legs.length, 8);
  const isLastRow = (idx: number) => idx === rowCount - 1;
  const legRows = Array.from({ length: rowCount }, (_, idx) => {
    const leg = legs[idx];
    const values = leg
      ? [
          String((leg.legOrder ?? idx) + 1),
          leg.collectionCompany || '',
          leg.collectionSuburb || '',
          leg.deliveryCompany || '',
          leg.deliverySuburb || '',
          leg.arrivalTime || '',
          leg.departureTime || '',
          leg.tollUsed ? `Y $${toNumber(leg.tollAmount).toFixed(2)}` : 'N',
          leg.itemCount != null ? String(leg.itemCount) : '',
          leg.itemDescription || '',
          leg.authorisedPerson || '',
        ]
      : ['', '', '', '', '', '', '', '', '', '', ''];
    return React.createElement(
      View,
      { style: styles.tr, key: leg?.id || `empty-${idx}` },
      ...values.map((value, colIdx) =>
        React.createElement(
          Text,
          {
            key: colIdx,
            style: [
              styles.td,
              { width: columns[colIdx].width },
              colIdx === lastCol ? styles.tdLast : {},
              isLastRow(idx) ? styles.tdLastRow : {},
            ],
          },
          value
        )
      )
    );
  });

  const sigImage = prepareSignatureImage(runsheet.signatureUrl);

  const breakRow = (label: string, value: string, isLast = false) =>
    React.createElement(
      View,
      { style: styles.tr, key: label },
      React.createElement(
        Text,
        { style: [styles.labelCell, isLast ? { borderBottomWidth: 0 } : {}] },
        label
      ),
      React.createElement(
        Text,
        { style: [styles.valueCell, isLast ? { borderBottomWidth: 0 } : {}] },
        value || ''
      )
    );

  const parseBreakSlot = (raw: string | undefined | null): { startTime?: string; duration?: number; endTime?: string } | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // ignore invalid JSON
    }
    return null;
  };

  const formatBreakSlot = (raw: string | undefined | null): string => {
    const b = parseBreakSlot(raw);
    if (!b) return '';
    const end = b.endTime || (b.startTime && b.duration ? computeBreakEndTime(b.startTime, b.duration) : '');
    return formatBreakInterval(b.startTime, b.duration, end);
  };

  const breakDetailsTable = React.createElement(
    View,
    { style: styles.blockTable },
    React.createElement(Text, { style: styles.blockHeader }, 'Break Details'),
    breakRow('First Break', formatBreakSlot(runsheet.break1)),
    breakRow('Second Break', formatBreakSlot(runsheet.break2)),
    breakRow('Third Break', formatBreakSlot(runsheet.break3)),
    breakRow('Fourth Break', formatBreakSlot(runsheet.break4), true)
  );

  const guidelineBox = React.createElement(
    View,
    { style: styles.guidelineBox },
    React.createElement(Text, { style: styles.guidelineTitle }, 'Break Guidelines'),
    React.createElement(Text, { style: styles.guidelineText }, '15 Minutes break within 5.5 Hours moving Time'),
    React.createElement(Text, { style: styles.guidelineText }, '30 Minutes break within 8 Hours moving Time'),
    React.createElement(Text, { style: styles.guidelineText }, '60 Minutes break within first 11 Hours moving Time')
  );

  const initialTravelTime =
    runsheet.startTime && runsheet.firstArrivalTime
      ? computeTravelTime(runsheet.startTime, runsheet.firstArrivalTime)
      : '';
  const finalTravelTime =
    runsheet.finalDepartTime && runsheet.returnTime
      ? computeTravelTime(runsheet.finalDepartTime, runsheet.returnTime)
      : '';

  const travelTimeRow = (label: string, value: string, isLast: boolean) =>
    React.createElement(
      View,
      { style: isLast ? styles.travelTimeLastRow : styles.travelTimeRow },
      React.createElement(Text, { style: styles.travelTimeLabel }, label),
      React.createElement(Text, { style: styles.travelTimeValue }, value || '')
    );

  const leftColumn = React.createElement(
    View,
    { style: styles.travelTimeLeftColumn },
    travelTimeRow('First Arrival', runsheet.firstArrivalTime || '', false),
    travelTimeRow('Travel Time (initial)', initialTravelTime || '', false),
    travelTimeRow('Final Depart', runsheet.finalDepartTime || '', false),
    travelTimeRow('Return Time', runsheet.returnTime || '', false),
    travelTimeRow('Travel Time (final)', finalTravelTime || '', true)
  );

  const rightColumn = React.createElement(
    View,
    { style: styles.travelTimeColumn },
    travelTimeRow('Depot End Location', runsheet.depotEndLocation || '', false),
    travelTimeRow('ODOMETER START', formatNumber(runsheet.odometerStart), false),
    travelTimeRow('ODOMETER FINISH', formatNumber(runsheet.odometerFinish), false),
    travelTimeRow('TOTAL DISTANCE', formatNumber(runsheet.totalDistance), true)
  );

  const travelTimeGrid = React.createElement(
    View,
    { style: styles.travelTimeContainer },
    React.createElement(Text, { style: styles.blockHeader }, 'Travel Time Details'),
    React.createElement(
      View,
      { style: styles.travelTimeBody },
      leftColumn,
      rightColumn
    )
  );

  const contractorRow = (cells: React.ReactNode[], isLastRow = false) =>
    React.createElement(
      View,
      { style: isLastRow ? styles.contractorRowLast : styles.contractorRow },
      ...cells
    );

  const contractorCell = (label: string, value: string, isLastCol = false) =>
    React.createElement(
      View,
      { style: isLastCol ? styles.contractorCellLast : styles.contractorCell, key: label },
      React.createElement(
        View,
        { style: styles.contractorInner },
        React.createElement(Text, { style: styles.contractorLabel }, label),
        React.createElement(Text, { style: styles.contractorValue }, value || '')
      )
    );

  const contractorGrid = React.createElement(
    View,
    { style: styles.contractorGrid },
    contractorRow([
      contractorCell('Sub-Contractor Name', runsheet.subcontractorName || runsheet.driver?.subcontractorName || runsheet.driver?.fullName || ''),
      contractorCell('Rego', runsheet.rego || runsheet.driver?.rego || '', true),
    ]),
    contractorRow([
      contractorCell('Your Business Name', runsheet.businessName || runsheet.driver?.businessName || ''),
      contractorCell('Yard/Base Location', runsheet.yardLocation || runsheet.driver?.yardLocation || runsheet.originYard || '', true),
    ], true)
  );

  const signatureRow = React.createElement(
    View,
    { style: styles.sigRow },
    React.createElement(
      View,
      { style: styles.sigCell },
      React.createElement(Text, { style: styles.sigLabel }, 'Signature'),
      sigImage
        ? React.createElement(Image, { style: styles.signature, src: sigImage })
        : React.createElement(Text, { style: styles.signaturePlaceholder }, 'No signature captured')
    ),
    React.createElement(
      View,
      { style: styles.dateCell },
      React.createElement(Text, { style: styles.sigLabel }, 'Date of Shift'),
      React.createElement(Text, { style: styles.commentText }, formatDate(runsheet.shiftDate))
    )
  );

  const commentsBox = React.createElement(
    View,
    { style: styles.commentBox },
    React.createElement(Text, { style: styles.commentLabel }, 'COMMENTS'),
    React.createElement(Text, { style: styles.commentText }, runsheet.comments || '')
  );

  const doc = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', style: styles.page, orientation: 'portrait' },
      React.createElement(
        View,
        { style: styles.titleBar },
        React.createElement(Text, { style: styles.title }, 'VELOCITY TAXI TRUCKS - DAILY RUNSHEET')
      ),
      React.createElement(View, { style: styles.table }, tableHeader, ...legRows),
      React.createElement(View, { style: { marginTop: 6 } }, breakDetailsTable),
      React.createElement(View, { style: { marginTop: 4 } }, guidelineBox),
      React.createElement(View, { style: { marginTop: 6 } }, contractorGrid),
      travelTimeGrid,
      signatureRow,
      commentsBox
    )
  );

  return await renderToBuffer(doc);
}
