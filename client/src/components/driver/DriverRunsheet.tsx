import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, History, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  type CompleteRunsheetRequest,
  type CreateLegRequest,
  type CreateRunsheetRequest,
  type RunsheetLegItem,
  type ShiftMetadata,
} from '../../types/runsheet';
import { addLeg, completeRunsheet, createRunsheet, extractApiError } from '../../services/runsheet';
import ShiftHeader from './ShiftHeader';
import LegForm, { type DraftLeg } from './LegForm';
import LegTable from './LegTable';
import BreaksTravelTime from './BreaksTravelTime';
import GeneralDetails from './GeneralDetails';
import ShiftSummary from './ShiftSummary';
import DriverHistory from './DriverHistory';
import DriverSummary from './DriverSummary';
import { ui } from '../../lib/ui';

const todayIso = () => new Date().toISOString().split('T')[0];

const getDefaultShift = (user: ReturnType<typeof useAuth>['user']): ShiftMetadata => ({
  shiftDate: todayIso(),
  driverName: user?.fullName ?? '',
  odometerStart: '',
  startTime: '',
});

const getDefaultSummary = (
  user: ReturnType<typeof useAuth>['user']
): CompleteRunsheetRequest => ({
  odometerFinish: Number.NaN,
  endTime: '',
  depotEndLocation: '',
  signatureUrl: '',
  yardLocation: user?.yardLocation ?? '',
  subcontractorName: user?.subcontractorName ?? '',
  rego: user?.rego ?? '',
  businessName: user?.businessName ?? '',
});

function toCreateLegRequest(leg: DraftLeg, legOrder: number): CreateLegRequest {
  return {
    legOrder,
    type: leg.type,
    collectionCompany:
      leg.type === 'PICKUP' ? leg.collectionCompany?.trim() || undefined : undefined,
    collectionSuburb:
      leg.type === 'PICKUP' ? leg.collectionSuburb?.trim() || undefined : undefined,
    deliveryCompany:
      leg.type === 'DELIVERY' ? leg.deliveryCompany?.trim() || undefined : undefined,
    deliverySuburb:
      leg.type === 'DELIVERY' ? leg.deliverySuburb?.trim() || undefined : undefined,
    arrivalTime: leg.arrivalTime,
    departureTime: leg.departureTime,
    authorisedPerson: leg.authorisedPerson?.trim() || undefined,
    itemCount: leg.itemCount,
    itemDescription: leg.itemDescription?.trim() || undefined,
    notes: leg.notes?.trim() || undefined,
    tollUsed: leg.tollUsed,
    tollAmount: leg.tollUsed ? Number(leg.tollAmount) || 0 : 0,
    tollAuthorizedBy: leg.tollUsed ? leg.tollAuthorizedBy?.trim() || undefined : undefined,
  };
}

function makeRunsheetRequest(
  shift: ShiftMetadata,
  summary: CompleteRunsheetRequest
): CreateRunsheetRequest {
  return {
    shiftDate: shift.shiftDate,
    odometerStart: Number(shift.odometerStart),
    startTime: shift.startTime,
    yardLocation: summary.yardLocation.trim(),
    subcontractorName: summary.subcontractorName?.trim(),
    rego: summary.rego?.trim(),
    businessName: summary.businessName?.trim(),
  };
}

