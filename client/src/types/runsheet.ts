export type Role = 'DRIVER' | 'ADMIN';
export type ShiftStatus = 'DRAFT' | 'COMPLETED';
export type LegType = 'PICKUP' | 'DELIVERY';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  subcontractorName: string | null;
  businessName: string | null;
  rego: string | null;
  yardLocation: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Runsheet {
  id: string;
  driverId: string;
  shiftDate: string;
  odometerStart: string;
  odometerFinish: string | null;
  totalDistance: string | null;
  originYard: string;
  startTime: string;
  endTime: string | null;
  depotEndLocation: string | null;

  // Breaks stored as JSON strings
  break1: string | null;
  break2: string | null;
  break3: string | null;
  break4: string | null;

  // Travel and Closure Timings
  firstArrivalTime: string | null;
  travelTimeDuration: string | null;
  finalDepartTime: string | null;
  returnTime: string | null;

  comments: string | null;
  signatureUrl: string | null;
  subcontractorName: string | null;
  rego: string | null;
  businessName: string | null;
  yardLocation: string | null;
  status: ShiftStatus;
  createdAt: string;
  updatedAt: string;
  driver?: User;
  legs?: RunsheetLeg[];
}

export interface RunsheetLeg {
  id: string;
  runsheetId: string;
  legOrder: number;
  type: LegType;
  collectionCompany: string | null;
  collectionSuburb: string | null;
  deliveryCompany: string | null;
  deliverySuburb: string | null;
  arrivalTime: string;
  departureTime: string;
  authorisedPerson: string | null;
  itemCount: number;
  itemDescription: string | null;
  notes: string | null;
  tollUsed: boolean;
  tollAmount: string | null;
  tollAuthorizedBy: string | null;
  createdAt: string;
}

export type RunsheetLegItem = RunsheetLeg;

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  payload: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

export interface ApiError {
  error: string;
}

export interface CreateRunsheetRequest {
  shiftDate: string;
  odometerStart: number;
  startTime: string;
  yardLocation: string;
  subcontractorName?: string;
  rego?: string;
  businessName?: string;
}

export interface CreateLegRequest {
  legOrder: number;
  type: LegType;
  collectionCompany?: string;
  collectionSuburb?: string;
  deliveryCompany?: string;
  deliverySuburb?: string;
  arrivalTime: string;
  departureTime: string;
  authorisedPerson?: string;
  itemCount: number;
  itemDescription?: string;
  notes?: string;
  tollUsed: boolean;
  tollAmount: number;
  tollAuthorizedBy?: string;
}

export interface BreakSlot {
  startTime: string;
  duration: number;
  endTime: string;
}

export interface CompleteRunsheetRequest {
  odometerFinish: number;
  depotEndLocation: string;

  // Breaks stored as JSON strings
  break1?: string;
  break2?: string;
  break3?: string;
  break4?: string;

  // Travel and Closure Timings
  firstArrivalTime?: string;
  travelTimeDuration?: string;
  finalDepartTime?: string;
  returnTime?: string;

  comments?: string;
  signatureUrl: string;
  subcontractorName?: string;
  rego?: string;
  businessName?: string;
  yardLocation: string;
}

export interface KpiResponse {
  period: { start: string; end: string };
  totalRunsheets: number;
  totalLegs: number;
  totalDistance: string;
}

export interface ShiftMetadata {
  shiftDate: string;
  driverName: string;
  odometerStart: string;
  startTime: string;
}

export type KpiData = KpiResponse;

export interface ApiResponse<T> {
  data: T;
  status: number;
}
