import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../services/auth';
import { ui } from '../lib/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      navigate(user.role === 'ADMIN' ? '/admin' : '/driver');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const socialBtn =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-[#2a2e37] dark:bg-[#181a1e] dark:text-slate-200 dark:hover:bg-[#262a31]';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-[#141619]">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1f24] rounded-2xl shadow-xl border border-slate-100 dark:border-[#2a2e37] p-8">
        <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Truck size={22} />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Velocity Taxi Trucks
            </span>
          </div>

            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className={ui.subtitle}>Log in to manage your daily runsheets.</p>

            {error && (
              <div className="mb-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="email" className={ui.label}>
                  Email
                </label>
                <div className="relative mt-1">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${ui.input} pl-10`}
                    placeholder="driver@velocity.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={ui.label}>
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${ui.input} pl-10 pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-slate-600 dark:bg-[#181a1e]"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className={`${ui.btnPrimary} w-full`}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-[#2a2e37]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 dark:bg-[#1c1f24] dark:text-slate-400">
                    or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" className={socialBtn}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
                <button type="button" className={socialBtn}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.05 20.28c-.99.95-2.08 1.45-3.27 1.45-1.74 0-3.02-.83-3.91-1.72-.92-.92-1.68-2.23-1.68-3.72 0-1.63.99-3.08 2.42-3.96.55-.35 1.16-.56 1.82-.62v-.02c.01-.09.03-.17.03-.26 0-.66-.29-1.26-.75-1.67-.46-.41-1.1-.68-1.8-.68-.66 0-1.26.25-1.72.66-.45.4-.74.96-.77 1.59 0 .09.01.17.03.26l-.01.02C8.34 9.33 7.36 8.34 7.36 7.1c0-1.9 1.55-3.45 3.45-3.45 1.2 0 2.26.61 2.89 1.54.63-.93 1.69-1.54 2.89-1.54 1.9 0 3.45 1.55 3.45 3.45 0 .58-.15 1.13-.41 1.61.7.55 1.15 1.39 1.15 2.33 0 .66-.29 1.26-.75 1.67-.46.41-1.1.68-1.8.68-.66 0-1.26-.25-1.72-.66-.45-.4-.74-.96-.77-1.59 0-.09-.01-.17-.03-.26l.01-.02c-.02-.09-.03-.17-.03-.26 0-1.24.98-2.23 2.22-2.23.67 0 1.27.3 1.68.78.41-.48 1.01-.78 1.68-.78 1.24 0 2.22.99 2.22 2.23 0 .66-.29 1.26-.75 1.67-.46.41-1.1.68-1.8.68-.66 0-1.26-.25-1.72-.66-.45-.4-.74-.96-.77-1.59z" />
                  </svg>
                  Apple
                </button>
              </div>
            </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Contact your fleet manager
            </Link>
          </p>
      </div>
    </div>
  );
}
