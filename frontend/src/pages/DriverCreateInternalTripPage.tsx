import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AlertCircle, ChevronLeft } from 'lucide-react';

export default function DriverCreateInternalTripPage() {
  const navigate = useNavigate();
  const [lastVehicle, setLastVehicle] = useState<string>('Loading assigned fleet vehicle...');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    source: '',
    destination: '',
    planned_distance: '',
    reason: 'Parking Movement',
    remarks: '',
  });

  const reasons = [
    'Parking Movement',
    'Service Visit',
    'Fuel Filling',
    'Branch Transfer',
    'Vehicle Inspection',
    'Vehicle Washing',
    'Test Drive',
    'Other'
  ];

  useEffect(() => {
    // Fetch dashboard info to get their last vehicle
    api.get('/driver-portal/dashboard')
      .then(dash => {
        setLastVehicle(dash.kpis.assignedVehicle);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (lastVehicle === '—' || lastVehicle.includes('Loading')) {
      setError('You do not have an associated vehicle. Please contact administrator to assign a vehicle first.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/driver-portal/trips/internal', {
        source: form.source,
        destination: form.destination,
        planned_distance: Number(form.planned_distance) || 0,
        reason: form.reason,
        remarks: form.remarks,
      });
      navigate('/driver/current-trip');
    } catch (err: any) {
      setError(err.message || 'Failed to start internal trip');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div><p style={{ color: 'var(--text-secondary)' }}>Loading form settings...</p></div>;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/driver/dashboard')} style={{ padding: '0.4rem 0.5rem' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Log Internal Vehicle Move</h2>
      </div>

      {error && (
        <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="form-group">
            <label className="form-label">Trip Type</label>
            <input className="form-input" value="Internal Trip (Vehicle Movement)" disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Active Vehicle (Read Only)</label>
            <input className="form-input" value={lastVehicle} style={{ fontWeight: 600 }} disabled />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              * Trip movements will update the odometer logs of this vehicle.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Movement Reason</label>
            <select className="form-select" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
              {reasons.map((r, i) => <option key={i} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source Location *</label>
              <input className="form-input" placeholder="e.g. Parking Yard / Warehouse" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Location *</label>
              <input className="form-input" placeholder="e.g. Workshop / Washing area" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Planned Distance (km)</label>
            <input className="form-input" type="number" placeholder="Estimated distance" value={form.planned_distance} onChange={e => setForm({ ...form, planned_distance: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks & Movement Scope</label>
            <textarea className="form-input" style={{ minHeight: '60px', fontFamily: 'inherit' }} placeholder="Provide any internal remarks..." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })}></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }} disabled={submitting}>
            {submitting ? 'Starting movement...' : 'Dispatch Movement'}
          </button>
        </form>
      </div>

    </div>
  );
}
