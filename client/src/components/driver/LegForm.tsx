import { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Package,
  Truck,
  User,
} from 'lucide-react';
import { type LegType, type RunsheetLegItem } from '../../types/runsheet';
import { ui } from '../../lib/ui';

export type DraftLeg = Omit<RunsheetLegItem, 'id' | 'runsheetId' | 'createdAt'>;

interface LegFormProps {
  initialValues?: DraftLeg;
  onAdd: (leg: DraftLeg) => void;
  onCancelEdit?: () => void;
}

const defaultLeg: DraftLeg = {
  legOrder: 0,
  type: 'PICKUP',
  collectionCompany: '',
  collectionSuburb: '',
  deliveryCompany: '',
  deliverySuburb: '',
  arrivalTime: '',
  departureTime: '',
  authorisedPerson: '',
  itemCount: 1,
  itemDescription: '',
  notes: '',
  tollUsed: false,
  tollAmount: '',
  tollAuthorizedBy: '',
};

export default function LegForm({ initialValues, onAdd, onCancelEdit }: LegFormProps) {
  const [leg, setLeg] = useState<DraftLeg>(defaultLeg);

  useEffect(() => {
    if (initialValues) {
      setLeg({ ...defaultLeg, ...initialValues });
    } else {
      setLeg(defaultLeg);
    }
  }, [initialValues]);

  const update = <K extends keyof DraftLeg>(key: K, value: DraftLeg[K]) => {
    setLeg((prev) => ({ ...prev, [key]: value }));
  };

  const handleTollToggle = (value: 'yes' | 'no') => {
    const tollUsed = value === 'yes';
    setLeg((prev) => ({
      ...prev,
      tollUsed,
      tollAmount: tollUsed ? prev.tollAmount : '',
      tollAuthorizedBy: tollUsed ? prev.tollAuthorizedBy : '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leg.type === 'PICKUP') {
      if (!leg.collectionCompany.trim() || !leg.collectionSuburb.trim()) return;
    } else if (leg.type === 'DELIVERY') {
      if (!leg.deliveryCompany.trim() || !leg.deliverySuburb.trim()) return;
    }
    onAdd({
      ...leg,
      notes: leg.notes?.trim() || null,
      tollAmount: leg.tollUsed ? leg.tollAmount : '',
      tollAuthorizedBy: leg.tollUsed ? leg.tollAuthorizedBy?.trim() || null : null,
    });
    setLeg(defaultLeg);
  };

  const typeBtn = (type: LegType) => {
    const active = leg.type === type;
    const Icon = type === 'PICKUP' ? Truck : CheckCircle2;
    const label = type === 'PICKUP' ? 'Pick Up' : 'Delivery';
    return (
      <button
        key={type}
        type="button"
        onClick={() => update('type', type)}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
          active ? ui.pillActive : ui.pillInactive
        }`}
      >
        <Icon size={16} />
        {label}
      </button>
    );
  };

  const inputWrap = (Icon: typeof Building2, children: React.ReactNode, className = '') => (
    <div className={`relative ${className}`}>
      <Icon
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className={ui.card}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {initialValues ? 'Edit Leg' : 'Add Leg'}
        </h2>
        {initialValues && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mb-5 flex gap-2">
        {(['PICKUP', 'DELIVERY'] as LegType[]).map((t) => typeBtn(t))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {leg.type === 'PICKUP' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className={ui.label}>Collection Company</label>
              {inputWrap(
                Building2,
                <input
                  type="text"
                  value={leg.collectionCompany}
                  onChange={(e) => update('collectionCompany', e.target.value)}
                  className={`${ui.input} pl-10`}
                  required
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={ui.label}>Collection Suburb</label>
              {inputWrap(
                MapPin,
                <input
                  type="text"
                  value={leg.collectionSuburb}
                  onChange={(e) => update('collectionSuburb', e.target.value)}
                  className={`${ui.input} pl-10`}
                  required
                />
              )}
            </div>
          </>
        )}

        {leg.type === 'DELIVERY' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className={ui.label}>Delivery Company</label>
              {inputWrap(
                Building2,
                <input
                  type="text"
                  value={leg.deliveryCompany}
                  onChange={(e) => update('deliveryCompany', e.target.value)}
                  className={`${ui.input} pl-10`}
                  required
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={ui.label}>Delivery Suburb</label>
              {inputWrap(
                MapPin,
                <input
                  type="text"
                  value={leg.deliverySuburb}
                  onChange={(e) => update('deliverySuburb', e.target.value)}
                  className={`${ui.input} pl-10`}
                  required
                />
              )}
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Arrival Time</label>
          {inputWrap(
            Clock,
            <input
              type="time"
              value={leg.arrivalTime}
              onChange={(e) => update('arrivalTime', e.target.value)}
              className={`${ui.input} pl-10`}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Departure Time</label>
          {inputWrap(
            Clock,
            <input
              type="time"
              value={leg.departureTime}
              onChange={(e) => update('departureTime', e.target.value)}
              className={`${ui.input} pl-10`}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Authorised Person</label>
          {inputWrap(
            User,
            <input
              type="text"
              value={leg.authorisedPerson ?? ''}
              onChange={(e) => update('authorisedPerson', e.target.value)}
              className={`${ui.input} pl-10`}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Number of Items</label>
          {inputWrap(
            Package,
            <input
              type="number"
              min={0}
              value={leg.itemCount}
              onChange={(e) => update('itemCount', Math.max(0, Number(e.target.value)))}
              className={`${ui.input} pl-10`}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={ui.label}>Item Description</label>
          {inputWrap(
            Package,
            <input
              type="text"
              value={leg.itemDescription ?? ''}
              onChange={(e) => update('itemDescription', e.target.value)}
              className={`${ui.input} pl-10`}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={ui.label}>Stop Notes / Instructions</label>
          <textarea
            value={leg.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            className={ui.input}
          />
        </div>

        <div className="flex flex-col gap-3 sm:col-span-2">
          <label className={ui.label}>Have you used toll to get here?</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTollToggle('yes')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                leg.tollUsed ? ui.pillActive : ui.pillInactive
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleTollToggle('no')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                !leg.tollUsed ? ui.pillActive : ui.pillInactive
              }`}
            >
              No
            </button>
          </div>

          <div
            className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
              leg.tollUsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0">
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={ui.label}>Toll Amount ($)</label>
                  {inputWrap(
                    DollarSign,
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={leg.tollAmount ?? ''}
                      onChange={(e) => update('tollAmount', e.target.value)}
                      className={`${ui.input} pl-10`}
                      required={leg.tollUsed}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={ui.label}>Authorized By</label>
                  {inputWrap(
                    User,
                    <input
                      type="text"
                      value={leg.tollAuthorizedBy ?? ''}
                      onChange={(e) => update('tollAuthorizedBy', e.target.value)}
                      className={`${ui.input} pl-10`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className={ui.btnPrimary}>
          {initialValues ? 'Update Leg' : 'Add Leg'}
        </button>
        {initialValues && onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className={ui.btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
