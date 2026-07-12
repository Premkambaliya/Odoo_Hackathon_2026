import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  Wrench, Route, Fuel, Activity, FileText, ChevronLeft, Calendar, File,
  ArrowRight, Landmark, Settings, AlertTriangle, X
} from 'lucide-react';

interface VehicleDetails {
  id: string;
  registration_number: string;
  name_model: string;
  manufacturer: string;
  type: string;
  fuel_type: string;
  acquisition_date: string | null;
  acquisition_cost: number;
  odometer: number;
  max_load_capacity: number;
  status: string;
  description: string | null;
  internal_remarks: string | null;
  rc_number: string;
  rc_file_path: string;
  insurance_company: string | null;
  insurance_policy_num: string | null;
  insurance_type: string | null;
  insurance_start_date: string | null;
  insurance_expiry_date: string | null;
  insurance_file_path: string;
  puc_number: string | null;
  puc_expiry_date: string | null;
  puc_file_path: string;
  permit_number: string | null;
  permit_expiry_date: string | null;
  permit_file_path: string | null;
  createdAt: string;
  assigned_driver: string;
  current_trip: any;
}

interface Stats {
  totalTrips: number;
  totalDistance: number;
  fuelEfficiency: string;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOperationalCost: number;
}

interface MaintenanceLog {
  id: string;
  description: string;
  cost: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  maintenance_type: string | null;
  garage: string | null;
  odometer: number | null;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  cargo_weight: number;
  planned_distance: number;
  actual_distance: number | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  fuel_consumed: number | null;
  fuel_cost: number | null;
  trip_type?: string;
  reason?: string | null;
  driver?: { name: string };
}

interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  date: string;
  fuel_station: string | null;
  odometer: number | null;
}

interface Expense {
  id: string;
  expense_type: string;
  amount: number;
  date: string;
  description: string | null;
}

const TABS = [
  { id: 'status', label: 'Current Status', icon: Activity },
  { id: 'docs', label: 'Documents', icon: FileText },
  { id: 'maintenance', label: 'Maintenance Logs', icon: Wrench },
  { id: 'trips', label: 'Trip History', icon: Route },
  { id: 'expenses', label: 'Fuel & Expenses', icon: Fuel },
];

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'badge-success',
  ON_TRIP: 'badge-info',
  IN_SHOP: 'badge-warning',
  RETIRED: 'badge-neutral',
};

