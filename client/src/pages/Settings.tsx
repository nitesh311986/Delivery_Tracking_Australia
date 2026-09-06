import { useEffect, useState } from 'react';
import { Clock, Ruler, Mail, Settings2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { ui } from '../lib/ui';

type TimeFormat = '12h' | '24h';
type DistanceUnit = 'km' | 'mi';

const SETTINGS_KEY = 'velocity-settings';

interface SavedSettings {
  timeFormat: TimeFormat;
  distanceUnit: DistanceUnit;
  emailReceipts: boolean;
}

const defaultSettings: SavedSettings = {
  timeFormat: '12h',
  distanceUnit: 'km',
  emailReceipts: true,
};

function loadSettings(): SavedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: SavedSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between dark:border-[#2a2e37]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-emerald-600 dark:bg-[#181a1e] dark:text-emerald-400">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function PillToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-[#2a2e37] dark:bg-[#181a1e]">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-[#1c1f24] dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<SavedSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  const update = <K extends keyof SavedSettings>(key: K, value: SavedSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value } as SavedSettings;
      saveSettings(next);
      return next;
    });
  };

  if (!loaded) return null;

  return (
    <main className="mx-auto max-w-3xl p-4 pb-safe sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-glow">
          <Settings2 size={24} />
        </div>
        <div>
          <h1 className={ui.title}>Settings</h1>
          <p className={ui.subtitle}>Customise how the app looks and feels.</p>
        </div>
      </div>

      <div className={ui.card}>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Preferences
        </h2>
        <p className={ui.subtitle}>Manage your display and notification settings.</p>

        <SettingRow
          icon={<Settings2 size={18} />}
          title="Theme"
          description="Choose how Velocity appears for you."
        >
          <ThemeToggle showLabels />
        </SettingRow>

        <SettingRow
          icon={<Clock size={18} />}
          title="Time Format"
          description="Display times in 12-hour or 24-hour format."
        >
          <PillToggle<TimeFormat>
            value={settings.timeFormat}
            options={[
              { value: '12h', label: '12h' },
              { value: '24h', label: '24h' },
            ]}
            onChange={(v) => update('timeFormat', v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Ruler size={18} />}
          title="Distance Units"
          description="Choose how distances are displayed."
        >
          <PillToggle<DistanceUnit>
            value={settings.distanceUnit}
            options={[
              { value: 'km', label: 'Kilometres' },
              { value: 'mi', label: 'Miles' },
            ]}
            onChange={(v) => update('distanceUnit', v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Mail size={18} />}
          title="Notifications"
          description="Receive email receipts when a runsheet is completed."
        >
          <button
            type="button"
            onClick={() => update('emailReceipts', !settings.emailReceipts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              settings.emailReceipts
                ? 'bg-emerald-600'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-pressed={settings.emailReceipts}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                settings.emailReceipts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </SettingRow>
      </div>
    </main>
  );
}
