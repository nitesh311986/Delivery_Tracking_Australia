import { Building2, Car, MapPin, Briefcase } from 'lucide-react';
import { type CompleteRunsheetRequest } from '../../types/runsheet';
import { ui } from '../../lib/ui';

interface GeneralDetailsProps {
  value: CompleteRunsheetRequest;
  onChange: (next: Partial<CompleteRunsheetRequest>) => void;
}

const fields: {
  key: keyof CompleteRunsheetRequest;
  label: string;
  icon: typeof Building2;
}[] = [
  { key: 'subcontractorName', label: 'Subcontractor Name', icon: Building2 },
  { key: 'rego', label: 'Rego', icon: Car },
  { key: 'businessName', label: 'Your Business Name', icon: Briefcase },
  { key: 'yardLocation', label: 'Yard / Base Location', icon: MapPin },
];

export default function GeneralDetails({ value, onChange }: GeneralDetailsProps) {
  const update = <K extends keyof CompleteRunsheetRequest>(
    key: K,
    val: CompleteRunsheetRequest[K]
  ) => {
    onChange({ [key]: val } as Partial<CompleteRunsheetRequest>);
  };

  return (
    <section className={ui.card}>
      <h3 className={ui.sectionTitle}>Vehicle & Subcontractor Details</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className={ui.label}>{label}</label>
            <div className="relative">
              <Icon
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={(value[key] as string | undefined) ?? ''}
                onChange={(e) => update(key, e.target.value as CompleteRunsheetRequest[typeof key])}
                className={`${ui.input} pl-10`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
