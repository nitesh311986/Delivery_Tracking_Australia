import { CheckCircle2, MapPin, Pencil, Trash2, Truck } from 'lucide-react';
import { type RunsheetLegItem } from '../../types/runsheet';
import { ui } from '../../lib/ui';

interface LegTableProps {
  legs: RunsheetLegItem[];
  onDelete: (id: string) => void;
  onEdit: (leg: RunsheetLegItem) => void;
}

export default function LegTable({ legs, onDelete, onEdit }: LegTableProps) {
  if (legs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-[#2a2e37] dark:bg-[#181a1e] dark:text-slate-400">
        No legs added for this shift yet.
      </div>
    );
  }

  return (
    <section className={ui.card}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Today&apos;s Legs
      </h2>
      <ul className="flex flex-col gap-3">
        {legs
          .slice()
          .sort((a, b) => a.legOrder - b.legOrder)
          .map((leg, index) => {
            const isPickup = leg.type === 'PICKUP';
            const company = isPickup ? leg.collectionCompany : leg.deliveryCompany;
            const suburb = isPickup ? leg.collectionSuburb : leg.deliverySuburb;
            const Icon = isPickup ? Truck : CheckCircle2;

            return (
              <li
                key={leg.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2a2e37] dark:bg-[#181a1e] sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={isPickup ? ui.badgeGreen : ui.badgeAmber}>
                      <Icon size={12} />
                      {isPickup ? 'Pick Up' : 'Delivery'}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {index + 1}. {company}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {suburb || '—'}
                    </span>
                    <span>
                      {leg.arrivalTime || '—'} to {leg.departureTime || '—'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Items: {leg.itemCount}
                    {leg.itemDescription ? ` — ${leg.itemDescription}` : ''}
                  </p>
                  {leg.notes && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Notes: {leg.notes}
                    </p>
                  )}
                  {leg.tollUsed && (
                    <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Toll: ${leg.tollAmount || '0'}
                      {leg.tollAuthorizedBy ? ` — Authorised by ${leg.tollAuthorizedBy}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:self-center">
                  <button
                    type="button"
                    onClick={() => onEdit(leg)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#262a31] dark:hover:text-white"
                    aria-label="Edit leg"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(leg.id)}
                    className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-100 dark:hover:bg-rose-900/20"
                    aria-label="Delete leg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