export default function DriverRunsheet() {
  const { user } = useAuth();
  const [shift, setShift] = useState<ShiftMetadata>(() => getDefaultShift(user));
  const [legs, setLegs] = useState<RunsheetLegItem[]>([]);
  const [summary, setSummary] = useState<CompleteRunsheetRequest>(() => getDefaultSummary(user));
  const [runsheetId, setRunsheetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<DraftLeg | undefined>();
  const [summaryKey, setSummaryKey] = useState(0);
  const [wrapUpVisible, setWrapUpVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'summary'>('entry');

  const initializedRef = useRef(false);

  useEffect(() => {
    if (user && !initializedRef.current) {
      setShift((prev) => ({ ...prev, driverName: user.fullName ?? '' }));
      setSummary((prev) => ({
        ...prev,
        subcontractorName: user.subcontractorName ?? '',
        rego: user.rego ?? '',
        businessName: user.businessName ?? '',
        yardLocation: user.yardLocation ?? '',
      }));
      initializedRef.current = true;
    }
  }, [user]);

  const startOdometer = useMemo(() => {
    const n = Number(shift.odometerStart);
    return Number.isNaN(n) ? null : n;
  }, [shift.odometerStart]);

  const handleUpdateShift = (next: Partial<ShiftMetadata>) => {
    setShift((prev) => ({ ...prev, ...next }));
  };

  const handleSummaryChange = useCallback(
    (next: Partial<CompleteRunsheetRequest>) => setSummary((prev) => ({ ...prev, ...next })),
    []
  );

  const handleAddLeg = (draft: DraftLeg) => {
    setLegs((prev) => {
      if (editingId) {
        return prev.map((l) =>
          l.id === editingId
            ? {
                ...draft,
                id: editingId,
                runsheetId: l.runsheetId,
                createdAt: l.createdAt,
                legOrder: l.legOrder,
              }
            : l
        );
      }
      const newLeg: RunsheetLegItem = {
        ...draft,
        id: crypto.randomUUID(),
        runsheetId: '',
        createdAt: new Date().toISOString(),
        legOrder: prev.length,
      };
      return [...prev, newLeg];
    });
    setEditingId(null);
    setEditingValues(undefined);
  };

  const handleEditLeg = (leg: RunsheetLegItem) => {
    const { id, runsheetId: _, createdAt, ...rest } = leg;
    setEditingId(id);
    setEditingValues(rest as DraftLeg);
  };

  const handleDeleteLeg = (id: string) => {
    setLegs((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      if (updated.length === 0) {
        setWrapUpVisible(false);
      }
      return updated;
    });
    if (editingId === id) {
      setEditingId(null);
      setEditingValues(undefined);
    }
  };

  const validateShift = (): string | null => {
    if (!shift.shiftDate) return 'Shift date is required.';
    if (!shift.driverName.trim()) return 'Driver name is required.';
    const start = Number(shift.odometerStart);
    if (Number.isNaN(start) || start < 0) return 'Odometer start must be a valid non-negative number.';
    if (!shift.startTime) return 'Start time is required.';
    if (!summary.yardLocation.trim()) return 'Yard / Base Location is required.';
    return null;
  };

  const saveRunsheet = async (): Promise<string | null> => {
    setError(null);
    const validationError = validateShift();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return null;
    }

    let id = runsheetId;
    if (!id) {
      const response = await createRunsheet(makeRunsheetRequest(shift, summary));
      id = response.data.id;
      setRunsheetId(id);
    }

    const unsaved = legs.filter((l) => !l.runsheetId);
    if (unsaved.length > 0) {
      const saved = legs.filter((l) => l.runsheetId === id);
      const nextOrder = saved.length;
      const created = await Promise.all(
        unsaved.map((leg, idx) => addLeg(id!, toCreateLegRequest(leg, nextOrder + idx)))
      );
      setLegs([...saved, ...created.map((res) => res.data)]);
    }

    return id;
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const id = await saveRunsheet();
      if (!id) {
        setLoading(false);
        return;
      }

      if (legs.length === 0) {
        const message = 'At least one leg is required to save the runsheet.';
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      if (Number.isNaN(summary.odometerFinish)) {
        const message = 'Odometer finish is required.';
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }
      if (!summary.endTime) {
        const message = 'End time is required.';
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }
      if (!summary.depotEndLocation.trim()) {
        const message = 'Depot end location is required.';
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }
      if (!summary.signatureUrl) {
        const message = 'Signature is required.';
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      await completeRunsheet(id, summary);

      toast.success('Runsheet submitted and saved successfully');

      setRunsheetId(null);
      setLegs([]);
      setShift(getDefaultShift(user));
      setSummary(getDefaultSummary(user));
      setEditingId(null);
      setEditingValues(undefined);
      setWrapUpVisible(false);
      setSummaryKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const message = extractApiError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const canSave =
    legs.length > 0 &&
    !Number.isNaN(summary.odometerFinish) &&
    summary.endTime !== '' &&
    summary.depotEndLocation.trim() !== '' &&
    summary.yardLocation.trim() !== '' &&
    summary.signatureUrl !== '';

  const tabs: { key: 'entry' | 'history' | 'summary'; label: string; icon: typeof ClipboardList }[] = [
    { key: 'entry', label: 'Entry', icon: ClipboardList },
    { key: 'history', label: 'History', icon: History },
    { key: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={ui.title}>Driver Run-Sheet</h1>
          <p className={ui.subtitle}>Record pickups, deliveries, breaks and wrap up your shift.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-[#2a2e37] dark:bg-[#181a1e]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-[#262a31]'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.slice(0, 3)}</span>
            </button>
          );
        })}
      </div>

      {error && activeTab === 'entry' && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {activeTab === 'entry' && (
        <div className="flex flex-col gap-5">
          <ShiftHeader value={shift} onChange={handleUpdateShift} />

          <LegForm
            initialValues={editingValues}
            onAdd={handleAddLeg}
            onCancelEdit={() => {
              setEditingId(null);
              setEditingValues(undefined);
            }}
          />

          <LegTable legs={legs} onDelete={handleDeleteLeg} onEdit={handleEditLeg} />

          <BreaksTravelTime
            value={summary}
            legs={legs}
            startTime={shift.startTime}
            onChange={handleSummaryChange}
          />

          <GeneralDetails value={summary} onChange={handleSummaryChange} />

          {!wrapUpVisible && legs.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setWrapUpVisible(true)}
                className={ui.btnPrimary}
              >
                Proceed to Shift Wrap-up
              </button>
            </div>
          )}

          {wrapUpVisible && (
            <ShiftSummary
              key={summaryKey}
              odometerStart={startOdometer}
              value={summary}
              onChange={(next) => setSummary((prev) => ({ ...prev, ...next }))}
              onSave={handleSave}
              canSave={canSave}
              loading={loading}
            />
          )}
        </div>
      )}

      {activeTab === 'history' && <DriverHistory />}

      {activeTab === 'summary' && <DriverSummary shift={shift} legs={legs} summary={summary} />}
    </div>
  );
}