export default function VehicleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Detailed Modal Views
  const [selectedMaint, setSelectedMaint] = useState<MaintenanceLog | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Document Replace Modal Form
  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState<'rc' | 'insurance' | 'puc' | 'permit'>('rc');
  const [docForm, setDocForm] = useState({
    number: '',
    company: '',
    insurance_type: 'Comprehensive',
    start_date: '',
    expiry_date: '',
  });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState('');

  const fetchDetails = () => {
    api.get(`/vehicles/${id}`)
      .then(res => {
        setVehicle(res.vehicle);
        setStats(res.stats);
        setTrips(res.trips);
        setMaintenanceLogs(res.maintenanceLogs);
        setFuelLogs(res.fuelLogs);
        setExpenses(res.expenses);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) return <div className="page-content"><p>Loading vehicle dashboard...</p></div>;
  if (!vehicle || !stats) return <div className="page-content"><p>Vehicle dashboard not found.</p></div>;

  const getDocStatus = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return { label: 'Missing / Optional', className: 'badge-neutral' };
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: 'Expired', className: 'badge-danger' };
    } else if (diffDays <= 30) {
      return { label: 'Expiring Soon', className: 'badge-warning' };
    } else {
      return { label: 'Valid', className: 'badge-success' };
    }
  };

  const handleOpenDocModal = (type: 'rc' | 'insurance' | 'puc' | 'permit') => {
    setDocType(type);
    setDocError('');
    setDocFile(null);
    if (type === 'rc') {
      setDocForm({ number: vehicle.rc_number, company: '', insurance_type: 'Comprehensive', start_date: '', expiry_date: '' });
    } else if (type === 'insurance') {
      setDocForm({
        number: vehicle.insurance_policy_num || '',
        company: vehicle.insurance_company || '',
        insurance_type: vehicle.insurance_type || 'Comprehensive',
        start_date: vehicle.insurance_start_date ? vehicle.insurance_start_date.split('T')[0] : '',
        expiry_date: vehicle.insurance_expiry_date ? vehicle.insurance_expiry_date.split('T')[0] : '',
      });
    } else if (type === 'puc') {
      setDocForm({ number: vehicle.puc_number || '', company: '', insurance_type: 'Comprehensive', start_date: '', expiry_date: vehicle.puc_expiry_date ? vehicle.puc_expiry_date.split('T')[0] : '' });
    } else {
      setDocForm({ number: vehicle.permit_number || '', company: '', insurance_type: 'Comprehensive', start_date: '', expiry_date: vehicle.permit_expiry_date ? vehicle.permit_expiry_date.split('T')[0] : '' });
    }
    setShowDocModal(true);
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocSubmitting(true);
    setDocError('');

    try {
      const formData = new FormData();
      if (docType === 'rc') {
        formData.append('rc_number', docForm.number);
        if (docFile) formData.append('rc_file', docFile);
      } else if (docType === 'insurance') {
        formData.append('insurance_company', docForm.company);
        formData.append('insurance_policy_num', docForm.number);
        formData.append('insurance_type', docForm.insurance_type);
        if (docForm.start_date) formData.append('insurance_start_date', docForm.start_date);
        if (docForm.expiry_date) formData.append('insurance_expiry_date', docForm.expiry_date);
        if (docFile) formData.append('insurance_file', docFile);
      } else if (docType === 'puc') {
        formData.append('puc_number', docForm.number);
        if (docForm.expiry_date) formData.append('puc_expiry_date', docForm.expiry_date);
        if (docFile) formData.append('puc_file', docFile);
      } else {
        formData.append('permit_number', docForm.number);
        if (docForm.expiry_date) formData.append('permit_expiry_date', docForm.expiry_date);
        if (docFile) formData.append('permit_file', docFile);
      }

      await api.put(`/vehicles/${vehicle.id}`, formData);
      setShowDocModal(false);
      fetchDetails();
    } catch (err: any) {
      setDocError(err.message || 'Failed to update document');
    } finally {
      setDocSubmitting(false);
    }
  };

  const API_SERVER = 'http://localhost:5000';

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/vehicles')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} /> Back
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {vehicle.manufacturer} {vehicle.name_model} 
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>({vehicle.registration_number})</span>
          </h1>
        </div>
      </div>

      <div className="page-content">

        {/* Tab switcher row */}
        <div className="card" style={{ padding: '0.5rem', marginBottom: '1.5rem', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {TABS.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <TabIcon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: Current Status & Analytics */}
        {activeTab === 'status' && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* KPI Cards Grid */}
            <div className="kpi-grid" style={{ marginBottom: 0 }}>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <div className="kpi-label">Current Status</div>
                  <div className="kpi-value" style={{ fontSize: '1.25rem' }}>
                    <span className={`badge ${STATUS_BADGE[vehicle.status] || 'badge-neutral'}`}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="kpi-label">Assigned Driver</div>
                  <div className="kpi-value" style={{ fontSize: '1.1rem', fontWeight: 600 }}>{vehicle.assigned_driver}</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                  <Route size={20} />
                </div>
                <div>
                  <div className="kpi-label">Current Active Trip</div>
                  <div className="kpi-value" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                    {vehicle.current_trip ? `${vehicle.current_trip.source} → ${vehicle.current_trip.destination}` : 'Unassigned'}
                  </div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                  <Settings size={20} />
                </div>
                <div>
                  <div className="kpi-label">Odometer</div>
                  <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{vehicle.odometer.toLocaleString()} km</div>
                </div>
              </div>
            </div>

            {/* Basic Spec and Cost Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="card">
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                  Specifications & Registration
                </h3>
                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Manufacturer</td><td><strong>{vehicle.manufacturer}</strong></td></tr>
                    <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Model</td><td>{vehicle.name_model}</td></tr>
                    <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Vehicle Type</td><td>{vehicle.type}</td></tr>
                    <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Fuel Type</td><td>{vehicle.fuel_type}</td></tr>
                    <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Acquisition Date</td><td>{vehicle.acquisition_date ? new Date(vehicle.acquisition_date).toLocaleDateString() : '—'}</td></tr>
                    <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Acquisition Cost</td><td>₹{vehicle.acquisition_cost.toLocaleString()}</td></tr>
                    <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Max Load Capacity</td><td>{vehicle.max_load_capacity.toLocaleString()} kg</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Quick Analytics Stats */}
              <div className="card" style={{ background: 'linear-gradient(to bottom right, var(--surface), #F8FAFC)' }}>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Fleet Operations Analytics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Trips</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>{stats.totalTrips}</div>
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Distance</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>{stats.totalDistance.toLocaleString()} km</div>
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fuel Efficiency</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px', color: 'var(--secondary)' }}>{stats.fuelEfficiency} km/L</div>
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fuel Costs</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>₹{stats.totalFuelCost.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Maintenance Costs</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px', color: 'var(--accent)' }}>₹{stats.totalMaintenanceCost.toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Operational Cost</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px', color: 'var(--danger)' }}>₹{stats.totalOperationalCost.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description & Internal Remarks */}
            {(vehicle.description || vehicle.internal_remarks) && (
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Additional Remarks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {vehicle.description && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vehicle Description</strong>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>{vehicle.description}</p>
                    </div>
                  )}
                  {vehicle.internal_remarks && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Internal Private Remarks</strong>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', background: '#FEF3C7', color: '#92400E', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #FDE68A' }}>{vehicle.internal_remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Documents Manager */}
        {activeTab === 'docs' && (
          <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            {/* RC Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <File size={18} style={{ color: 'var(--primary)' }} /> RC details
                  </h3>
                  <span className={`badge ${getDocStatus(new Date(2099, 12).toISOString()).className}`}>
                    Valid
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Registration Cert. Number: <strong style={{ color: 'var(--text)' }}>{vehicle.rc_number}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <a href={`${API_SERVER}/${vehicle.rc_file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'inline-flex', justifyContent: 'center' }}>
                  Preview / Download
                </a>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenDocModal('rc')}>Replace</button>
              </div>
            </div>

            {/* Insurance Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Landmark size={18} style={{ color: 'var(--primary)' }} /> Insurance Policy
                  </h3>
                  <span className={`badge ${getDocStatus(vehicle.insurance_expiry_date).className}`}>
                    {getDocStatus(vehicle.insurance_expiry_date).label}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Company: <strong style={{ color: 'var(--text)' }}>{vehicle.insurance_company || '—'}</strong></div>
                  <div>Policy: <strong style={{ color: 'var(--text)' }}>{vehicle.insurance_policy_num || '—'}</strong></div>
                  <div>Type: <strong style={{ color: 'var(--text)' }}>{vehicle.insurance_type || '—'}</strong></div>
                  <div>Expires: <strong style={{ color: 'var(--text)' }}>{vehicle.insurance_expiry_date ? new Date(vehicle.insurance_expiry_date).toLocaleDateString() : '—'}</strong></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <a href={`${API_SERVER}/${vehicle.insurance_file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'inline-flex', justifyContent: 'center' }}>
                  Preview / Download
                </a>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenDocModal('insurance')}>Replace</button>
              </div>
            </div>

            {/* PUC Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} style={{ color: 'var(--primary)' }} /> PUC Certificate
                  </h3>
                  <span className={`badge ${getDocStatus(vehicle.puc_expiry_date).className}`}>
                    {getDocStatus(vehicle.puc_expiry_date).label}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>PUC Number: <strong style={{ color: 'var(--text)' }}>{vehicle.puc_number || '—'}</strong></div>
                  <div>Expires: <strong style={{ color: 'var(--text)' }}>{vehicle.puc_expiry_date ? new Date(vehicle.puc_expiry_date).toLocaleDateString() : '—'}</strong></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <a href={`${API_SERVER}/${vehicle.puc_file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'inline-flex', justifyContent: 'center' }}>
                  Preview / Download
                </a>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenDocModal('puc')}>Replace</button>
              </div>
            </div>

            {/* Permit Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} style={{ color: 'var(--primary)' }} /> National Permit
                  </h3>
                  <span className={`badge ${getDocStatus(vehicle.permit_expiry_date).className}`}>
                    {getDocStatus(vehicle.permit_expiry_date).label}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Permit Number: <strong style={{ color: 'var(--text)' }}>{vehicle.permit_number || 'Not uploaded'}</strong></div>
                  <div>Expires: <strong style={{ color: 'var(--text)' }}>{vehicle.permit_expiry_date ? new Date(vehicle.permit_expiry_date).toLocaleDateString() : '—'}</strong></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {vehicle.permit_file_path ? (
                  <a href={`${API_SERVER}/${vehicle.permit_file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'inline-flex', justifyContent: 'center' }}>
                    Preview / Download
                  </a>
                ) : (
                  <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                    * Upload permit document to activate state permit.
                  </div>
                )}
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenDocModal('permit')}>
                  {vehicle.permit_file_path ? 'Replace' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Maintenance Logs */}
        {activeTab === 'maintenance' && (
          <div className="animate-in table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Maintenance Type</th>
                  <th>Garage</th>
                  <th>Cost</th>
                  <th>Odometer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state"><p>No maintenance logs for this vehicle.</p></div>
                    </td>
                  </tr>
                ) : maintenanceLogs.map(m => (
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMaint(m)} className="hover-row">
                    <td>{new Date(m.start_date).toLocaleDateString()}</td>
                    <td><strong>{m.maintenance_type || 'Routine Service'}</strong></td>
                    <td>{m.garage || '—'}</td>
                    <td>₹{m.cost.toLocaleString()}</td>
                    <td>{m.odometer ? `${m.odometer.toLocaleString()} km` : '—'}</td>
                    <td>
                      <span className={`badge ${m.is_active ? 'badge-warning' : 'badge-success'}`}>
                        {m.is_active ? 'In Shop' : 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: Trip History */}
        {activeTab === 'trips' && (
          <div className="animate-in table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Route</th>
                  <th>Type</th>
                  <th>Driver</th>
                  <th>Cargo Weight</th>
                  <th>Planned Distance</th>
                  <th>Actual Distance</th>
                  <th>Fuel Consumed</th>
                  <th>Trip Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state"><p>No trips dispatched for this vehicle.</p></div>
                    </td>
                  </tr>
                ) : trips.map(t => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTrip(t)} className="hover-row">
                    <td><strong style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>#{t.id.substring(0, 8)}</strong></td>
                    <td><strong>{t.source}</strong> <ArrowRight size={12} style={{ margin: '0 4px', verticalAlign: 'middle' }} /> {t.destination}</td>
                    <td>
                      <span className={`badge ${t.trip_type === 'INTERNAL' ? 'badge-info' : 'badge-primary'}`}>
                        {t.trip_type === 'INTERNAL' ? `Internal (${t.reason})` : 'Delivery'}
                      </span>
                    </td>
                    <td>{t.driver?.name || '—'}</td>
                    <td>{t.cargo_weight.toLocaleString()} kg</td>
                    <td>{t.planned_distance} km</td>
                    <td>{t.actual_distance ? `${t.actual_distance} km` : '—'}</td>
                    <td>{t.fuel_consumed ? `${t.fuel_consumed} L` : '—'}</td>
                    <td>
                      <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : t.status === 'DISPATCHED' ? 'badge-info' : t.status === 'CANCELLED' ? 'badge-danger' : 'badge-neutral'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: Fuel & Expenses */}
        {activeTab === 'expenses' && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Dynamic ledger totals */}
            <div className="card" style={{ background: '#F8FAFC', padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Fuel Expenses</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '2px' }}>₹{stats.totalFuelCost.toLocaleString()}</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Maintenance Expenses</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>₹{stats.totalMaintenanceCost.toLocaleString()}</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Cumulative Expenses</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)', marginTop: '2px' }}>₹{stats.totalOperationalCost.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Fuel Logs table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Fuel Refilling Logs</h3>
                </div>
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Station</th>
                        <th>Volume</th>
                        <th>Cost</th>
                        <th>Odometer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelLogs.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No refuel events logged.</td></tr>
                      ) : fuelLogs.map(f => (
                        <tr key={f.id}>
                          <td>{new Date(f.date).toLocaleDateString()}</td>
                          <td><strong>{f.fuel_station || 'Terminal Station'}</strong></td>
                          <td>{f.liters} Liters</td>
                          <td><strong>₹{f.cost.toLocaleString()}</strong></td>
                          <td>{f.odometer ? `${f.odometer.toLocaleString()} km` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Other Ledger Expenses */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Other Expenses ledger</h3>
                </div>
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Expense Category</th>
                        <th>Amount</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No other operational expenses.</td></tr>
                      ) : expenses.map(e => (
                        <tr key={e.id}>
                          <td>{new Date(e.date).toLocaleDateString()}</td>
                          <td>
                            <span className="badge badge-info">{e.expense_type}</span>
                          </td>
                          <td><strong>₹{e.amount.toLocaleString()}</strong></td>
                          <td>{e.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Maintenance Details */}
        {selectedMaint && (
          <div className="modal-overlay" onClick={() => setSelectedMaint(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Maintenance details</h2>
                <button className="modal-close" onClick={() => setSelectedMaint(null)}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <div><strong>Maintenance Type:</strong> {selectedMaint.maintenance_type || 'Routine Service'}</div>
                <div><strong>Service Provider / Garage:</strong> {selectedMaint.garage || '—'}</div>
                <div><strong>Status:</strong> <span className={`badge ${selectedMaint.is_active ? 'badge-warning' : 'badge-success'}`}>{selectedMaint.is_active ? 'In Shop (Active)' : 'Closed'}</span></div>
                <div><strong>Estimated/Actual Cost:</strong> ₹{selectedMaint.cost.toLocaleString()}</div>
                <div><strong>Service Date:</strong> {new Date(selectedMaint.start_date).toLocaleDateString()}</div>
                {selectedMaint.end_date && <div><strong>Closed Date:</strong> {new Date(selectedMaint.end_date).toLocaleDateString()}</div>}
                <div><strong>Odometer reading:</strong> {selectedMaint.odometer ? `${selectedMaint.odometer.toLocaleString()} km` : '—'}</div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <strong>Description & Scope:</strong>
                  <p style={{ background: '#F8FAFC', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', fontSize: '0.85rem' }}>{selectedMaint.description}</p>
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedMaint(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Trip Details */}
        {selectedTrip && (
          <div className="modal-overlay" onClick={() => setSelectedTrip(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Trip details</h2>
                <button className="modal-close" onClick={() => setSelectedTrip(null)}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                  <span>{selectedTrip.source}</span>
                  <ArrowRight size={16} />
                  <span>{selectedTrip.destination}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div><strong>Trip Status:</strong> {selectedTrip.status}</div>
                  <div><strong>Driver:</strong> {selectedTrip.driver?.name || '—'}</div>
                  <div><strong>Cargo Load:</strong> {selectedTrip.cargo_weight.toLocaleString()} kg</div>
                  <div><strong>Planned Distance:</strong> {selectedTrip.planned_distance} km</div>
                  <div><strong>Actual Distance:</strong> {selectedTrip.actual_distance ? `${selectedTrip.actual_distance} km` : '—'}</div>
                  <div><strong>Fuel Consumed:</strong> {selectedTrip.fuel_consumed ? `${selectedTrip.fuel_consumed} Liters` : '—'}</div>
                  <div><strong>Fuel Cost:</strong> {selectedTrip.fuel_cost ? `₹${selectedTrip.fuel_cost}` : '—'}</div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <div><strong>Start Time:</strong> {selectedTrip.start_time ? new Date(selectedTrip.start_time).toLocaleString() : '—'}</div>
                  <div><strong>End Time:</strong> {selectedTrip.end_time ? new Date(selectedTrip.end_time).toLocaleString() : '—'}</div>
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedTrip(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Replace / Upload Document */}
        {showDocModal && (
          <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
            <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Update {docType.toUpperCase()} Document</h2>
                <button className="modal-close" onClick={() => setShowDocModal(false)}><X size={16} /></button>
              </div>

              {docError && (
                <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                  <AlertTriangle size={16} />
                  <span style={{ fontSize: '0.85rem' }}>{docError}</span>
                </div>
              )}

              <form onSubmit={handleDocSubmit} style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{docType.toUpperCase()} Certificate / Policy Number</label>
                  <input className="form-input" placeholder="Enter document identification number" value={docForm.number} onChange={e => setDocForm({ ...docForm, number: e.target.value })} required />
                </div>

                {docType === 'insurance' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Insurance Company</label>
                      <input className="form-input" placeholder="e.g. Allianz" value={docForm.company} onChange={e => setDocForm({ ...docForm, company: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Insurance Type</label>
                      <select className="form-select" value={docForm.insurance_type} onChange={e => setDocForm({ ...docForm, insurance_type: e.target.value })}>
                        <option>Third Party</option>
                        <option>Comprehensive</option>
                        <option>Own Damage</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Policy Start Date</label>
                      <input className="form-input" type="date" value={docForm.start_date} onChange={e => setDocForm({ ...docForm, start_date: e.target.value })} required />
                    </div>
                  </>
                )}

                {docType !== 'rc' && (
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input className="form-input" type="date" value={docForm.expiry_date} onChange={e => setDocForm({ ...docForm, expiry_date: e.target.value })} required />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Upload New PDF / Image {docType !== 'permit' && '*'}</label>
                  <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files?.[0] || null)} required={docType !== 'permit' && !vehicle[`${docType}_file_path` as keyof VehicleDetails]} />
                </div>

                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDocModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={docSubmitting}>
                    {docSubmitting ? 'Uploading...' : 'Save Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
