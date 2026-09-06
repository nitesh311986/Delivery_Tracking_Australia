import { useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, Truck, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminDrivers from './pages/AdminDrivers';
import DriverDashboard from './pages/DriverDashboard';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';

function getDashboardPath(role) {
  return role === 'ADMIN' ? '/admin' : '/driver';
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <RootRedirect />;
  return <Login />;
}

function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass =
    'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-[#262a31] dark:hover:text-emerald-400';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-[#2a2e37] dark:bg-[#1c1f24]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Truck size={18} />
          </div>
          <span className="hidden sm:inline">Velocity Taxi Trucks</span>
          <span className="sm:hidden">Velocity</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle showLabels={false} />

          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 md:hidden dark:text-slate-300"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav
            className={`${
              mobileMenuOpen ? 'flex' : 'hidden'
            } absolute left-0 right-0 top-16 flex-col gap-1 border-b border-slate-200 bg-white p-4 shadow-sm md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0 md:shadow-none dark:border-[#2a2e37] dark:bg-[#1c1f24] md:dark:bg-transparent`}
          >
            {user ? (
              <>
                <Link to={getDashboardPath(user.role)} className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin/drivers" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                    Drivers
                  </Link>
                )}
                <Link to="/settings" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  Settings
                </Link>
                <button type="button" onClick={handleLogout} className={`${linkClass} w-full text-left`}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/drivers" element={<AdminDrivers />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
        <Route path="/driver" element={<DriverDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DRIVER']} />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:hidden dark:border-[#2a2e37] dark:bg-[#1c1f24]/80">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <Truck size={20} className="text-emerald-600" />
          <span>Velocity</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle showLabels={false} />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 dark:text-slate-300"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-h-screen flex-1 p-4 pb-safe sm:p-6 lg:p-8 md:ml-64">
        <AppRoutes />
      </div>
    </>
  );
}

function PublicShell() {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-4rem)]">
        <AppRoutes />
      </div>
    </>
  );
}

function App() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#141619] dark:text-slate-100">
      {isAdmin ? <AdminShell /> : <PublicShell />}
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}

export default App;
