import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  Activity, Truck, Route, Calendar, DollarSign, Award, AlertTriangle, ChevronRight,
  ClipboardList, PlusCircle, History, UserCheck
} from 'lucide-react';

interface KPIs {
  status: string;
  assignedVehicle: string;
  activeTrip: string;
  tripsThisMonth: number;
  currentMonthSalary: number;
  safetyScore: number;
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'badge-success',
  ON_TRIP: 'badge-info',
  OFF_DUTY: 'badge-warning',
  SUSPENDED: 'badge-danger',
};

export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/driver-portal/dashboard')
      .then(res => {
        setKpis(res.kpis);
        setAlerts(res.alerts || []);
        setNotifications(res.notifications || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div><p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p></div>;
  if (!kpis) return <div><p style={{ color: 'var(--text-secondary)' }}>Failed to load dashboard metrics.</p></div>;

  const getSafetyBadge = (score: number) => {
    if (score >= 90) return 'badge-success';
    if (score >= 75) return 'badge-warning';
    return 'badge-danger';
  };

  const quickActions = [
    { label: 'Open Active Trip', description: 'Log fuel, expenses, and verify steps', path: '/driver/current-trip', icon: ClipboardList, color: 'var(--primary)' },
    { label: 'Create Internal Trip', description: 'Log company yard / service moves', path: '/driver/create-internal', icon: PlusCircle, color: 'var(--secondary)' },
    { label: 'View Trip History', description: 'Log files of previous assignments', path: '/driver/trips', icon: History, color: 'var(--info)' },
    { label: 'My Profile Info', description: 'Verify license details and Aadhaar', path: '/driver/profile', icon: UserCheck, color: 'var(--accent)' }
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Welcome Banner */}
      <div style={{ marginTop: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Driver Portal Dashboard</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log updates, manage vehicle movements, and track payouts.</p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        
        <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Activity size={14} /> Status
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>
            <span className={`badge ${STATUS_BADGE[kpis.status] || 'badge-neutral'}`} style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
              {kpis.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Award size={14} /> Safety Rating
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>
            <span className={`badge ${getSafetyBadge(kpis.safetyScore)}`} style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
              {kpis.safetyScore} pts
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Truck size={14} /> Assigned Vehicle
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
            {kpis.assignedVehicle}
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Route size={14} /> Current Active Trip
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: kpis.activeTrip !== 'None' ? 'var(--primary)' : 'var(--text-secondary)', marginTop: '2px' }}>
            {kpis.activeTrip}
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Calendar size={14} /> Trips (Month)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
            {kpis.tripsThisMonth} Completed
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <DollarSign size={14} /> Disbursed (Month)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '2px' }}>
            ₹{kpis.currentMonthSalary.toLocaleString()}
          </div>
        </div>

      </div>

      {/* Critical Warnings Alert Panel */}
      {alerts.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#B45309', margin: '0 0 0.5rem 0' }}>
            <AlertTriangle size={14} /> ATTENTION REQUIRED
          </h4>
          <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.75rem', color: '#92400E', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
          </ul>
        </div>
      )}

      {/* Touch-friendly Quick Actions Grid */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {quickActions.map((act, i) => {
            const ActIcon = act.icon;
            return (
              <div 
                key={i}
                className="card hover-row" 
                style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                onClick={() => navigate(act.path)}
              >
                <div style={{ background: 'var(--border)', color: act.color, padding: '0.5rem', borderRadius: '8px' }}>
                  <ActIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{act.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{act.description}</div>
                </div>
                <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications Feed */}
      {notifications.length > 0 && (
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' }}>Recent Notifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map((notif, i) => (
              <div key={i} style={{ fontSize: '0.77rem', padding: '0.5rem', background: '#F8FAFC', borderLeft: '3px solid var(--primary)', borderRadius: '4px', color: 'var(--text)' }}>
                {notif}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
