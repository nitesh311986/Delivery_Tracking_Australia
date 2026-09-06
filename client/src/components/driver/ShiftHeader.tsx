import { Calendar, Clock, Gauge, User } from 'lucide-react';
import { type ShiftMetadata } from '../../types/runsheet';
import { ui } from '../../lib/ui';

interface ShiftHeaderProps {
  value: ShiftMetadata;
  onChange: (next: Partial<ShiftMetadata>) => void;
}

const fields: { key: keyof ShiftMetadata; label: string; type: string; icon: typeof Calendar }[] = [
  { key: 'shiftDate', label: 'Shift Date', type: 'date', icon: Calendar },
  { key: 'driverName', label: 'Driver Name', type: 'text', icon: User },
  { key: 'odometerStart', label: 'Odometer Start', type: 'number', icon: Gauge },
  { key: 'startTime', label: 'Start Time', type: 'time', icon: Clock },
];

export default function ShiftHeader({ value, onChange }: ShiftHeaderProps) {
  return (
    <section className={ui.card}>
      <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Initial Shift
      </h2>
      <p className={ui.subtitle}>Enter the basics to start your runsheet.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type, icon: Icon }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label htmlFor={key} className={ui.label}>
              {label}
            </label>
            <div className="relative">
              <Icon
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id={key}
                type={type}
                value={value[key] ?? ''}
                onChange={(e) => onChange({ [key]: e.target.value } as Partial<ShiftMetadata>)}
                className={`${ui.input} pl-10`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
