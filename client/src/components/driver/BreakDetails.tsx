import { useEffect } from 'react';
import { type CompleteRunsheetRequest } from '../../types/runsheet';
import { ui } from '../../lib/ui';
import { computeBreakEndTime, formatBreakInterval } from '../../utils/timeCalculations';

interface BreakDetailsProps {
  value: CompleteRunsheetRequest;
  onChange: (next: Partial<CompleteRunsheetRequest>) => void;
}

interface BreakConfig {
  startKey: keyof CompleteRunsheetRequest;
  durationKey: keyof CompleteRunsheetRequest;
  endKey: keyof CompleteRunsheetRequest;
  label: string;
  defaultDuration: number;
}

const breakConfig: BreakConfig[] = [
  { startKey: 'break1StartTime', durationKey: 'break1Duration', endKey: 'break1EndTime', label: 'Break 1', defaultDuration: 15 },
  { startKey: 'break2StartTime', durationKey: 'break2Duration', endKey: 'break2EndTime', label: 'Break 2', defaultDuration: 30 },
  { startKey: 'break3StartTime', durationKey: 'break3Duration', endKey: 'break3EndTime', label: 'Break 3', defaultDuration: 15 },
  { startKey: 'break4StartTime', durationKey: 'break4Duration', endKey: 'break4EndTime', label: 'Break 4', defaultDuration: 15 },
];

const durationOptions = [
  { value: '15', label: '15 mins' },
  { value: '30', label: '30 mins' },
  { value: '60', label: '60 mins' },
];

export default function BreakDetails({ value, onChange }: BreakDetailsProps) {
  useEffect(() => {
    const next: Record<string, unknown> = {};

    breakConfig.forEach(({ startKey, durationKey, endKey, defaultDuration }) => {
      const start = value[startKey] as string | undefined;
      let duration = value[durationKey] as number | undefined;
      const currentEnd = value[endKey] as string | undefined;

      if (start && !duration) {
        duration = defaultDuration;
        next[durationKey as string] = duration;
      }

      if (start && duration) {
        const computedEnd = computeBreakEndTime(start, duration);
        if (computedEnd && computedEnd !== currentEnd) {
          next[endKey as string] = computedEnd;
        }
      } else if (currentEnd) {
        next[endKey as string] = '';
      }
    });

    if (Object.keys(next).length > 0) {
      onChange(next as Partial<CompleteRunsheetRequest>);
    }
  }, [value, onChange]);

  const update = <K extends keyof CompleteRunsheetRequest>(key: K, val: CompleteRunsheetRequest[K]) => {
    onChange({ [key]: val } as Partial<CompleteRunsheetRequest>);
  };

  return (
    <section className={ui.card}>
      <h3 className={ui.sectionTitle}>Break Details</h3>

      <div className="mt-4 flex flex-col gap-4">
        {breakConfig.map(({ startKey, durationKey, endKey, label }) => {
          const start = (value[startKey] as string | undefined) ?? '';
          const duration = (value[durationKey] as number | undefined) ?? '';
          const end = (value[endKey] as string | undefined) ?? '';

          return (
            <div key={label} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className={ui.label}>{label} Lodge / Start Time</label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => update(startKey, e.target.value)}
                  className={ui.input}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={ui.label}>Break Interval</label>
                <select
                  value={String(duration)}
                  onChange={(e) => update(durationKey, Number(e.target.value))}
                  className={ui.input}
                >
                  {durationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={ui.label}>Break End Time</label>
                <input
                  type="text"
                  readOnly
                  value={formatBreakInterval(start, Number(duration) || 0, end)}
                  className={`${ui.input} cursor-not-allowed opacity-70`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        15 Minutes break within 5.5 Hours moving Time, 30 Minutes break within 8 Hours moving Time, 60 Minutes break within first 11 Hours moving Time
      </p>
    </section>
  );
}
