import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  AlertCircle, Fuel, DollarSign, Gauge, CheckSquare, Navigation, X
} from 'lucide-react';

interface Vehicle {
  registration_number: string;
  manufacturer: string;
  name_model: string;
  odometer: number;
  fuel_type: string;
}

interface Trip {
  id: string;
  trip_type: string;
  reason: string | null;
  source: string;
  destination: string;
  cargo_weight: number;
  planned_distance: number;
  status: string;
  start_time: string | null;
  start_odometer: number | null;
  vehicle: Vehicle;
}

export default function DriverCurrentTripPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState<'fuel' | 'expense' | 'odometer' | 'complete' | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fuel form
  const [fuelForm, setFuelForm] = useState({ fuel_station: '', liters: '', cost: '', odometer: '', remarks: '' });
  const [fuelFile, setFuelFile] = useState<File | null>(null);

  // Expense form
  const [expenseForm, setExpenseForm] = useState({ amount: '', expense_type: 'Toll', remarks: '' });
  const [expenseFile, setExpenseFile] = useState<File | null>(null);

  // Odometer form
  const [odoForm, setOdoForm] = useState({ odometer: '', remarks: '' });

  // Complete Form
  const [completeForm, setCompleteForm] = useState({ final_odometer: '', fuel_consumed: '', remarks: '' });
  const [proofFile, setProofFile] = useState<File | null>(null);

  const fetchActiveTrip = () => {
    setLoading(true);
    api.get('/driver-portal/trips/active')
      .then(setTrip)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActiveTrip();
  }, []);

  const handleOpenModal = (type: 'fuel' | 'expense' | 'odometer' | 'complete') => {
    setModalError('');
    setActiveModal(type);
    if (type === 'fuel') {
      setFuelForm({ fuel_station: '', liters: '', cost: '', odometer: trip?.vehicle.odometer.toString() || '', remarks: '' });
      setFuelFile(null);
    } else if (type === 'expense') {
      setExpenseForm({ amount: '', expense_type: 'Toll', remarks: '' });
      setExpenseFile(null);
    } else if (type === 'odometer') {
      setOdoForm({ odometer: trip?.vehicle.odometer.toString() || '', remarks: '' });
    } else if (type === 'complete') {
      setCompleteForm({ final_odometer: trip?.vehicle.odometer.toString() || '', fuel_consumed: '', remarks: '' });
      setProofFile(null);
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');
    try {
      const formData = new FormData();
      formData.append('fuel_station', fuelForm.fuel_station);
      formData.append('liters', fuelForm.liters);
      formData.append('cost', fuelForm.cost);
      if (fuelForm.odometer) formData.append('odometer', fuelForm.odometer);
      formData.append('remarks', fuelForm.remarks);
      if (fuelFile) formData.append('receipt', fuelFile);

      await api.post(`/driver-portal/trips/${trip?.id}/fuel`, formData);
      setActiveModal(null);
      fetchActiveTrip();
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit fuel log');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');
    try {
      const formData = new FormData();
      formData.append('amount', expenseForm.amount);
      formData.append('expense_type', expenseForm.expense_type.toUpperCase());
      formData.append('remarks', expenseForm.remarks);
      if (expenseFile) formData.append('receipt', expenseFile);

      await api.post(`/driver-portal/trips/${trip?.id}/expense`, formData);
      setActiveModal(null);
      fetchActiveTrip();
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit expense entry');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOdometerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');

    if (Number(odoForm.odometer) < (trip?.vehicle.odometer || 0)) {
      setModalError('Odometer reading cannot be lower than the current odometer (' + trip?.vehicle.odometer + ' km)');
      setModalSubmitting(false);
      return;
    }

    try {
      await api.post(`/driver-portal/trips/${trip?.id}/odometer`, {
        odometer: Number(odoForm.odometer),
        remarks: odoForm.remarks
      });
      setActiveModal(null);
      fetchActiveTrip();
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit odometer log');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');

    const finalVal = Number(completeForm.final_odometer);
    const startVal = trip?.start_odometer || trip?.vehicle.odometer || 0;

    if (finalVal < startVal) {
      setModalError(`Final odometer cannot be lower than the start odometer (${startVal} km)`);
      setModalSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('final_odometer', completeForm.final_odometer);
      if (completeForm.fuel_consumed) formData.append('fuel_consumed', completeForm.fuel_consumed);
      formData.append('remarks', completeForm.remarks);
      if (proofFile) formData.append('proof', proofFile);

      await api.put(`/driver-portal/trips/${trip?.id}/complete`, formData);
      setActiveModal(null);
      setTrip(null);
    } catch (err: any) {
      setModalError(err.message || 'Failed to complete trip');
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) return <div><p style={{ color: 'var(--text-secondary)' }}>Loading active trip details...</p></div>;

  // Empty State - No active trip
  if (!trip) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto'
        }}>
          <Navigation size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Active Trip Dispatched</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0.5rem auto 0 auto' }}>
            You do not have any active customer deliveries or vehicle moves running.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '280px', margin: '0 auto', width: '100%' }}>
          <button className="btn btn-primary" onClick={() => navigate('/driver/create-internal')} style={{ padding: '0.75rem' }}>
            Move Vehicle (Internal Move)
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/driver/dashboard')} style={{ padding: '0.75rem' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isInternal = trip.trip_type === 'INTERNAL';

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Active Trip Header */}
      <div className="card" style={{ background: 'linear-gradient(to right, var(--primary), #3730A3)', color: 'white', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
            {isInternal ? 'INTERNAL MOVEMENT' : 'DELIVERY TRIP'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Active Trip ID: #{trip.id.substring(0, 8)}</span>
        </div>
        <div style={{ margin: '1rem 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
          <span>{trip.source}</span>
          <Navigation size={16} style={{ transform: 'rotate(90deg)' }} />
          <span>{trip.destination}</span>
        </div>
        {isInternal && trip.reason && (
          <div style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.15)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
            Reason: <strong>{trip.reason}</strong>
          </div>
        )}
      </div>

      {/* Details Specs Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', margin: 0 }}>
          Trip Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>Dispatched Vehicle:</span> <strong style={{ display: 'block' }}>{trip.vehicle.manufacturer} {trip.vehicle.name_model} ({trip.vehicle.registration_number})</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Start Time:</span> <strong style={{ display: 'block' }}>{trip.start_time ? new Date(trip.start_time).toLocaleString() : '—'}</strong></div>
          {!isInternal && <div><span style={{ color: 'var(--text-secondary)' }}>Cargo Weight:</span> <strong style={{ display: 'block' }}>{trip.cargo_weight.toLocaleString()} kg</strong></div>}
          <div><span style={{ color: 'var(--text-secondary)' }}>Planned Distance:</span> <strong style={{ display: 'block' }}>{trip.planned_distance} km</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Start Odometer:</span> <strong style={{ display: 'block' }}>{trip.start_odometer || trip.vehicle.odometer} km</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Fuel Type:</span> <strong style={{ display: 'block' }}>{trip.vehicle.fuel_type}</strong></div>
        </div>
      </div>

      {/* Driver Actions Timeline Checklist */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>Active Trip Steps</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Step 1: Dispatched */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ color: 'var(--success)' }}><CheckSquare size={18} /></div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Trip Dispatched</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Odometer captured: {trip.start_odometer || trip.vehicle.odometer} km</div>
            </div>
          </div>

          {/* Step 2: Fuel Log */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ color: 'var(--primary)' }}><Fuel size={18} /></div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Add Fuel Refill (Optional)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Log fuel slips and receipts during transit</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenModal('fuel')} style={{ marginLeft: 'auto' }}>Add Fuel</button>
          </div>

          {/* Step 3: Expenses */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderLeft: '4px solid var(--info)' }}>
            <div style={{ color: 'var(--info)' }}><DollarSign size={18} /></div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Add Toll / Parking Costs</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Record highway expenses with receipts</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenModal('expense')} style={{ marginLeft: 'auto' }}>Add Expense</button>
          </div>

          {/* Step 4: Odometer Logs */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ color: 'var(--accent)' }}><Gauge size={18} /></div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Report Current Odometer</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last updated: {trip.vehicle.odometer} km</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenModal('odometer')} style={{ marginLeft: 'auto' }}>Log Odo</button>
          </div>

          {/* Step 5: Complete Trip */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#FEE2E2', borderLeft: '4px solid var(--danger)' }}>
            <div style={{ color: 'var(--danger)' }}><CheckSquare size={18} /></div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991B1B' }}>Finish & Complete Trip</div>
              <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>Update final odometer and complete movement</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => handleOpenModal('complete')} style={{ marginLeft: 'auto' }}>Complete</button>
          </div>

        </div>
      </div>

      {/* FUEL LOG MODAL */}
      {activeModal === 'fuel' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Fuel Entry</h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            {modalError && <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.5rem', margin: '0.5rem 0', fontSize: '0.8rem' }}><AlertCircle size={14} /> {modalError}</div>}
            <form onSubmit={handleFuelSubmit} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Fuel Station Name</label>
                <input className="form-input" placeholder="e.g. Indian Oil, HP" value={fuelForm.fuel_station} onChange={e => setFuelForm({ ...fuelForm, fuel_station: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity (Liters) *</label>
                  <input className="form-input" type="number" step="0.01" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Cost (₹) *</label>
                  <input className="form-input" type="number" step="0.01" value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Odometer Reading (km)</label>
                <input className="form-input" type="number" value={fuelForm.odometer} onChange={e => setFuelForm({ ...fuelForm, odometer: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Upload Fuel Slip Receipt</label>
                <input type="file" className="form-input" accept="image/*,.pdf" onChange={e => setFuelFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input className="form-input" placeholder="e.g. Card payment, full tank" value={fuelForm.remarks} onChange={e => setFuelForm({ ...fuelForm, remarks: e.target.value })} />
              </div>
              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>{modalSubmitting ? 'Logging...' : 'Save Fuel Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE LOG MODAL */}
      {activeModal === 'expense' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Trip Expense</h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            {modalError && <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.5rem', margin: '0.5rem 0', fontSize: '0.8rem' }}><AlertCircle size={14} /> {modalError}</div>}
            <form onSubmit={handleExpenseSubmit} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Expense Category</label>
                <select className="form-select" value={expenseForm.expense_type} onChange={e => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}>
                  <option>Toll</option>
                  <option>Parking</option>
                  <option>Food</option>
                  <option>Repair</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input className="form-input" type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Upload Expense Receipt</label>
                <input type="file" className="form-input" accept="image/*,.pdf" onChange={e => setExpenseFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input className="form-input" placeholder="e.g. NH4 Toll booth" value={expenseForm.remarks} onChange={e => setExpenseForm({ ...expenseForm, remarks: e.target.value })} />
              </div>
              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>{modalSubmitting ? 'Logging...' : 'Save Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ODOMETER UPDATE MODAL */}
      {activeModal === 'odometer' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Odometer Reading</h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            {modalError && <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.5rem', margin: '0.5rem 0', fontSize: '0.8rem' }}><AlertCircle size={14} /> {modalError}</div>}
            <form onSubmit={handleOdometerSubmit} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Current Odometer Value (km) *</label>
                <input className="form-input" type="number" value={odoForm.odometer} onChange={e => setOdoForm({ ...odoForm, odometer: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input className="form-input" placeholder="e.g. Midway check-point" value={odoForm.remarks} onChange={e => setOdoForm({ ...odoForm, remarks: e.target.value })} />
              </div>
              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>{modalSubmitting ? 'Saving...' : 'Update Odometer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE TRIP MODAL */}
      {activeModal === 'complete' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Active Trip</h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            {modalError && <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.5rem', margin: '0.5rem 0', fontSize: '0.8rem' }}><AlertCircle size={14} /> {modalError}</div>}
            <form onSubmit={handleCompleteSubmit} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Final Odometer Value (km) *</label>
                <input className="form-input" type="number" value={completeForm.final_odometer} onChange={e => setCompleteForm({ ...completeForm, final_odometer: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Fuel Consumed (Liters)</label>
                <input className="form-input" type="number" placeholder="Enter total liters (optional)" value={completeForm.fuel_consumed} onChange={e => setCompleteForm({ ...completeForm, fuel_consumed: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Upload Delivery Proof / Final Odo Photo</label>
                <input type="file" className="form-input" accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label className="form-label">Trip Remarks</label>
                <input className="form-input" placeholder="e.g. Delivered successfully, no issues" value={completeForm.remarks} onChange={e => setCompleteForm({ ...completeForm, remarks: e.target.value })} />
              </div>
              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={modalSubmitting}>{modalSubmitting ? 'Completing...' : 'Mark Completed'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
