import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, X } from 'lucide-react';

interface Vehicle {
  id: string;
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: string;
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'badge-success',
  ON_TRIP: 'badge-info',
  IN_SHOP: 'badge-warning',
  RETIRED: 'badge-neutral',
};

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ registration_number: '', name_model: '', type: 'Truck', max_load_capacity: '', acquisition_cost: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchVehicles = () => {
    api.get('/vehicles').then(setVehicles).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/vehicles', {
        ...form,
        max_load_capacity: Number(form.max_load_capacity),
        acquisition_cost: Number(form.acquisition_cost),
      });
      setShowModal(false);
      setForm({ registration_number: '', name_model: '', type: 'Truck', max_load_capacity: '', acquisition_cost: '' });
      fetchVehicles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isManager = user?.role === 'FLEET_MANAGER';

  return (
    <>
      <div className="topbar"><h1>Vehicles</h1></div>
      <div className="page-content">
        <div className="page-header">
          <h2>Fleet Inventory</h2>
          {isManager && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Vehicle
            </button>
          )}
        </div>

        {loading ? <p>Loading vehicles...</p> : (
          <div className="table-wrapper animate-in">
            <table>
              <thead>
                <tr>
                  <th>Reg. Number</th>
                  <th>Model</th>
                  <th>Type</th>
                  <th>Max Load (kg)</th>
                  <th>Odometer</th>
                  <th>Acquisition Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><p>No vehicles found</p></div></td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.registration_number}</strong></td>
                    <td>{v.name_model}</td>
                    <td>{v.type}</td>
                    <td>{v.max_load_capacity.toLocaleString()}</td>
                    <td>{v.odometer.toLocaleString()} km</td>
                    <td>${v.acquisition_cost.toLocaleString()}</td>
                    <td><span className={`badge ${STATUS_BADGE[v.status] || 'badge-neutral'}`}>{v.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Vehicle</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>
              {error && <div className="error-box">{error}</div>}
              <form onSubmit={handleCreate}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Registration Number</label>
                    <input className="form-input" value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model Name</label>
                    <input className="form-input" value={form.name_model} onChange={e => setForm({ ...form, name_model: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option>Truck</option><option>Van</option><option>Bus</option><option>Car</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Load Capacity (kg)</label>
                    <input className="form-input" type="number" value={form.max_load_capacity} onChange={e => setForm({ ...form, max_load_capacity: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Acquisition Cost ($)</label>
                  <input className="form-input" type="number" value={form.acquisition_cost} onChange={e => setForm({ ...form, acquisition_cost: e.target.value })} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Vehicle'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
