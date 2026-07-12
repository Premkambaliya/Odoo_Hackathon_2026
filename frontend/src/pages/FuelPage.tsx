import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, X } from 'lucide-react';

interface Vehicle { id: string; registration_number: string; name_model: string; }

export default function FuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vehicle_id: '', liters: '', cost: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get('/vehicles').then(setVehicles).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccessMsg('');
    try {
      await api.post('/fuel', {
        vehicle_id: form.vehicle_id,
        liters: Number(form.liters),
        cost: Number(form.cost),
      });
      setShowModal(false);
      setForm({ vehicle_id: '', liters: '', cost: '' });
      setSuccessMsg('Fuel log recorded successfully! Expense has been auto-created.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  return (
    <>
      <div className="topbar"><h1>Fuel Logs</h1></div>
      <div className="page-content">
        <div className="page-header">
          <h2>Fuel Management</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Fuel Log
          </button>
        </div>

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--secondary-light)', color: '#065F46', marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid #6EE7B7' }}>
            ✅ {successMsg}
          </div>
        )}

        {loading ? <p>Loading...</p> : (
          <div className="table-wrapper animate-in">
            <table>
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Model</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.registration_number}</strong></td>
                    <td>{v.name_model}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setForm({ ...form, vehicle_id: v.id }); setShowModal(true); }}>
                        Log Fuel
                      </button>
                    </td>
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
                <h2>Record Fuel Log</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>
              {error && <div className="error-box">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Vehicle</label>
                  <select className="form-select" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Liters</label>
                    <input className="form-input" type="number" step="0.1" value={form.liters} onChange={e => setForm({ ...form, liters: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost ($)</label>
                    <input className="form-input" type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} required />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Fuel Log'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
