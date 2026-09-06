import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { type CompleteRunsheetRequest, type RunsheetLegItem } from '../../types/runsheet';
import { ui } from '../../lib/ui';

interface BreaksTravelTimeProps {
  value: CompleteRunsheetRequest;
  legs: RunsheetLegItem[];
  startTime: string;
  onChange: (next: Partial<CompleteRunsheetRequest>) => void;
}

function toMinutes(time: string): number | null {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function diffMinutes(start: string, end: string): number | null {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return null;
  return e - s;
}

function formatDuration(totalMinutes: number): string {
  const abs = Math.abs(totalMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h > 0 && m > 0) {
    return `${h} hr${h > 1 ? 's' : ''} ${m} min${m > 1 ? 's' : ''}`;
  }
  if (h > 0) {
    return `${h} hr${h > 1 ? 's' : ''}`;
  }
  return `${m} min${m > 1 ? 's' : ''}`;
}

const breakKeys: (keyof CompleteRunsheetRequest)[] = ['break1', 'break2', 'break3', 'break4'];

export default function BreaksTravelTime({
  value,
  legs,
  startTime,
  onChange,
}: BreaksTravelTimeProps) {
  const [overrideFirst, setOverrideFirst] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const sorted = useMemo(() => [...legs].sort((a, b) => a.legOrder - b.legOrder), [legs]);

  const legFirstArrival = sorted[0]?.arrivalTime;
  const legFinalDepart = sorted[sorted.length - 1]?.departureTime;

  const firstArrival = overrideFirst ? value.firstArrival ?? '' : legFirstArrival ?? '';
  const finalDepart = legFinalDepart ?? '';

  useEffect(() => {
    const desiredFirst = overrideFirst ? value.firstArrival : legFirstArrival;
    const next: Partial<CompleteRunsheetRequest> = {};

    if (desiredFirst !== value.firstArrival) next.firstArrival = desiredFirst;

    if (desiredFirst && startTime) {
      const minutes = diffMinutes(startTime, desiredFirst);
      const travel = minutes !== null ? formatDuration(minutes) : undefined;
      if (travel !== value.travelTime) next.travelTime = travel;
    } else if (value.travelTime !== undefined) {
      next.travelTime = undefined;
    }

    if (legFinalDepart !== value.finalDepart) next.finalDepart = legFinalDepart;

    if (legFinalDepart && value.lastEndTime) {
      const minutes = diffMinutes(legFinalDepart, value.lastEndTime);
      const ret = minutes !== null ? formatDuration(minutes) : undefined;
      if (ret !== value.returnTime) next.returnTime = ret;
    } else if (value.returnTime !== undefined) {
      next.returnTime = undefined;
    }

    if (Object.keys(next).length > 0) onChangeRef.current(next);
  }, [
    legFirstArrival,
    legFinalDepart,
    startTime,
    overrideFirst,
    value.firstArrival,
    value.travelTime,
    value.finalDepart,
    value.lastEndTime,
    value.returnTime,
  ]);

  const update = <K extends keyof CompleteRunsheetRequest>(
    key: K,
    val: CompleteRunsheetRequest[K]
  ) => {
    onChange({ [key]: val } as Partial<CompleteRunsheetRequest>);
  };

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#2a2e37] dark:bg-[#181a1e]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Clock size={18} className="text-emerald-700 dark:text-emerald-300" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );

  return (
    <section className={ui.card}>
      <h3 className={ui.sectionTitle}>Breaks & Travel Time Details</h3>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className={ui.label}>First Arrival Time</label>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={overrideFirst}
                onChange={(e) => setOverrideFirst(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-slate-600 dark:bg-[#181a1e]"
              />
              Override
            </label>
          </div>
          <input
            type="time"
            value={firstArrival}
            onChange={(e) => update('firstArrival', e.target.value)}
            readOnly={!overrideFirst}
            className={`${ui.input} ${!overrideFirst ? 'cursor-not-allowed opacity-70' : ''}`}
          />
        </div>

        <Stat label="Travel Time" value={value.travelTime ?? '—'} />

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Final Depart Time</label>
          <input
            type="time"
            value={finalDepart}
            readOnly
            className={`${ui.input} cursor-not-allowed opacity-70`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Last End Time</label>
          <input
            type="time"
            value={value.lastEndTime ?? ''}
            onChange={(e) => update('lastEndTime', e.target.value)}
            className={ui.input}
          />
        </div>

        <Stat label="Return Time" value={value.returnTime ?? '—'} />
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Break Details
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {breakKeys.map((key, i) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className={ui.label}>Break {i + 1} Lodge Time</label>
              <input
                type="time"
                value={(value[key] as string | undefined) ?? ''}
                onChange={(e) => update(key, e.target.value)}
                className={ui.input}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          15m break within 5.5h, 30m break within 8h, 60m break within 11h moving time
        </p>
      </div>
    </section>
  );
}
