import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Send, CheckCircle, XCircle } from 'lucide-react';

interface Vehicle { id: string; registration_number: string; name_model: string; max_load_capacity: number; status: string; }
interface Driver { id: string; name: string; status: string; license_expiry_date: string; }
interface Trip {
  id: string; source: string; destination: string; cargo_weight: number;
  planned_distance: number; status: string; start_time: string | null; end_time: string | null;
  vehicle?: Vehicle; driver?: Driver;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-neutral',
  DISPATCHED: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export default function TripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showComplete, setShowComplete] = useState<string | null>(null);
  const [form, setForm] = useState({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
  const [completeForm, setCompleteForm] = useState({ final_odometer: '', fuel_consumed: '', fuel_cost: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [capacityWarning, setCapacityWarning] = useState('');

  const fetchAll = async () => {
    try {
      const [t, v, d] = await Promise.all([api.get('/trips'), api.get('/vehicles'), api.get('/drivers')]);
      setTrips(t); setVehicles(v); setDrivers(d);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // Validate cargo weight against vehicle capacity in real-time
  useEffect(() => {
    if (form.vehicle_id && form.cargo_weight) {
      const v = vehicles.find(v => v.id === form.vehicle_id);
      if (v && Number(form.cargo_weight) > v.max_load_capacity) {
        setCapacityWarning(`Exceeds capacity! Max: ${v.max_load_capacity} kg`);
      } else {
        setCapacityWarning('');
      }
    } else {
      setCapacityWarning('');
    }
  }, [form.vehicle_id, form.cargo_weight, vehicles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capacityWarning) return;
    setSubmitting(true); setError('');
    try {
      await api.post('/trips', {
        ...form,
        cargo_weight: Number(form.cargo_weight),
        planned_distance: Number(form.planned_distance),
      });
      setShowCreate(false);
      setForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
      fetchAll();
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const dispatch = async (id: string) => {
    try { await api.put(`/trips/${id}/dispatch`); fetchAll(); } catch (err: any) { alert(err.message); }
  };

  const complete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showComplete) return;
    setSubmitting(true); setError('');
    try {
      await api.put(`/trips/${showComplete}/complete`, {
        final_odometer: Number(completeForm.final_odometer),
        fuel_consumed: Number(completeForm.fuel_consumed),
        fuel_cost: Number(completeForm.fuel_cost),
      });
      setShowComplete(null);
      setCompleteForm({ final_odometer: '', fuel_consumed: '', fuel_cost: '' });
      fetchAll();
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this trip?')) return;
    try { await api.put(`/trips/${id}/cancel`); fetchAll(); } catch (err: any) { alert(err.message); }
  };

  const isManager = user?.role === 'FLEET_MANAGER';
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const availableDrivers = drivers.filter((d: any) => d.status === 'AVAILABLE');

  return (
    <>
      <div className="topbar"><h1>Trips</h1></div>
      <div className="page-content">
        <div className="page-header">
          <h2>Trip Dispatch Center</h2>
          {isManager && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Trip
            </button>
          )}
        </div>

        {loading ? <p>Loading trips...</p> : (
          <div className="table-wrapper animate-in">
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Cargo (kg)</th>
                  <th>Distance</th>
                  <th>Status</th>
                  <th>Start</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr><td colSpan={isManager ? 8 : 7}><div className="empty-state"><p>No trips found</p></div></td></tr>
                ) : trips.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.source}</strong> → {t.destination}</td>
                    <td>{t.vehicle?.registration_number || '—'}</td>
                    <td>{t.driver?.name || '—'}</td>
                    <td>{t.cargo_weight.toLocaleString()}</td>
                    <td>{t.planned_distance} km</td>
                    <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status}</span></td>
                    <td>{t.start_time ? new Date(t.start_time).toLocaleString() : '—'}</td>
                    {isManager && (
                      <td>
                        <div className="btn-group">
                          {t.status === 'DRAFT' && (
                            <button className="btn btn-sm btn-success" onClick={() => dispatch(t.id)} title="Dispatch">
                              <Send size={14} /> Dispatch
                            </button>
                          )}
                          {t.status === 'DISPATCHED' && (
                            <button className="btn btn-sm btn-primary" onClick={() => setShowComplete(t.id)} title="Complete">
                              <CheckCircle size={14} /> Complete
                            </button>
                          )}
                          {(t.status === 'DRAFT' || t.status === 'DISPATCHED') && (
                            <button className="btn btn-sm btn-danger" onClick={() => cancel(t.id)} title="Cancel">
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Trip Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Trip</h2>
                <button className="modal-close" onClick={() => setShowCreate(false)}><X size={16} /></button>
              </div>
              {error && <div className="error-box">{error}</div>}
              <form onSubmit={handleCreate}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Source</label>
                    <input className="form-input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input className="form-input" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Vehicle (Available only)</label>
                    <select className="form-select" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
                      <option value="">Select vehicle...</option>
                      {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model} (Max: {v.max_load_capacity}kg)</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driver (Available only)</label>
                    <select className="form-select" value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })} required>
                      <option value="">Select driver...</option>
                      {availableDrivers.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cargo Weight (kg)</label>
                    <input className="form-input" type="number" value={form.cargo_weight} onChange={e => setForm({ ...form, cargo_weight: e.target.value })} required />
                    {capacityWarning && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 500 }}>⚠️ {capacityWarning}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Planned Distance (km)</label>
                    <input className="form-input" type="number" value={form.planned_distance} onChange={e => setForm({ ...form, planned_distance: e.target.value })} required />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting || !!capacityWarning}>{submitting ? 'Creating...' : 'Create Trip'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complete Trip Modal */}
        {showComplete && (
          <div className="modal-overlay" onClick={() => setShowComplete(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Complete Trip</h2>
                <button className="modal-close" onClick={() => setShowComplete(null)}><X size={16} /></button>
              </div>
              {error && <div className="error-box">{error}</div>}
              <form onSubmit={complete}>
                <div className="form-group">
                  <label className="form-label">Final Odometer Reading</label>
                  <input className="form-input" type="number" value={completeForm.final_odometer} onChange={e => setCompleteForm({ ...completeForm, final_odometer: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fuel Consumed (liters)</label>
                    <input className="form-input" type="number" value={completeForm.fuel_consumed} onChange={e => setCompleteForm({ ...completeForm, fuel_consumed: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fuel Cost ($)</label>
                    <input className="form-input" type="number" value={completeForm.fuel_cost} onChange={e => setCompleteForm({ ...completeForm, fuel_cost: e.target.value })} required />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowComplete(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={submitting}>{submitting ? 'Completing...' : 'Mark Complete'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
