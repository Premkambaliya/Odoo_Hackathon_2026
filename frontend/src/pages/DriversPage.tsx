import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, X } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: string;
  user?: { email: string };
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'badge-success',
  ON_TRIP: 'badge-info',
  OFF_DUTY: 'badge-neutral',
  SUSPENDED: 'badge-danger',
};

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'password123', license_number: '', license_category: 'Heavy', license_expiry_date: '', contact_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDrivers = () => {
    api.get('/drivers').then(setDrivers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/drivers', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: 'password123', license_number: '', license_category: 'Heavy', license_expiry_date: '', contact_number: '' });
      fetchDrivers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (driver: Driver) => {
    const newStatus = driver.status === 'SUSPENDED' ? 'AVAILABLE' : 'SUSPENDED';
    try {
      await api.put(`/drivers/${driver.id}`, { status: newStatus });
      fetchDrivers();
    } catch {}
  };

  const isManager = user?.role === 'FLEET_MANAGER';

  return (
    <>
      <div className="topbar"><h1>Drivers</h1></div>
      <div className="page-content">
        <div className="page-header">
          <h2>Driver Management</h2>
          {isManager && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Driver
            </button>
          )}
        </div>

        {loading ? <p>Loading drivers...</p> : (
          <div className="table-wrapper animate-in">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>License</th>
                  <th>Category</th>
                  <th>License Expiry</th>
                  <th>Safety Score</th>
                  <th>Status</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr><td colSpan={isManager ? 8 : 7}><div className="empty-state"><p>No drivers found</p></div></td></tr>
                ) : drivers.map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.user?.email || '—'}</td>
                    <td>{d.license_number}</td>
                    <td>{d.license_category}</td>
                    <td>{new Date(d.license_expiry_date).toLocaleDateString()}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: d.safety_score >= 80 ? 'var(--secondary)' : d.safety_score >= 50 ? 'var(--accent)' : 'var(--danger)' }}>
                        {d.safety_score}
                      </span>
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[d.status] || 'badge-neutral'}`}>{d.status.replace('_', ' ')}</span></td>
                    {isManager && (
                      <td>
                        <button className={`btn btn-sm ${d.status === 'SUSPENDED' ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleStatus(d)}>
                          {d.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    )}
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
                <h2>Add New Driver</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>
              {error && <div className="error-box">{error}</div>}
              <form onSubmit={handleCreate}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">License Number</label>
                    <input className="form-input" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Category</label>
                    <select className="form-select" value={form.license_category} onChange={e => setForm({ ...form, license_category: e.target.value })}>
                      <option>Heavy</option><option>Light</option><option>Medium</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">License Expiry Date</label>
                    <input className="form-input" type="date" value={form.license_expiry_date} onChange={e => setForm({ ...form, license_expiry_date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input className="form-input" value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} required />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Driver'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
