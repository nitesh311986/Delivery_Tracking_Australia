import { useMemo, useState } from 'react';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { type CompleteRunsheetRequest } from '../../types/runsheet';
import { ui } from '../../lib/ui';
import { computeBreakEndTime, formatBreakInterval } from '../../utils/timeCalculations';

interface Break {
  startTime: string;
  duration: number;
  endTime: string;
}

interface BreakDetailsProps {
  value: CompleteRunsheetRequest;
  onChange: (next: Partial<CompleteRunsheetRequest>) => void;
}

const breakKeys: (keyof CompleteRunsheetRequest)[] = ['break1', 'break2', 'break3', 'break4'];

const durationOptions = [
  { value: 15, label: '15 mins' },
  { value: 30, label: '30 mins' },
  { value: 60, label: '60 mins' },
];

function defaultBreak(): Break {
  return { startTime: '', duration: 15, endTime: '' };
}

function withEndTime(breakItem: Break): Break {
  return {
    ...breakItem,
    endTime:
      breakItem.startTime && breakItem.duration
        ? computeBreakEndTime(breakItem.startTime, breakItem.duration)
        : '',
  };
}

function parseBreak(raw: string | undefined | null): Break | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Break>;
    if (parsed.startTime !== undefined && parsed.duration !== undefined) {
      return withEndTime({
        startTime: parsed.startTime,
        duration: Number(parsed.duration) || 15,
        endTime: parsed.endTime ?? '',
      });
    }
  } catch {
    // ignore malformed JSON
  }
  return null;
}

function serializeBreak(breakItem: Break): string {
  return JSON.stringify(withEndTime(breakItem));
}

function parseSavedBreaks(value: CompleteRunsheetRequest): Break[] {
  const saved = breakKeys.map((key) => parseBreak(value[key] as string | undefined)).filter(Boolean) as Break[];
  return saved.length > 0 ? saved : [defaultBreak()];
}

export default function BreakDetails({ value, onChange }: BreakDetailsProps) {
  const savedInitial = parseSavedBreaks(value).filter((b) => b.startTime !== '') as Break[];
  const [isEditing, setIsEditing] = useState(savedInitial.length === 0);
  const [drafts, setDrafts] = useState<Break[]>(() =>
    savedInitial.length > 0 ? savedInitial : [defaultBreak()]
  );

  const savedBreaks = useMemo(
    () => breakKeys.map((key) => parseBreak(value[key] as string | undefined)).filter(Boolean) as Break[],
    [value]
  );

  const saveBreaks = () => {
    const toSave = drafts
      .map(withEndTime)
      .filter((b) => b.startTime !== '')
      .slice(0, 4);
    const next: Partial<CompleteRunsheetRequest> = {};
    breakKeys.forEach((key, idx) => {
      (next as Record<string, string | undefined>)[key] = toSave[idx]
        ? serializeBreak(toSave[idx])
        : undefined;
    });
    onChange(next);
    setIsEditing(false);
  };

  const openEditor = () => {
    setDrafts(parseSavedBreaks(value));
    setIsEditing(true);
  };

  const deleteBreak = (index: number) => {
    const remaining = savedBreaks.filter((_, i) => i !== index);
    const next: Partial<CompleteRunsheetRequest> = {};
    breakKeys.forEach((key, idx) => {
      (next as Record<string, string | undefined>)[key] = remaining[idx]
        ? serializeBreak(remaining[idx])
        : undefined;
    });
    onChange(next);
    setDrafts(remaining.length > 0 ? remaining : [defaultBreak()]);
    if (remaining.length === 0) setIsEditing(true);
  };

  const addMore = () => {
    if (drafts.length < 4) {
      setDrafts((prev) => [...prev, defaultBreak()]);
    }
  };

  const updateDraft = (index: number, patch: Partial<Break>) => {
    setDrafts((prev) =>
      prev.map((b, i) => (i === index ? withEndTime({ ...b, ...patch }) : b))
    );
  };

  return (
    <section className={ui.card}>
      <h3 className={ui.sectionTitle}>Break Details</h3>

      {isEditing ? (
        <div className="mt-4 flex flex-col gap-4">
          {drafts.map((draft, index) => (
            <div
              key={index}
              className="grid grid-cols-1 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#2a2e37] dark:bg-[#181a1e] sm:grid-cols-3"
            >
              <div className="flex flex-col gap-1.5">
                <label className={ui.label}>Break {index + 1} Lodge / Start Time</label>
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => updateDraft(index, { startTime: e.target.value })}
                  className={ui.input}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={ui.label}>Break Interval</label>
                <select
                  value={draft.duration}
                  onChange={(e) => updateDraft(index, { duration: Number(e.target.value) })}
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
                  value={formatBreakInterval(draft.startTime, draft.duration, draft.endTime)}
                  className={`${ui.input} cursor-not-allowed opacity-70`}
                />
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addMore}
              disabled={drafts.length >= 4}
              className={`${ui.btnSecondary} ${drafts.length >= 4 ? 'opacity-50' : ''}`}
            >
              <Plus size={16} />
              Add More Break Time
            </button>
            <button
              type="button"
              onClick={saveBreaks}
              className={ui.btnPrimary}
            >
              Save Breaks
            </button>
          </div>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {savedBreaks.map((breakItem, index) => (
            <li
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2a2e37] dark:bg-[#181a1e] sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Clock size={12} />
                    Break {index + 1}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {breakItem.startTime} - {breakItem.endTime} ({formatDurationLabel(breakItem.duration)})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:self-center">
                <button
                  type="button"
                  onClick={openEditor}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#262a31] dark:hover:text-white"
                  aria-label="Edit break"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteBreak(index)}
                  className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-100 dark:hover:bg-rose-900/20"
                  aria-label="Delete break"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        15 Minutes break within 5.5 Hours moving Time, 30 Minutes break within 8 Hours moving Time, 60 Minutes break within first 11 Hours moving Time
      </p>
    </section>
  );
}

function formatDurationLabel(minutes: number): string {
  if (minutes === 60) return '60 mins';
  if (minutes === 30) return '30 mins';
  return '15 mins';
}
