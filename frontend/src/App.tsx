import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelPage from './pages/FuelPage';
import VehicleDetailsPage from './pages/VehicleDetailsPage';
import DriverDetailsPage from './pages/DriverDetailsPage';
import DriverPortalLayout from './layouts/DriverPortalLayout';
import DriverDashboardPage from './pages/DriverDashboardPage';
import DriverCurrentTripPage from './pages/DriverCurrentTripPage';
import DriverCreateInternalTripPage from './pages/DriverCreateInternalTripPage';
import DriverTripHistoryPage from './pages/DriverTripHistoryPage';
import DriverProfilePage from './pages/DriverProfilePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    if (user.role === 'DRIVER') return <Navigate to="/driver/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  const isDriver = user?.role === 'DRIVER';

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Admin / Manager layout */}
      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailsPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/drivers/:id" element={<DriverDetailsPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/fuel" element={<FuelPage />} />
      </Route>

      {/* Driver portal layout */}
      <Route element={<PrivateRoute><DriverPortalLayout /></PrivateRoute>}>
        <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
        <Route path="/driver/current-trip" element={<DriverCurrentTripPage />} />
        <Route path="/driver/create-internal" element={<DriverCreateInternalTripPage />} />
        <Route path="/driver/trips" element={<DriverTripHistoryPage />} />
        <Route path="/driver/profile" element={<DriverProfilePage />} />
      </Route>

      <Route path="/" element={<Navigate to={isDriver ? '/driver/dashboard' : '/dashboard'} replace />} />
      <Route path="*" element={<Navigate to={isDriver ? '/driver/dashboard' : '/dashboard'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
