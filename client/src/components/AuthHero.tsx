import { Truck } from 'lucide-react';

export default function AuthHero() {
  return (
    <div className="relative hidden h-full w-full overflow-hidden lg:flex">
      <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#020617]" />

      <Truck
        size={420}
        strokeWidth={0.8}
        className="absolute -bottom-10 -right-10 rotate-[-10deg] text-emerald-700/20"
      />

      <div className="absolute inset-0 flex items-center justify-center p-12">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
            <Truck size={32} className="text-emerald-100" />
          </div>
          <h2 className="text-3xl font-bold text-white">Velocity Taxi Trucks</h2>
          <p className="mt-2 text-lg font-medium text-emerald-100">Fleet Management System</p>
          <p className="mt-6 text-sm leading-relaxed text-emerald-50/80">
            Streamline your daily runsheets, track kilometres, manage tolls, and keep your fleet
            moving with confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
