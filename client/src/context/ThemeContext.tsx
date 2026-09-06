import {
  createContext,
  useContext,
  useLayoutEffect,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'theme_preference';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<ResolvedTheme>(() => getSystemTheme());
  const [ready, setReady] = useState(false);

  const resolve = useCallback((t: Theme): ResolvedTheme => {
    return t === 'system' ? getSystemTheme() : t;
  }, []);

  useLayoutEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
    const initial = resolve(stored);
    setThemeState(stored);
    setResolved(initial);
    applyTheme(initial);
    setReady(true);
  }, [resolve]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setThemeState((current) => {
        if (current !== 'system') return current;
        const next: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolved(next);
        applyTheme(next);
        return current;
      });
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      localStorage.setItem(STORAGE_KEY, next);
      setThemeState(next);
      const r = resolve(next);
      setResolved(r);
      applyTheme(r);
    },
    [resolve]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {ready ? children : <div className="min-h-screen bg-[#f8fafc] dark:bg-[#141619]" />}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
