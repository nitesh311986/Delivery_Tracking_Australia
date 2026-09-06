import DriverRunsheet from '../components/driver/DriverRunsheet';
import { ui } from '../lib/ui';

export default function DriverDashboard() {
  return (
    <main className={`${ui.page} pb-safe`}>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <DriverRunsheet />
      </div>
    </main>
  );
}
