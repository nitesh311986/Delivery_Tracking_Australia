import { Save, CheckCircle } from 'lucide-react';

interface RunsheetActionsProps {
  onSaveDraft: () => void;
  onComplete: () => void;
  loading?: boolean;
  canComplete?: boolean;
}

export default function RunsheetActions({
  onSaveDraft,
  onComplete,
  loading = false,
  canComplete = true,
}: RunsheetActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={onSaveDraft}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
      >
        <Save size={18} />
        Save Draft
      </button>
      <button
        type="button"
        onClick={onComplete}
        disabled={loading || !canComplete}
        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50 transition"
      >
        <CheckCircle size={18} />
        Complete Runsheet
      </button>
    </div>
  );
}
