import { useRef, useState } from 'react';
import { Check, Pencil, RotateCcw, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { type CompleteRunsheetRequest } from '../../types/runsheet';
import { useTheme } from '../../context/ThemeContext';
import { ui } from '../../lib/ui';

interface ShiftSummaryProps {
  odometerStart: number | null;
  value: CompleteRunsheetRequest;
  onChange: (next: Partial<CompleteRunsheetRequest>) => void;
  onSave: () => void;
  canSave: boolean;
  loading?: boolean;
}

type PointGroup = any;

export default function ShiftSummary({
  odometerStart,
  value,
  onChange,
  onSave,
  canSave,
  loading = false,
}: ShiftSummaryProps) {
  const { resolved } = useTheme();
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [_strokeHistory, setStrokeHistory] = useState<PointGroup[]>([]);

  const finish = Number(value.odometerFinish);
  const distance =
    odometerStart !== null && !Number.isNaN(finish) ? (finish - odometerStart).toFixed(2) : '—';

  const handleBegin = () => {
    const current = sigRef.current?.toData() as PointGroup[] | undefined;
    if (current) {
      setStrokeHistory((prev) => [...prev, current]);
    }
  };

  const handleSaveSignature = () => {
    if (!sigRef.current) return;
    onChange({ signatureUrl: sigRef.current.toDataURL('image/png') });
  };

  const handleUndo = () => {
    setStrokeHistory((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      sigRef.current?.clear();
      if (next.length > 0) {
        sigRef.current?.fromData(next[next.length - 1]);
      }
      return next;
    });
    onChange({ signatureUrl: '' });
  };

  const handleClear = () => {
    sigRef.current?.clear();
    setStrokeHistory([]);
    onChange({ signatureUrl: '' });
  };

  const update = <K extends keyof CompleteRunsheetRequest>(
    key: K,
    val: CompleteRunsheetRequest[K]
  ) => {
    onChange({ [key]: val } as Partial<CompleteRunsheetRequest>);
  };

  return (
    <section className="relative flex flex-col gap-5">
      <div className={ui.card}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          End of Shift Wrap-up
        </h2>
        <p className={ui.subtitle}>Final odometer, depot location and comments.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={ui.label}>Odometer Finish</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={Number.isNaN(value.odometerFinish) ? '' : value.odometerFinish}
              onChange={(e) =>
                update('odometerFinish', e.target.value === '' ? Number.NaN : Number(e.target.value))
              }
              className={ui.input}
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total distance: <span className="font-semibold text-slate-900 dark:text-slate-100">{distance}</span>
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={ui.label}>Depot End Location</label>
            <input
              type="text"
              value={value.depotEndLocation}
              onChange={(e) => update('depotEndLocation', e.target.value)}
              className={ui.input}
            />
          </div>
        </div>
      </div>

      <div className={ui.card}>
        <h3 className={ui.sectionTitle}>Comments</h3>
        <div className="mt-3 flex flex-col gap-1.5">
          <label className={ui.label}>Daily shift notes or delays</label>
          <textarea
            value={value.comments ?? ''}
            onChange={(e) => update('comments', e.target.value)}
            rows={4}
            className={ui.input}
          />
        </div>
      </div>

      <div className={ui.card}>
        <h3 className={ui.sectionTitle}>Driver Digital Signature</h3>
        <div className="mt-3 flex flex-col gap-2">
          <label className={ui.label}>Signature pad</label>
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#262930] dark:bg-[#181a1e]">
            <SignatureCanvas
              ref={sigRef}
              onBegin={handleBegin}
              onEnd={handleSaveSignature}
              penColor={resolved === 'dark' ? '#f8fafc' : '#0f172a'}
              canvasProps={{
                className: 'h-48 w-full touch-none',
              }}
              backgroundColor="transparent"
            />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200 dark:border-[#2a2e37]" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className={ui.btnGhost}
            >
              <X size={16} />
              Clear
            </button>
            <button
              type="button"
              onClick={handleUndo}
              className={ui.btnGhost}
            >
              <RotateCcw size={16} />
              Undo
            </button>
          </div>
          {value.signatureUrl && (
            <div className="mt-1 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Check size={14} className="text-emerald-700 dark:text-emerald-300" />
              </span>
              Signature captured.
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-card backdrop-blur dark:border-[#2a2e37] dark:bg-[#1c1f24]/90">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Pencil size={16} />
            <span>Ready to complete?</span>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={loading || !canSave}
            className={`${ui.btnPrimary} w-full sm:w-auto`}
          >
            {loading ? 'Saving...' : 'Complete Runsheet'}
          </button>
        </div>
      </div>
    </section>
  );
}
