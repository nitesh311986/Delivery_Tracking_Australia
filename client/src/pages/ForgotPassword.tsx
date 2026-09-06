import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Mail, Truck } from 'lucide-react';
import AuthHero from '../components/AuthHero';
import { ui } from '../lib/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call; wire up to auth service when backend reset flow is available.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-[#141619]">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 xl:w-5/12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Truck size={22} />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Velocity Taxi Trucks
            </span>
          </div>

          <div className={ui.card}>
            <Link
              to="/login"
              className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>

            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Reset your password
            </h1>
            <p className={ui.subtitle}>
              Enter your email and we&apos;ll send a reset link if your account exists.
            </p>

            {submitted ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-emerald-50 p-6 text-center dark:bg-emerald-900/20">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
                  <CheckCircle size={24} className="text-emerald-700 dark:text-emerald-300" />
                </div>
                <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  Check your inbox
                </h2>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  A password reset link has been sent to {email}.
                </p>
              </div>
            ) : (
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

                <button type="submit" disabled={loading} className={`${ui.btnPrimary} w-full`}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <AuthHero />
    </div>
  );
}
