import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, X, CheckCircle } from 'lucide-react';

interface Vehicle { id: string; registration_number: string; name_model: string; status: string; }
interface MaintenanceLog {
  id: string; description: string; cost: number; start_date: string; end_date: string | null;
  is_active: boolean; vehicle_id: string;
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vehicle_id: '', description: '', cost: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [v] = await Promise.all([api.get('/vehicles')]);
      setVehicles(v);
      // Maintenance logs — we need to fetch from vehicles that are in shop or have logs
      // For now we fetch all vehicles and their maintenance data
      // The backend doesn't have a GET /maintenance endpoint, so we'll work with what we have
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const startMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post('/maintenance', {
        vehicle_id: form.vehicle_id,
        description: form.description,
        cost: Number(form.cost),
      });
      setShowModal(false);
      setForm({ vehicle_id: '', description: '', cost: '' });
      fetchData();
      alert('Maintenance started! Vehicle is now IN_SHOP.');
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const isManager = user?.role === 'FLEET_MANAGER';
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const inShopVehicles = vehicles.filter(v => v.status === 'IN_SHOP');

  return (
    <>
      <div className="topbar"><h1>Maintenance</h1></div>
      <div className="page-content">
        <div className="page-header">
          <h2>Maintenance Center</h2>
          {isManager && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Start Maintenance
            </button>
          )}
        </div>

        {loading ? <p>Loading...</p> : (
          <>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
              Vehicles Currently In Shop ({inShopVehicles.length})
            </h3>
            {inShopVehicles.length === 0 ? (
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="empty-state"><p>No vehicles currently in maintenance</p></div>
              </div>
            ) : (
              <div className="table-wrapper animate-in" style={{ marginBottom: '2rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Registration</th>
                      <th>Model</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inShopVehicles.map(v => (
                      <tr key={v.id}>
                        <td><strong>{v.registration_number}</strong></td>
                        <td>{v.name_model}</td>
                        <td><span className="badge badge-warning">IN SHOP</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
              All Vehicles Status
            </h3>
            <div className="table-wrapper animate-in">
              <table>
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Model</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id}>
                      <td><strong>{v.registration_number}</strong></td>
                      <td>{v.name_model}</td>
                      <td>{(v as any).type}</td>
                      <td>
                        <span className={`badge ${v.status === 'AVAILABLE' ? 'badge-success' : v.status === 'IN_SHOP' ? 'badge-warning' : v.status === 'ON_TRIP' ? 'badge-info' : 'badge-neutral'}`}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Start Maintenance</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>
              {error && <div className="error-box">{error}</div>}
              <form onSubmit={startMaintenance}>
                <div className="form-group">
                  <label className="form-label">Vehicle (Available only)</label>
                  <select className="form-select" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
                    <option value="">Select vehicle...</option>
                    {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Engine Replacement" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Cost ($)</label>
                  <input className="form-input" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning" disabled={submitting}>{submitting ? 'Starting...' : 'Start Maintenance'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
