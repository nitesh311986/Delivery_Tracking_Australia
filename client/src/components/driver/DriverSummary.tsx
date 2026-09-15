import { Calendar, Gauge, MapPin, Package, Route, Timer, TrendingUp, Truck } from 'lucide-react';
import { type ShiftMetadata, type RunsheetLegItem, type CompleteRunsheetRequest } from '../../types/runsheet';
import { ui } from '../../lib/ui';

interface DriverSummaryProps {
  shift: ShiftMetadata;
  legs: RunsheetLegItem[];
  summary: CompleteRunsheetRequest;
}

function formatNumber(value: number | string | null | undefined): string {
  return Number(value ?? 0).toFixed(2);
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Calendar;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#2a2e37] dark:bg-[#1c1f24]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
        <Icon size={20} className="text-emerald-700 dark:text-emerald-300" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export default function DriverSummary({ shift, legs, summary }: DriverSummaryProps) {
  const pickups = legs.filter((l) => l.type === 'PICKUP').length;
  const deliveries = legs.filter((l) => l.type === 'DELIVERY').length;
  const tolls = legs.reduce((sum, l) => sum + Number(l.tollAmount ?? 0), 0);

  const start = Number(shift.odometerStart);
  const finish = Number.isNaN(summary.odometerFinish) ? null : Number(summary.odometerFinish);
  const distance =
    !Number.isNaN(start) && finish !== null && !Number.isNaN(finish) ? finish - start : null;

  return (
    <section className={ui.card}>
      <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Current Shift Summary
      </h2>
      <p className={ui.subtitle}>A quick overview before you submit.</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SummaryCard
          label="Shift Date"
          value={shift.shiftDate ? new Date(shift.shiftDate).toLocaleDateString() : '-'}
          icon={Calendar}
        />
        <SummaryCard label="Total Legs" value={String(legs.length)} icon={Route} />
        <SummaryCard label="Pickups" value={String(pickups)} icon={Truck} />
        <SummaryCard label="Deliveries" value={String(deliveries)} icon={Package} />
        <SummaryCard label="Toll Costs" value={`$${formatNumber(tolls)}`} icon={TrendingUp} />
        <SummaryCard
          label="Odometer Start"
          value={Number.isNaN(start) ? '—' : formatNumber(start)}
          icon={Gauge}
        />
        <SummaryCard
          label="Odometer Finish"
          value={finish === null || Number.isNaN(finish) ? '—' : formatNumber(finish)}
          icon={Gauge}
        />
        <SummaryCard
          label="Running Distance"
          value={distance !== null ? `${formatNumber(distance)} km` : '—'}
          icon={Route}
        />
        <SummaryCard label="Start Time" value={shift.startTime || '—'} icon={Timer} />
        <SummaryCard label="Return Time" value={summary.returnTime || '—'} icon={Timer} />
        <SummaryCard label="Yard / Base" value={summary.yardLocation || '—'} icon={MapPin} />
        <SummaryCard label="Depot End" value={summary.depotEndLocation || '—'} icon={MapPin} />
      </div>
    </section>
  );
}
