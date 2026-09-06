import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, UserX, UserCheck, X, Save, Loader2 } from 'lucide-react';
import {
  type AdminDriver,
  type AdminDriverCreateInput,
  type AdminDriverUpdateInput,
  getAdminDrivers,
  createAdminDriver,
  updateAdminDriver,
  deactivateAdminDriver,
  extractApiError,
} from '../services/admin';
import { ui } from '../lib/ui';

type ModalMode = 'create' | 'edit';

interface DriverFormData {
  fullName: string;
  email: string;
  temporaryPassword: string;
  rego: string;
  subcontractorName: string;
  businessName: string;
  yardLocation: string;
  isActive: boolean;
}

const emptyForm: DriverFormData = {
  fullName: '',
  email: '',
  temporaryPassword: '',
  rego: '',
  subcontractorName: '',
  businessName: '',
  yardLocation: '',
  isActive: true,
};

function toInput(form: DriverFormData): AdminDriverCreateInput {
  return {
    fullName: form.fullName,
    email: form.email,
    temporaryPassword: form.temporaryPassword,
    rego: form.rego || undefined,
    subcontractorName: form.subcontractorName || undefined,
    businessName: form.businessName || undefined,
    yardLocation: form.yardLocation || undefined,
  };
}

function toUpdateInput(form: DriverFormData): AdminDriverUpdateInput {
  const input: AdminDriverUpdateInput = {};
  if (form.fullName) input.fullName = form.fullName;
  if (form.email) input.email = form.email;
  if (form.rego) input.rego = form.rego;
  if (form.subcontractorName) input.subcontractorName = form.subcontractorName;
  if (form.businessName) input.businessName = form.businessName;
  if (form.yardLocation) input.yardLocation = form.yardLocation;
  input.isActive = form.isActive;
  return input;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={isActive ? ui.statusCompleted : ui.statusDraft}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function DriverModal({
  mode,
  driver,
  onClose,
  onSaved,
}: {
  mode: ModalMode;
  driver: AdminDriver | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<DriverFormData>(() => {
    if (!driver) return emptyForm;
    return {
      fullName: driver.fullName,
      email: driver.email,
      temporaryPassword: '',
      rego: driver.rego ?? '',
      subcontractorName: driver.subcontractorName ?? '',
      businessName: driver.businessName ?? '',
      yardLocation: driver.yardLocation ?? '',
      isActive: driver.isActive,
    };
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === 'create') {
        if (!form.fullName || !form.email || !form.temporaryPassword) {
          toast.error('Full name, email and a temporary password are required');
          return;
        }
        await createAdminDriver(toInput(form));
        toast.success('Driver created');
      } else if (driver) {
        await updateAdminDriver(driver.id, toUpdateInput(form));
        toast.success('Driver updated');
      }
      onSaved();
      onClose();
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof DriverFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#2a2e37] dark:bg-[#1c1f24]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {mode === 'create' ? 'Add Driver' : 'Edit Driver'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#262a31]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={ui.label}>Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className={ui.input}
                required
              />
            </div>
            <div>
              <label className={ui.label}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={ui.input}
                required
              />
            </div>
            {mode === 'create' && (
              <div>
                <label className={ui.label}>Temporary Password</label>
                <input
                  type="text"
                  value={form.temporaryPassword}
                  onChange={(e) => update('temporaryPassword', e.target.value)}
                  className={ui.input}
                  required
                  minLength={6}
                />
              </div>
            )}
            <div>
              <label className={ui.label}>Rego</label>
              <input
                type="text"
                value={form.rego}
                onChange={(e) => update('rego', e.target.value)}
                className={ui.input}
              />
            </div>
            <div>
              <label className={ui.label}>Subcontractor Name</label>
              <input
                type="text"
                value={form.subcontractorName}
                onChange={(e) => update('subcontractorName', e.target.value)}
                className={ui.input}
              />
            </div>
            <div>
              <label className={ui.label}>Business Name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                className={ui.input}
              />
            </div>
            <div>
              <label className={ui.label}>Yard Base</label>
              <input
                type="text"
                value={form.yardLocation}
                onChange={(e) => update('yardLocation', e.target.value)}
                className={ui.input}
              />
            </div>
            {mode === 'edit' && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => update('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-slate-600 dark:bg-[#181a1e]"
                />
                <label htmlFor="isActive" className={ui.label}>
                  Account active
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={ui.btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={ui.btnPrimary}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; mode: ModalMode; driver: AdminDriver | null }>(
    {
      open: false,
      mode: 'create',
      driver: null,
    }
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDrivers();
      setDrivers(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => setModal({ open: true, mode: 'create', driver: null });
  const openEdit = (driver: AdminDriver) => setModal({ open: true, mode: 'edit', driver });
  const closeModal = () => setModal({ open: false, mode: 'create', driver: null });

  const toggleStatus = async (driver: AdminDriver) => {
    try {
      if (driver.isActive) {
        await deactivateAdminDriver(driver.id);
        toast.success('Driver deactivated');
      } else {
        await updateAdminDriver(driver.id, { isActive: true });
        toast.success('Driver activated');
      }
      await load();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const tableRowClass =
    'odd:bg-white even:bg-slate-50 hover:bg-slate-100 dark:odd:bg-[#1c1f24] dark:even:bg-[#181a1e] dark:hover:bg-[#262a31]';

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={ui.title}>Driver Management</h1>
          <p className={ui.subtitle}>Create, update and deactivate driver accounts.</p>
        </div>
        <button type="button" onClick={openCreate} className={ui.btnPrimary}>
          <Plus size={16} />
          Add Driver
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-[#2a2e37] dark:bg-[#1c1f24]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-[#2a2e37]">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#181a1e]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Driver
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Rego
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Subcontractor
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Business
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Yard Base
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Shifts
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2a2e37]">
              {loading && drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 size={20} className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className={tableRowClass}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{driver.fullName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{driver.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={driver.isActive} />
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{driver.rego ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {driver.subcontractorName ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {driver.businessName ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {driver.yardLocation ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{driver.totalShifts}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(driver)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#262a31] dark:hover:text-white"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(driver)}
                          className={`rounded-lg p-2 ${
                            driver.isActive
                              ? 'text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20'
                              : 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'
                          }`}
                          title={driver.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {driver.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && drivers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No drivers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <DriverModal mode={modal.mode} driver={modal.driver} onClose={closeModal} onSaved={load} />
      )}
    </div>
  );
}
