import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Car, Truck, Users, Route, Clock, Activity, DollarSign, Gauge
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface KPIs {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenanceVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: string;
  totalOperationalCost: number;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(data => { setKpis(data.kpis); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content"><p>Loading dashboard...</p></div>;
  if (!kpis) return <div className="page-content"><p>Failed to load dashboard</p></div>;

  const kpiCards = [
    { label: 'Active Vehicles', value: kpis.activeVehicles, icon: Car, bg: 'var(--primary-light)', color: 'var(--primary)' },
    { label: 'Available Vehicles', value: kpis.availableVehicles, icon: Truck, bg: 'var(--secondary-light)', color: 'var(--secondary)' },
    { label: 'In Maintenance', value: kpis.inMaintenanceVehicles, icon: Activity, bg: 'var(--accent-light)', color: 'var(--accent)' },
    { label: 'Active Trips', value: kpis.activeTrips, icon: Route, bg: 'var(--info-light)', color: 'var(--info)' },
    { label: 'Pending Trips', value: kpis.pendingTrips, icon: Clock, bg: '#FEF3C7', color: '#D97706' },
    { label: 'Drivers On Duty', value: kpis.driversOnDuty, icon: Users, bg: '#E0E7FF', color: '#4338CA' },
    { label: 'Fleet Utilization', value: `${kpis.fleetUtilization}%`, icon: Gauge, bg: 'var(--secondary-light)', color: 'var(--secondary)' },
    { label: 'Total Cost', value: `$${Number(kpis.totalOperationalCost).toLocaleString()}`, icon: DollarSign, bg: 'var(--danger-light)', color: 'var(--danger)' },
  ];

  const barData = [
    { name: 'Active', value: kpis.activeVehicles },
    { name: 'Available', value: kpis.availableVehicles },
    { name: 'Maintenance', value: kpis.inMaintenanceVehicles },
  ];

  const pieData = [
    { name: 'Active Trips', value: kpis.activeTrips || 0 },
    { name: 'Pending Trips', value: kpis.pendingTrips || 0 },
    { name: 'On Duty Drivers', value: kpis.driversOnDuty || 0 },
  ].filter(d => d.value > 0);

  return (
    <>
      <div className="topbar"><h1>Dashboard</h1></div>
      <div className="page-content">
        <div className="kpi-grid animate-in">
          {kpiCards.map((kpi, i) => (
            <div className="kpi-card" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                <kpi.icon size={24} />
              </div>
              <div>
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="card animate-in">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Vehicle Status Overview</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card animate-in">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Operations Breakdown</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No active operations</p></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
