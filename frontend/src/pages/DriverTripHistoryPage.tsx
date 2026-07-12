import { useEffect, useState } from 'react';
import { api } from '../api';
import { Calendar, Truck, X } from 'lucide-react';

interface Vehicle {
  registration_number: string;
  manufacturer: string;
  name_model: string;
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
  end_time: string | null;
  start_odometer: number | null;
  final_odometer: number | null;
  actual_distance: number | null;
  fuel_consumed: number | null;
  fuel_cost: number | null;
  remarks: string | null;
  final_proof_path: string | null;
  vehicle: Vehicle;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-neutral',
  DISPATCHED: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELED: 'badge-danger',
};

export default function DriverTripHistoryPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    api.get('/driver-portal/trips')
      .then(res => {
        setTrips(res || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div><p style={{ color: 'var(--text-secondary)' }}>Loading trip history...</p></div>;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ marginTop: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Trip Log History</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Review all customer deliveries and internal yard movements.</p>
      </div>

      {/* Trips list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {trips.length === 0 ? (
          <div className="card" style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No historical trips logged yet.
          </div>
        ) : (
          trips.map(t => {
            const isInternal = t.trip_type === 'INTERNAL';
            return (
              <div 
                key={t.id} 
                className="card hover-row" 
                style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
                onClick={() => setSelectedTrip(t)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${isInternal ? 'badge-info' : 'badge-primary'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {isInternal ? `Internal: ${t.reason || 'Movement'}` : 'Delivery'}
                  </span>
                  <span className={`badge ${STATUS_BADGE[t.status] || 'badge-neutral'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {t.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text)' }}>
                  <span>{t.source}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>➔</span>
                  <span>{t.destination}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Truck size={12} />
                    <span>{t.vehicle.registration_number}</span>
                  </div>
                  {t.end_time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{new Date(t.end_time).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TRIP REPORT DETAIL MODAL */}
      {selectedTrip && (
        <div className="modal-overlay" onClick={() => setSelectedTrip(null)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Trip Log Summary</h2>
              <button className="modal-close" onClick={() => setSelectedTrip(null)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${selectedTrip.trip_type === 'INTERNAL' ? 'badge-info' : 'badge-primary'}`} style={{ padding: '3px 8px' }}>
                  {selectedTrip.trip_type === 'INTERNAL' ? `INTERNAL: ${selectedTrip.reason}` : 'DELIVERY TRIP'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{selectedTrip.id.substring(0, 8)}</span>
              </div>

              {/* Locations */}
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>{selectedTrip.source}</span>
                  <span>➔</span>
                  <span>{selectedTrip.destination}</span>
                </div>
              </div>

              {/* Specs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Vehicle:</span> <strong style={{ display: 'block' }}>{selectedTrip.vehicle.manufacturer} {selectedTrip.vehicle.name_model} ({selectedTrip.vehicle.registration_number})</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> <strong style={{ display: 'block', color: 'var(--success)' }}>{selectedTrip.status}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Actual Distance:</span> <strong style={{ display: 'block' }}>{selectedTrip.actual_distance !== null ? `${selectedTrip.actual_distance} km` : '—'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Planned Distance:</span> <strong style={{ display: 'block' }}>{selectedTrip.planned_distance} km</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Start Odometer:</span> <strong style={{ display: 'block' }}>{selectedTrip.start_odometer || '—'} km</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Final Odometer:</span> <strong style={{ display: 'block' }}>{selectedTrip.final_odometer || '—'} km</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Fuel Log:</span> <strong style={{ display: 'block' }}>{selectedTrip.fuel_consumed !== null ? `${selectedTrip.fuel_consumed} Liters` : '—'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Fuel Cost:</span> <strong style={{ display: 'block' }}>{selectedTrip.fuel_cost !== null ? `₹${selectedTrip.fuel_cost.toLocaleString()}` : '—'}</strong></div>
              </div>

              {selectedTrip.remarks && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', background: '#FEF3C7', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                  <span style={{ fontWeight: 600, color: '#B45309' }}>Driver Remarks:</span>
                  <span style={{ color: '#92400E' }}>{selectedTrip.remarks}</span>
                </div>
              )}

              {selectedTrip.final_proof_path && (
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Completion Receipt/Proof:</span>
                  <a href={`http://localhost:5000/${selectedTrip.final_proof_path}`} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                    Download proof file
                  </a>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
