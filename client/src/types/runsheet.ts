export type Role = 'DRIVER' | 'ADMIN';
export type ShiftStatus = 'DRAFT' | 'COMPLETED';
export type LegType = 'PICKUP' | 'DELIVERY';

export interface User {
  id: string;
  email: string;
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

  // Breaks
  break1StartTime: string | null;
  break1Duration: number | null;
  break1EndTime: string | null;
  break2StartTime: string | null;
  break2Duration: number | null;
  break2EndTime: string | null;
  break3StartTime: string | null;
  break3Duration: number | null;
  break3EndTime: string | null;
  break4StartTime: string | null;
  break4Duration: number | null;
  break4EndTime: string | null;

  // Travel and Closure Timings
  firstArrivalTime: string | null;
  travelTimeDuration: string | null;
  finalDepartTime: string | null;
  lastEndTime: string | null;
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
  email: string;
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

export interface CompleteRunsheetRequest {
  odometerFinish: number;
  endTime: string;
  depotEndLocation: string;

  // Breaks
  break1StartTime?: string;
  break1Duration?: number;
  break1EndTime?: string;
  break2StartTime?: string;
  break2Duration?: number;
  break2EndTime?: string;
  break3StartTime?: string;
  break3Duration?: number;
  break3EndTime?: string;
  break4StartTime?: string;
  break4Duration?: number;
  break4EndTime?: string;

  // Travel and Closure Timings
  firstArrivalTime?: string;
  travelTimeDuration?: string;
  finalDepartTime?: string;
  lastEndTime?: string;
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
