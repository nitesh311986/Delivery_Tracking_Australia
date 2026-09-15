import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { type CompleteRunsheetRequest, type RunsheetLegItem } from '../../types/runsheet';
import { ui } from '../../lib/ui';
import { computeTravelTime } from '../../utils/timeCalculations';

interface TravelTimeDetailsProps {
  value: CompleteRunsheetRequest;
  legs: RunsheetLegItem[];
  onChange: (next: Partial<CompleteRunsheetRequest>) => void;
}

export default function TravelTimeDetails({
  value,
  legs,
  onChange,
}: TravelTimeDetailsProps) {
  const sorted = useMemo(() => [...legs].sort((a, b) => a.legOrder - b.legOrder), [legs]);
  const legFirstArrival = sorted[0]?.arrivalTime;
  const legFinalDepart = sorted[sorted.length - 1]?.departureTime;

  const [overrideFirst, setOverrideFirst] = useState(() => {
    return Boolean(value.firstArrivalTime && value.firstArrivalTime !== legFirstArrival);
  });

  const firstArrival = (overrideFirst ? value.firstArrivalTime : legFirstArrival) ?? '';
  const finalDepart = legFinalDepart ?? '';

  useEffect(() => {
    const next: Partial<CompleteRunsheetRequest> = {};

    const desiredFirst = firstArrival;
    if (desiredFirst !== value.firstArrivalTime) {
      next.firstArrivalTime = desiredFirst;
    }

    const desiredFinal = finalDepart;
    if (desiredFinal !== value.finalDepartTime) {
      next.finalDepartTime = desiredFinal;
    }

    const travel =
      finalDepart && value.returnTime
        ? computeTravelTime(finalDepart, value.returnTime) ?? ''
        : '';
    if (travel !== value.travelTimeDuration) {
      next.travelTimeDuration = travel;
    }

    if (Object.keys(next).length > 0) {
      onChange(next);
    }
  }, [
    firstArrival,
    finalDepart,
    value.firstArrivalTime,
    value.finalDepartTime,
    value.returnTime,
    value.travelTimeDuration,
    onChange,
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
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <section className={ui.card}>
      <h3 className={ui.sectionTitle}>Travel Time Details</h3>

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
            onChange={(e) => update('firstArrivalTime', e.target.value)}
            readOnly={!overrideFirst}
            className={`${ui.input} ${!overrideFirst ? 'cursor-not-allowed opacity-70' : ''}`}
          />
        </div>

        <Stat label="Travel Time" value={value.travelTimeDuration ?? '—'} />

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
          <label className={ui.label}>Return Time</label>
          <input
            type="time"
            value={value.returnTime ?? ''}
            onChange={(e) => update('returnTime', e.target.value)}
            className={ui.input}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Driver end-of-day clock-out timestamp
          </p>
        </div>
      </div>
    </section>
  );
}
