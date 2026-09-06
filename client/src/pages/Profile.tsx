import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save } from 'lucide-react';
import { ui } from '../lib/ui';

type ProfileField = {
  label: string;
  key: string;
  value: string;
  editable: boolean;
  type?: string;
};

export default function Profile() {
  const { user } = useAuth();

  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  const fields: ProfileField[] = [
    { label: 'Full Name', key: 'fullName', value: user?.fullName ?? '', editable: false },
    { label: 'Email', key: 'email', value: user?.email ?? '', editable: false },
    { label: 'Phone Number', key: 'phone', value: phone, editable: true, type: 'tel' },
    { label: 'Business Name', key: 'businessName', value: user?.businessName ?? '', editable: false },
    { label: 'Default Yard / Depot Location', key: 'yardLocation', value: user?.yardLocation ?? '', editable: false },
    { label: 'Rego', key: 'rego', value: user?.rego ?? '', editable: false },
    { label: 'Subcontractor Name', key: 'subcontractorName', value: user?.subcontractorName ?? '', editable: false },
  ];

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaving(false);
    setSaved(true);
  };

  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setPwMessage('New passwords do not match.');
      return;
    }
    if (passwords.new.length < 6) {
      setPwMessage('Password must be at least 6 characters.');
      return;
    }
    setPwMessage('Password changed successfully.');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <main className="mx-auto max-w-3xl p-4 pb-safe sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-glow">
          <User size={24} />
        </div>
        <h1 className={ui.title}>Profile</h1>
      </div>

      <form onSubmit={handleSave} className={`${ui.card} mb-6`}>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Driver / Admin Details
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key}>
              <label className={ui.label} htmlFor={field.key}>
                {field.label}
              </label>
              <input
                id={field.key}
                type={field.type ?? 'text'}
                value={field.value}
                onChange={(e) => field.editable && handlePhoneChange(e.target.value)}
                readOnly={!field.editable}
                disabled={!field.editable}
                className={`${ui.input} mt-1 ${
                  field.editable
                    ? ''
                    : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-500 dark:border-[#262930] dark:bg-[#181a1e] dark:text-slate-500'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Changes saved.</span>}
        </div>
      </form>

      <form onSubmit={handlePassword} className={ui.card}>
        <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Lock size={18} />
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={ui.label} htmlFor="current">
              Current Password
            </label>
            <input
              id="current"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              className={`${ui.input} mt-1`}
              required
            />
          </div>
          <div>
            <label className={ui.label} htmlFor="new">
              New Password
            </label>
            <input
              id="new"
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
              className={`${ui.input} mt-1`}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={ui.label} htmlFor="confirm">
              Confirm New Password
            </label>
            <input
              id="confirm"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className={`${ui.input} mt-1`}
              required
            />
          </div>
        </div>

        {pwMessage && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-[#2a2e37] dark:bg-[#181a1e] dark:text-slate-300">
            {pwMessage}
          </div>
        )}

        <div className="mt-6">
          <button type="submit" className={ui.btnPrimary}>
            <Lock size={16} />
            Change Password
          </button>
        </div>
      </form>
    </main>
  );
}
