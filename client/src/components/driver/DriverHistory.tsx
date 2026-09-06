import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { getMyRunsheets, extractApiError } from '../../services/runsheet';
import { type Runsheet, type RunsheetLeg } from '../../types/runsheet';
import { ui } from '../../lib/ui';
import { safeFormatDate, safeParseDate } from '../../utils/dateUtils';

type Period = 'day' | 'week' | 'month';

const todayIso = () => new Date().toISOString().split('T')[0];

function parseLocal(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = safeParseDate(iso);
  return d ? d.toLocaleDateString() : '-';
}

function formatNumber(value: number | string | null | undefined): string {
  return Number(value ?? 0).toFixed(2);
}

function totalTolls(legs?: RunsheetLeg[]) {
  return legs?.reduce((sum, l) => sum + Number(l.tollAmount ?? 0), 0) ?? 0;
}

export default function DriverHistory() {
  const today = todayIso();
  const [viewDate, setViewDate] = useState<string>(today);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [period, setPeriod] = useState<Period>('day');
  const [runsheets, setRunsheets] = useState<Runsheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const monthDate = parseLocal(viewDate);
  const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items = await getMyRunsheets({
          status: 'COMPLETED',
          startDate: monthStart,
          endDate: monthEnd,
        });
        if (!cancelled) setRunsheets(items);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [monthStart, monthEnd]);

  const filtered = useMemo(() => {
    const selected = safeParseDate(selectedDate);
    return runsheets.filter((r) => {
      const d = safeParseDate(r.shiftDate);
      if (!d || !selected) return false;
      if (period === 'day') return isSameDay(d, selected);
      if (period === 'week') return isSameWeek(d, selected, { weekStartsOn: 1 });
      return true;
    });
  }, [runsheets, selectedDate, period]);

  const activeDays = useMemo(() => {
    const set = new Set<string>();
    runsheets.forEach((r) => {
      const iso = safeFormatDate(r.shiftDate, 'yyyy-MM-dd');
      if (iso !== '-') set.add(iso);
    });
    return set;
  }, [runsheets]);

  const handleDayClick = (day: Date) => {
    const iso = format(day, 'yyyy-MM-dd');
    setSelectedDate(iso);
    setPeriod('day');
    if (!isSameMonth(day, monthDate)) {
      setViewDate(iso);
    }
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const periodBtn = (p: Period) => (
    <button
      key={p}
      type="button"
      onClick={() => setPeriod(p)}
      className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
        period === p ? ui.pillActive : ui.pillInactive
      }`}
    >
      {p}
    </button>
  );

  return (
    <section className="flex flex-col gap-6">
      <div className={ui.card}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {format(monthDate, 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewDate((d) => format(subMonths(parseLocal(d), 1), 'yyyy-MM-dd'))}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#262a31]"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewDate((d) => format(addMonths(parseLocal(d), 1), 'yyyy-MM-dd'))}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#262a31]"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((d) => (
            <div key={d} className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {d}
            </div>
          ))}
          {calendarDays.map((day) => {
            const iso = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, monthDate);
            const isSelected = iso === selectedDate;
            const hasRunsheet = activeDays.has(iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => handleDayClick(day)}
                className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition sm:h-10 sm:w-10 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : inMonth
                      ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#262a31]'
                      : 'text-slate-300 dark:text-slate-600'
                }`}
              >
                {format(day, 'd')}
                {hasRunsheet && (
                  <span
                    className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-[#2a2e37]">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selected: <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(selectedDate)}</span>
          </p>
          <div className="flex gap-2">{(['day', 'week', 'month'] as Period[]).map(periodBtn)}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">Loading history...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-[#2a2e37] dark:bg-[#181a1e] dark:text-slate-400">
          No completed runsheets found for the selected {period}.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#2a2e37] dark:bg-[#1c1f24] sm:p-6"
            >
              <button
                type="button"
                onClick={() => toggleExpand(r.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatDate(r.shiftDate)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {r.legs?.length ?? 0} legs &bull; {formatNumber(r.totalDistance)} km &bull; $
                    {formatNumber(totalTolls(r.legs))} tolls
                  </p>
                </div>
                {expandedId === r.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>

              {expandedId === r.id && (
                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-[#2a2e37]">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Odometer</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatNumber(r.odometerStart)} &rarr;{' '}
                        {r.odometerFinish ? formatNumber(r.odometerFinish) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Distance</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatNumber(r.totalDistance)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Depot End</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {r.depotEndLocation ?? '-'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-[#2a2e37]">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-[#181a1e]">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">#</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Type</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Collection</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Delivery</th>
                          <th className="px-3 py-2 text-right font-medium text-slate-500 dark:text-slate-400">Toll</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#2a2e37]">
                        {r.legs?.map((leg, idx) => (
                          <tr key={leg.id}>
                            <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{idx + 1}</td>
                            <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{leg.type}</td>
                            <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                              {leg.collectionCompany} ({leg.collectionSuburb})
                            </td>
                            <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                              {leg.deliveryCompany} ({leg.deliverySuburb})
                            </td>
                            <td className="px-3 py-2 text-right text-slate-900 dark:text-slate-100">
                              ${formatNumber(leg.tollAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
