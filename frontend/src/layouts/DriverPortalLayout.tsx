import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Route, History, User, LogOut, Truck } from 'lucide-react';

export default function DriverPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'DR';

  return (
    <div className="driver-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      
      {/* Top Header */}
      <header className="topbar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        background: 'white',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem', borderRadius: '6px' }}>
            <Truck size={18} />
          </div>
          <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>TransitOps</strong>
          <span style={{ fontSize: '0.75rem', background: '#E0E7FF', color: '#4338CA', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Driver Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}>
              {initials}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)' }}>
              {user?.email.split('@')[0]}
            </span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content" style={{ flex: 1, padding: '1rem 1rem 5rem 1rem', maxWidth: '768px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* Mobile-first Bottom Navigation Bar */}
      <nav className="bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.5rem 0',
        zIndex: 100,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}>
        <NavLink to="/driver/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          textDecoration: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.7rem',
          flex: 1
        }}>
          {({ isActive }) => (
            <>
              <LayoutDashboard size={20} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
              <span style={{ color: isActive ? 'var(--primary)' : 'inherit', fontWeight: isActive ? 600 : 500 }}>Dashboard</span>
            </>
          )}
        </NavLink>

        <NavLink to="/driver/current-trip" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          textDecoration: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.7rem',
          flex: 1
        }}>
          {({ isActive }) => (
            <>
              <Route size={20} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
              <span style={{ color: isActive ? 'var(--primary)' : 'inherit', fontWeight: isActive ? 600 : 500 }}>Active Trip</span>
            </>
          )}
        </NavLink>

        <NavLink to="/driver/trips" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          textDecoration: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.7rem',
          flex: 1
        }}>
          {({ isActive }) => (
            <>
              <History size={20} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
              <span style={{ color: isActive ? 'var(--primary)' : 'inherit', fontWeight: isActive ? 600 : 500 }}>History</span>
            </>
          )}
        </NavLink>

        <NavLink to="/driver/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          textDecoration: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.7rem',
          flex: 1
        }}>
          {({ isActive }) => (
            <>
              <User size={20} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
              <span style={{ color: isActive ? 'var(--primary)' : 'inherit', fontWeight: isActive ? 600 : 500 }}>Profile</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
