import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, type Theme } from '../context/ThemeContext';

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
];

interface ThemeToggleProps {
  showLabels?: boolean;
  className?: string;
}

export default function ThemeToggle({ showLabels = true, className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-[#2a2e37] dark:bg-[#181a1e] ${className}`}
      role="group"
      aria-label="Theme preference"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-3 ${
              active
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-[#1c1f24] dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            aria-pressed={active}
            title={opt.label}
          >
            <Icon size={14} />
            {showLabels && <span className="hidden sm:inline">{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
