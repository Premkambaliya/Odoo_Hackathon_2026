import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Truck, LayoutDashboard, Car, Users, Route, Wrench, Fuel, LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER'] },
  { to: '/vehicles', label: 'Vehicles', icon: Car, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { to: '/drivers', label: 'Drivers', icon: Users, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { to: '/trips', label: 'Trips', icon: Route, roles: ['FLEET_MANAGER', 'DRIVER'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { to: '/fuel', label: 'Fuel Logs', icon: Fuel, roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleNav = NAV_ITEMS.filter(item => user && item.roles.includes(user.role));

  const roleName = user?.role.replace('_', ' ') || '';
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="icon-box"><Truck size={22} /></div>
          <h2>TransitOps</h2>
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-meta">
              <div className="email">{user?.email}</div>
              <div className="role-tag">{roleName}</div>
            </div>
            <button onClick={handleLogout} className="modal-close" title="Logout" style={{ flexShrink: 0 }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
