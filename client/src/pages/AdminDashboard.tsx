import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Calendar,
  ArrowUp,
  ArrowDown,
  DollarSign,
  FileText,
  Search,
  Download,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { type Runsheet, type RunsheetLeg } from '../types/runsheet';
import {
  type KpiData,
  type DriverOption,
  type Filters,
  getKpis,
  getRunsheets,
  getDrivers,
  getCompanies,
  buildCsvUrl,
  buildPdfUrl,
  dispatchEmail,
  extractApiError,
} from '../services/admin';
import { ui } from '../lib/ui';

const DEFAULT_LIMIT = 10;

function formatDate(iso: string | undefined | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString();
}

function formatNumber(value: number | string | undefined | null): string {
  return Number(value ?? 0).toFixed(2);
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function escapeCsvCell(value: unknown): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(values: unknown[]): string {
  return values.map(escapeCsvCell).join(',');
}

function downloadRunsheetCsv(runsheet: Runsheet): void {
  const legs = runsheet.legs ?? [];
  const tolls = legs.reduce((sum, l) => sum + Number(l.tollAmount ?? 0), 0);
  const headers = [
    'Runsheet ID',
    'Driver',
    'Shift Date',
    'Origin Yard',
    'Odometer Start',
    'Odometer Finish',
    'Total Distance',
    'Legs',
    'Toll Expenses',
  ];
  const row = [
    runsheet.id,
    runsheet.driver?.fullName ?? '',
    formatDate(runsheet.shiftDate),
    runsheet.originYard,
    Number(runsheet.odometerStart ?? 0).toFixed(2),
    runsheet.odometerFinish ? Number(runsheet.odometerFinish).toFixed(2) : '',
    runsheet.totalDistance ? Number(runsheet.totalDistance).toFixed(2) : '',
    legs.length,
    tolls.toFixed(2),
  ];
  const csv = [csvRow(headers), csvRow(row)].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `runsheet-${runsheet.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function monthAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  sub?: ReactNode;
}

function KpiCard({ label, value, icon, sub }: KpiCardProps) {
  return (
    <div className={ui.card}>
      <div className={`mb-3 flex items-center justify-between ${ui.subtitle}`}>
        <span className="font-medium">{label}</span>
        <div className={ui.kpiIcon}>{icon}</div>
      </div>
      <div className={ui.kpiValue}>{value}</div>
      {sub && <div className={`mt-2 flex flex-wrap items-center gap-2 ${ui.subtitle}`}>{sub}</div>}
    </div>
  );
}

function TrendChip({ up, children }: { up: boolean; children: ReactNode }) {
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={up ? ui.badgeGreen : ui.badgeRed}>
      <Icon size={12} />
      {children}
    </span>
  );
}

function ProgressRing({ kpis }: { kpis: KpiData }) {
  const pct = Math.min(
    Math.round((kpis.totalLegs / (kpis.totalRunsheets || 1)) * 100),
    100
  );
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width="160" height="160" viewBox="0 0 120 120" className="text-emerald-600">
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        className={ui.progressTrack}
        strokeWidth="10"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        fontSize="18"
        fontWeight="600"
      >
        {pct}%
      </text>
    </svg>
  );
}

function BarChart({ kpis }: { kpis: KpiData }) {
  const max = Math.max(kpis.activeDrivers, kpis.totalRunsheets, 1);
  const dW = (kpis.activeDrivers / max) * 160;
  const rW = (kpis.totalRunsheets / max) * 160;
  return (
    <svg width="240" height="120" viewBox="0 0 240 120" className="text-emerald-600">
      <text x="10" y="20" fill="currentColor" fontSize="12" fontWeight="500">
        Active drivers
      </text>
      <rect x="10" y="28" width={dW} height="16" rx="4" fill="currentColor" />
      <text x={20 + dW} y="40" fill="currentColor" fontSize="10">
        {kpis.activeDrivers}
      </text>
      <text x="10" y="70" className="text-emerald-500" fill="currentColor" fontSize="12" fontWeight="500">
        Total runsheets
      </text>
      <rect x="10" y="78" width={rW} height="16" rx="4" fill="currentColor" className="text-emerald-400" />
      <text x={20 + rW} y="90" fill="currentColor" fontSize="10">
        {kpis.totalRunsheets}
      </text>
    </svg>
  );
}

function StatusTag({ status }: { status: 'DRAFT' | 'COMPLETED' }) {
  const isCompleted = status === 'COMPLETED';
  return <span className={isCompleted ? ui.statusCompleted : ui.statusDraft}>{status}</span>;
}

function Modal({
  runsheet,
  onClose,
}: {
  runsheet: Runsheet;
  onClose: () => void;
}) {
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmail = async () => {
    if (!emailTo) return;
    setSending(true);
    setMessage(null);
    try {
      const result = await dispatchEmail(runsheet.id, emailTo);
      if (result.success && result.emailId) {
        const msg = `Email dispatched (ID: ${result.emailId})`;
        toast.success(msg);
        setMessage(msg);
      } else {
        const msg = 'Dispatch failed';
        toast.error(msg);
        setMessage(msg);
      }
    } catch (error) {
      const msg = extractApiError(error);
      toast.error(msg);
      setMessage(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={ui.modalPanel}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={ui.modalTitle}>
            Runsheet Inspection
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={ui.modalClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className={ui.textXsMuted}>Driver</p>
            <p className={ui.textMediumMain}>
              {runsheet.driver?.fullName ?? '-'}
            </p>
          </div>
          <div>
            <p className={ui.textXsMuted}>Shift Date</p>
            <p className={ui.textMediumMain}>
              {formatDate(runsheet.shiftDate)}
            </p>
          </div>
          <div>
            <p className={ui.textXsMuted}>Status</p>
            <p>
              <StatusTag status={runsheet.status} />
            </p>
          </div>
          <div>
            <p className={ui.textXsMuted}>Origin Yard</p>
            <p className={ui.textMediumMain}>{runsheet.originYard}</p>
          </div>
          <div>
            <p className={ui.textXsMuted}>Odometer</p>
            <p className={ui.textMediumMain}>
              {formatNumber(runsheet.odometerStart)} &rarr;{' '}
              {runsheet.odometerFinish ? formatNumber(runsheet.odometerFinish) : '-'}
            </p>
          </div>
          <div>
            <p className={ui.textXsMuted}>Total Distance</p>
            <p className={ui.textMediumMain}>
              {runsheet.totalDistance ? formatNumber(runsheet.totalDistance) : '-'} km
            </p>
          </div>
        </div>

        {runsheet.comments && (
          <div className={ui.modalCommentBox}>
            <span className={ui.textMediumMain}>Comments:</span>{' '}
            {runsheet.comments}
          </div>
        )}

        <div className="mt-6">
          <h3 className={ui.sectionHeading}>Legs</h3>
          <div className={ui.modalTableWrapper}>
            <table className="min-w-full text-sm">
              <thead className={ui.modalTableHead}>
                <tr>
                  <th className={ui.tableHeader}>#</th>
                  <th className={ui.tableHeader}>Type</th>
                  <th className={ui.tableHeader}>Collection Co.</th>
                  <th className={ui.tableHeader}>Collection Suburb</th>
                  <th className={ui.tableHeader}>Delivery Co.</th>
                  <th className={ui.tableHeader}>Delivery Suburb</th>
                  <th className={ui.tableHeader}>Toll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2a2e37]">
                {runsheet.legs?.map((leg: RunsheetLeg) => (
                  <tr key={leg.id}>
                    <td className={ui.tableCell}>{leg.legOrder + 1}</td>
                    <td className={ui.tableCell}>{leg.type}</td>
                    <td className={ui.tableCell}>{leg.collectionCompany}</td>
                    <td className={ui.tableCell}>{leg.collectionSuburb}</td>
                    <td className={ui.tableCell}>{leg.deliveryCompany}</td>
                    <td className={ui.tableCell}>{leg.deliverySuburb}</td>
                    <td className={ui.tableCell}>${formatNumber(leg.tollAmount)}</td>
                  </tr>
                ))}
                {(!runsheet.legs || runsheet.legs.length === 0) && (
                  <tr>
                    <td colSpan={7} className={ui.emptyCell}>
                      No legs recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Client/Fleet Email
            </label>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="fleet@example.com"
              className={ui.input}
            />
          </div>
          <button
            type="button"
            onClick={() => window.open(buildPdfUrl(runsheet.id), '_blank')}
            className={ui.btnSecondary}
          >
            <Download size={16} />
            PDF
          </button>
          <button
            type="button"
            onClick={handleEmail}
            disabled={sending || !emailTo}
            className={ui.btnPrimary}
          >
            <Mail size={16} />
            {sending ? 'Sending...' : 'Email PDF'}
          </button>
        </div>

        {message && (
          <div className={ui.modalMessage}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [filters, setFilters] = useState<Filters>(() => ({
    start: monthAgoIso(),
    end: todayIso(),
    status: '',
    page: 1,
    limit: DEFAULT_LIMIT,
    sortBy: 'shiftDate',
    sortOrder: 'desc',
  }));
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [runsheets, setRunsheets] = useState<Runsheet[]>([]);
  const [total, setTotal] = useState(0);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selected, setSelected] = useState<Runsheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.ceil(total / (filters.limit ?? DEFAULT_LIMIT)),
    [total, filters.limit]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadMeta() {
      try {
        const [d, c] = await Promise.all([getDrivers(), getCompanies()]);
        if (!cancelled) {
          setDrivers(d);
          setCompanies(c);
        }
      } catch (err) {
        setError(extractApiError(err));
      }
    }
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const { start, end, driverId, company, status } = filters;
        const [k, r] = await Promise.all([
          getKpis({ start, end, driverId, company, status }),
          getRunsheets(filters),
        ]);
        if (!cancelled) {
          setKpis(k);
          setRunsheets(r.items);
          setTotal(r.total);
        }
      } catch (err) {
        if (!cancelled) setError(extractApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (column: Filters['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handlePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const csvFilters = useMemo(() => {
    const { start, end, driverId, company, status } = filters;
    return { start, end, driverId, company, status };
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      start: monthAgoIso(),
      end: todayIso(),
      status: '',
      page: 1,
      limit: DEFAULT_LIMIT,
      sortBy: 'shiftDate',
      sortOrder: 'desc',
    });
  };

  const applyPeriod = (p: 'day' | 'week' | 'month') => {
    const today = new Date();
    let start: Date;
    let end: Date;
    if (p === 'day') {
      start = today;
      end = today;
    } else if (p === 'week') {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(today);
      end = endOfMonth(today);
    }
    setFilters((prev) => ({
      ...prev,
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      page: 1,
    }));
  };

  const tableRowClass =
    'odd:bg-white even:bg-slate-50 hover:bg-slate-100 dark:odd:bg-[#1c1f24] dark:even:bg-[#181a1e] dark:hover:bg-[#262a31]';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className={ui.title}>Admin Dashboard</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {kpis && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Shifts"
            value={kpis.totalRunsheets}
            icon={<FileText size={20} />}
            sub={<TrendChip up>{`${kpis.totalLegs} legs recorded`}</TrendChip>}
          />
          <KpiCard
            label="Total KM Driven"
            value={`${formatNumber(kpis.distanceDay)} km`}
            icon={<Activity size={20} />}
            sub={<TrendChip up>{`Week ${formatNumber(kpis.distanceWeek)}`}</TrendChip>}
          />
          <KpiCard
            label="Deliveries / Pickups"
            value={kpis.totalDeliveries}
            icon={<ArrowUp size={20} />}
            sub={
              <>
                <TrendChip up={kpis.totalDeliveries >= kpis.totalPickups}>
                  {kpis.totalPickups} pickups
                </TrendChip>
                <span className="text-slate-400">vs deliveries</span>
              </>
            }
          />
          <KpiCard
            label="Toll Expenses"
            value={`$${formatNumber(kpis.totalTollExpenses)}`}
            icon={<DollarSign size={20} />}
            sub={<TrendChip up={false}>Total tolls</TrendChip>}
          />
        </div>
      )}

      {kpis && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={ui.card}>
            <h3 className={ui.sectionHeading}>
              Completion
            </h3>
            <div className="flex items-center justify-center">
              <ProgressRing kpis={kpis} />
            </div>
          </div>
          <div className={ui.card}>
            <h3 className={ui.sectionHeading}>
              Drivers vs Runsheets
            </h3>
            <div className="flex items-center justify-center">
              <BarChart kpis={kpis} />
            </div>
          </div>
        </div>
      )}

      <div className={ui.card}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={ui.textSmSemiboldMain}>Period:</span>
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPeriod(p)}
              className={ui.filterBtn}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Driver
            </label>
            <select
              value={filters.driverId ?? ''}
              onChange={(e) => updateFilter('driverId', e.target.value || undefined)}
              className={ui.input}
            >
              <option value="">All drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start ?? ''}
              onChange={(e) => updateFilter('start', e.target.value || undefined)}
              className={ui.input}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              End Date
            </label>
            <input
              type="date"
              value={filters.end ?? ''}
              onChange={(e) => updateFilter('end', e.target.value || undefined)}
              className={ui.input}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Company
            </label>
            <select
              value={filters.company ?? ''}
              onChange={(e) => updateFilter('company', e.target.value || undefined)}
              className={ui.input}
            >
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <select
              value={filters.status ?? ''}
              onChange={(e) =>
                updateFilter('status', (e.target.value as 'DRAFT' | 'COMPLETED' | '') || '')
              }
              className={ui.input}
            >
              <option value="">All</option>
              <option value="DRAFT">DRAFT</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(buildCsvUrl(csvFilters), '_blank')}
            className={ui.btnPrimary}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button type="button" onClick={resetFilters} className={ui.btnSecondary}>
            Reset
          </button>
        </div>
      </div>

      <div className={ui.tableContainer}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={ui.tableHead}>
              <tr>
                <th
                  onClick={() => handleSort('shiftDate')}
                  className="cursor-pointer px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200"
                >
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> Shift Date
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Driver
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Origin Yard
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="cursor-pointer px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200"
                >
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                  Distance (km)
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                  Legs
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Toll $
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2a2e37]">
              {loading ? (
                <tr>
                  <td colSpan={8} className={ui.emptyRow}>
                    Loading...
                  </td>
                </tr>
              ) : (
                runsheets.map((r) => {
                  const tolls = r.legs?.reduce((sum, l) => sum + Number(l.tollAmount ?? 0), 0) ?? 0;
                  return (
                    <tr key={r.id} className={tableRowClass}>
                      <td className={ui.tableRowCell}>
                        {formatDate(r.shiftDate)}
                      </td>
                      <td className={ui.tableRowCell}>
                        {r.driver?.fullName ?? '-'}
                      </td>
                      <td className={ui.tableRowCell}>{r.originYard}</td>
                      <td className="px-4 py-3">
                        <StatusTag status={r.status} />
                      </td>
                      <td className={ui.tableRowCellRight}>
                        {r.totalDistance ? formatNumber(r.totalDistance) : '-'}
                      </td>
                      <td className={ui.tableRowCellRight}>
                        {r.legs?.length ?? 0}
                      </td>
                      <td className={ui.tableRowCell}>
                        ${formatNumber(tolls)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className={ui.actionChip}
                          >
                            <Search size={14} /> Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(buildPdfUrl(r.id), '_blank')}
                            className={ui.actionChip}
                          >
                            <FileText size={14} /> PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadRunsheetCsv(r)}
                            className={ui.actionChip}
                          >
                            <Download size={14} /> CSV
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className={ui.actionChip}
                          >
                            <Mail size={14} /> Email
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && runsheets.length === 0 && (
                <tr>
                  <td colSpan={8} className={ui.emptyRow}>
                    No runsheets match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={ui.paginationWrapper}>
          <p className={ui.subtitle}>
            Showing <span className={ui.textMediumMain}>{runsheets.length}</span> of{' '}
            <span className={ui.textMediumMain}>{total}</span> runsheets
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePage((filters.page ?? 1) - 1)}
              disabled={(filters.page ?? 1) <= 1}
              className={ui.paginationBtn}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-700 dark:text-slate-200">
              Page {filters.page ?? 1} of {totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => handlePage((filters.page ?? 1) + 1)}
              disabled={(filters.page ?? 1) >= totalPages}
              className={ui.paginationBtn}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selected && <Modal runsheet={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
