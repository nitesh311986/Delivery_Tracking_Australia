# Velocity Taxi Trucks System Architecture

## 1. Flow Diagram & Data Ingestion
1. **Driver Interaction (Client):** 
   Driver logs in via React PWA -> Inputs shift initial odometer/start time -> Dynamically creates pickup/delivery legs with toll detection -> Appends to LocalStorage & dispatches JSON payloads to Express backend.
2. **Inbound HTTP Logging Pipeline:**
   Incoming HTTP Request -> `httpLogger` (Morgan stream to Winston JSON) -> `authGuard` (JWT validation) -> `recordAudit` (Async Prisma Audit hook) -> Express Controller.
3. **Database Processing:**
   Prisma ORM executes parameterized transactions against PostgreSQL (Sydney Region) -> Triggers automatic metric updates.
4. **Admin Query & Reporting:**
   Admin accesses aggregated KPI cards -> Backend computes week/month stats via raw/indexed queries -> Generates PDF via `@react-pdf/renderer` -> Dispatches via Resend API.

## 2. API Contract Specification
- **Base URL:** `/api/v1`
- **Driver Routes:**
  - `POST /runsheets` - Initialize/draft daily runsheet
  - `POST /runsheets/:id/legs` - Append pickup/delivery leg
  - `PUT /runsheets/:id/complete` - Finalize shift, submit signature and end odometer
- **Admin Routes:**
  - `GET /admin/analytics/kpis` - Return daily, weekly, monthly stats
  - `POST /admin/reports/dispatch-email` - Render runsheet PDF and send email