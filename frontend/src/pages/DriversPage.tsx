import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Eye, Edit, Trash2, Search, FileText, AlertCircle, Phone, Award, Shield } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  contact_number: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  safety_score: number;
  status: string;
  email: string;
  profile_photo_path: string | null;
  aadhaar_number: string | null;
  aadhaar_file_path: string | null;
  license_file_path: string | null;
  pan_file_path: string | null;
  medical_cert_path: string | null;
  police_verification_path: string | null;
  assigned_vehicle: string;
  current_trip: string;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  joining_date: string | null;
  monthly_salary: number | null;
  license_issue_date: string | null;
  internal_notes: string | null;
  admin_remarks: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'badge-success',
  ON_TRIP: 'badge-info',
  OFF_DUTY: 'badge-warning',
  SUSPENDED: 'badge-danger',
};

const FORM_SECTIONS = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'license', label: 'Driving License' },
  { id: 'identity', label: 'Identity Docs' },
  { id: 'employment', label: 'Employment Details' }
];

export default function DriversPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState(''); // "", "expired", "expiring_soon"

  // Hover Summary Card state
  const [hoveredDriver, setHoveredDriver] = useState<Driver | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Modal Control
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState('personal');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    contact_number: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    joining_date: '',
    monthly_salary: '',
    license_number: '',
    license_category: 'Heavy',
    license_issue_date: '',
    license_expiry_date: '',
    aadhaar_number: '',
    status: 'AVAILABLE',
    safety_score: '100',
    internal_notes: '',
    admin_remarks: '',
  });

  // Files upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [policeFile, setPoliceFile] = useState<File | null>(null);

  const fetchDrivers = () => {
    setLoading(true);
    const queryParts = [];
    if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
    if (statusFilter) queryParts.push(`status=${encodeURIComponent(statusFilter)}`);
    if (categoryFilter) queryParts.push(`category=${encodeURIComponent(categoryFilter)}`);
    if (expiryFilter) queryParts.push(`expiry=${encodeURIComponent(expiryFilter)}`);

    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    api.get(`/drivers${query}`)
      .then(setDrivers)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDrivers();
  }, [search, statusFilter, categoryFilter, expiryFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditId(null);
    setForm({
      name: '',
      email: '',
      password: '',
      contact_number: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      joining_date: new Date().toISOString().split('T')[0],
      monthly_salary: '',
      license_number: '',
      license_category: 'Heavy',
      license_issue_date: '',
      license_expiry_date: '',
      aadhaar_number: '',
      status: 'AVAILABLE',
      safety_score: '100',
      internal_notes: '',
      admin_remarks: '',
    });
    setPhotoFile(null);
    setLicenseFile(null);
    setAadhaarFile(null);
    setPanFile(null);
    setMedicalFile(null);
    setPoliceFile(null);
    setActiveFormTab('personal');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setModalMode('edit');
    setEditId(driver.id);
    setForm({
      name: driver.name,
      email: driver.email,
      password: '', // Kept blank to avoid password override
      contact_number: driver.contact_number,
      address: driver.address || '',
      emergency_contact_name: driver.emergency_contact_name || '',
      emergency_contact_phone: driver.emergency_contact_phone || '',
      joining_date: driver.joining_date ? driver.joining_date.split('T')[0] : '',
      monthly_salary: driver.monthly_salary ? driver.monthly_salary.toString() : '',
      license_number: driver.license_number,
      license_category: driver.license_category,
      license_issue_date: driver.license_issue_date ? driver.license_issue_date.split('T')[0] : '',
      license_expiry_date: driver.license_expiry_date ? driver.license_expiry_date.split('T')[0] : '',
      aadhaar_number: driver.aadhaar_number || '',
      status: driver.status,
      safety_score: driver.safety_score.toString(),
      internal_notes: driver.internal_notes || '',
      admin_remarks: driver.admin_remarks || '',
    });
    setPhotoFile(null);
    setLicenseFile(null);
    setAadhaarFile(null);
    setPanFile(null);
    setMedicalFile(null);
    setPoliceFile(null);
    setActiveFormTab('personal');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Pre-validations for create mode
    if (modalMode === 'create') {
      if (!form.email || !form.password) {
        setError('Email and Login Password are required.');
        setActiveFormTab('personal');
        setSubmitting(false);
        return;
      }
      if (!licenseFile) {
        setError('Driving License file upload is required.');
        setActiveFormTab('license');
        setSubmitting(false);
        return;
      }
      if (!aadhaarFile) {
        setError('Aadhaar Card file upload is required.');
        setActiveFormTab('identity');
        setSubmitting(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val);
      });

      // Files
      if (photoFile) formData.append('profile_photo', photoFile);
      if (licenseFile) formData.append('license_file', licenseFile);
      if (aadhaarFile) formData.append('aadhaar_file', aadhaarFile);
      if (panFile) formData.append('pan_file', panFile);
      if (medicalFile) formData.append('medical_cert', medicalFile);
      if (policeFile) formData.append('police_verification', policeFile);

      if (modalMode === 'create') {
        await api.post('/drivers', formData);
      } else {
        await api.put(`/drivers/${editId}`, formData);
      }

      setShowModal(false);
      fetchDrivers();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to completely delete driver ${name}? This will remove all their trip history, violations, and payroll logs.`)) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchDrivers();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX + 15, y: e.clientY + 15 });
  };

  const getSafetyBadge = (score: number) => {
    if (score >= 90) return 'badge-success';
    if (score >= 75) return 'badge-warning';
    return 'badge-danger';
  };

  const getExpiryWarning = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span style={{ background: '#EF4444', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>EXPIRED</span>;
    } else if (diffDays <= 30) {
      return <span style={{ background: '#F59E0B', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>EXPIRES IN {diffDays}d</span>;
    }
    return null;
  };

  const isManager = user?.role === 'FLEET_MANAGER';
  const API_SERVER = 'http://localhost:5000';

  return (
    <>
      <div className="topbar">
        <h1>Driver Management</h1>
      </div>
      <div className="page-content">
        
        {/* Filters Panel */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search drivers by name, phone, license..." 
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ width: '180px' }}>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="OFF_DUTY">Off Duty</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div style={{ width: '180px' }}>
              <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Heavy">Heavy</option>
                <option value="Light">Light</option>
                <option value="B">Class B</option>
              </select>
            </div>

            <div style={{ width: '180px' }}>
              <select className="form-select" value={expiryFilter} onChange={e => setExpiryFilter(e.target.value)}>
                <option value="">All License Expiry</option>
                <option value="expired">Expired</option>
                <option value="expiring_soon">Expiring (within 30d)</option>
              </select>
            </div>

            {isManager && (
              <button className="btn btn-primary" onClick={handleOpenCreate} style={{ marginLeft: 'auto' }}>
                <Plus size={16} /> Add Driver
              </button>
            )}
          </div>
        </div>

        {/* Drivers table */}
        {loading ? <p>Loading drivers...</p> : (
          <div className="table-wrapper animate-in">
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Driver Name</th>
                  <th>Contact</th>
                  <th>Assigned Vehicle</th>
                  <th>Current Trip</th>
                  <th>Category</th>
                  <th>License Expiry</th>
                  <th>Safety Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">
                        <p>No driver profiles registered.</p>
                      </div>
                    </td>
                  </tr>
                ) : drivers.map(d => (
                  <tr 
                    key={d.id}
                    onMouseEnter={() => setHoveredDriver(d)}
                    onMouseLeave={() => setHoveredDriver(null)}
                    onMouseMove={handleMouseMove}
                  >
                    <td>
                      {d.profile_photo_path ? (
                        <img 
                          src={`${API_SERVER}/${d.profile_photo_path}`} 
                          alt={d.name} 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} 
                        />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {d.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate(`/drivers/${d.id}`)}>
                        {d.name}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.email}</div>
                    </td>
                    <td>{d.contact_number}</td>
                    <td>{d.assigned_vehicle}</td>
                    <td>{d.current_trip}</td>
                    <td>{d.license_category}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>{new Date(d.license_expiry_date).toLocaleDateString()}</span>
                        {getExpiryWarning(d.license_expiry_date)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getSafetyBadge(d.safety_score)}`}>
                        {d.safety_score} pts
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[d.status] || 'badge-neutral'}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group" style={{ justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/drivers/${d.id}`)} title="View Driver Details">
                          <Eye size={14} />
                        </button>
                        {isManager && (
                          <>
                            <button className="btn btn-sm btn-warning" onClick={() => handleOpenEdit(d)} title="Edit Driver">
                              <Edit size={14} />
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(d.id, d.name)} title="Delete Driver">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Hover Summary Tooltip Card */}
        {hoveredDriver && (
          <div 
            style={{
              position: 'fixed',
              top: mousePos.y,
              left: mousePos.x,
              pointerEvents: 'none',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '0.75rem',
              zIndex: 1000,
              width: '220px',
              fontSize: '0.8rem',
              color: 'var(--text)'
            }}
          >
            <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>{hoveredDriver.name}</strong>
            <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} /> {hoveredDriver.contact_number}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={12} /> Safety Score: {hoveredDriver.safety_score} pts
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={12} /> Aadhaar: {hoveredDriver.aadhaar_number || '—'}
              </div>
              <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border)', fontSize: '0.75rem' }}>
                Status: <strong>{hoveredDriver.status.replace('_', ' ')}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" style={{ maxWidth: '650px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <h2>{modalMode === 'create' ? 'Add New Driver Profile' : 'Edit Driver Profile'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>

              {/* Form Navigation Tabs inside modal */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', margin: '1rem 0' }}>
                {FORM_SECTIONS.map(sec => (
                  <button
                    key={sec.id}
                    type="button"
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      background: 'none',
                      borderBottom: activeFormTab === sec.id ? '2px solid var(--primary)' : 'none',
                      color: activeFormTab === sec.id ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: activeFormTab === sec.id ? 600 : 500,
                      cursor: 'pointer'
                    }}
                    onClick={() => setActiveFormTab(sec.id)}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                
                {/* SECTION 1: Personal Info */}
                {activeFormTab === 'personal' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input className="form-input" placeholder="Enter Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Profile Photo</label>
                        <input type="file" className="form-input" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Mobile Number *</label>
                        <input className="form-input" placeholder="e.g. 9876543210" value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address {modalMode === 'create' && '*'}</label>
                        <input className="form-input" type="email" placeholder="e.g. driver@transitops.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required={modalMode === 'create'} disabled={modalMode === 'edit'} />
                      </div>
                    </div>

                    {modalMode === 'create' && (
                      <div className="form-group">
                        <label className="form-label">Login Password *</label>
                        <input className="form-input" type="password" placeholder="Driver portal password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Residential Address</label>
                      <input className="form-input" placeholder="Full address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Emergency Contact Person</label>
                        <input className="form-input" placeholder="Contact name" value={form.emergency_contact_name} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Emergency Contact Number</label>
                        <input className="form-input" placeholder="Contact mobile" value={form.emergency_contact_phone} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Joining Date</label>
                        <input className="form-input" type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Monthly Salary (₹)</label>
                        <input className="form-input" type="number" placeholder="salary in rupees" value={form.monthly_salary} onChange={e => setForm({ ...form, monthly_salary: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 2: Driving License */}
                {activeFormTab === 'license' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">License Number *</label>
                        <input className="form-input" placeholder="e.g. DL-XXXXXXXXXXXX" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">License Category</label>
                        <select className="form-select" value={form.license_category} onChange={e => setForm({ ...form, license_category: e.target.value })}>
                          <option>Heavy</option>
                          <option>Light</option>
                          <option>B</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">License Issue Date</label>
                        <input className="form-input" type="date" value={form.license_issue_date} onChange={e => setForm({ ...form, license_issue_date: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">License Expiry Date *</label>
                        <input className="form-input" type="date" value={form.license_expiry_date} onChange={e => setForm({ ...form, license_expiry_date: e.target.value })} required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Driving License PDF/Image {modalMode === 'create' && '*'}</label>
                      <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setLicenseFile(e.target.files?.[0] || null)} required={modalMode === 'create'} />
                    </div>
                  </div>
                )}

                {/* SECTION 3: Identity Documents */}
                {activeFormTab === 'identity' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                    
                    {/* Aadhaar (Mandatory) */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--primary)' }}>
                        <FileText size={16} /> Aadhaar Card (Mandatory)
                      </h4>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Aadhaar Number *</label>
                          <input className="form-input" placeholder="e.g. 1234-5678-9012" value={form.aadhaar_number} onChange={e => setForm({ ...form, aadhaar_number: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Aadhaar PDF/Image Upload {modalMode === 'create' && '*'}</label>
                          <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAadhaarFile(e.target.files?.[0] || null)} required={modalMode === 'create'} />
                        </div>
                      </div>
                    </div>

                    {/* Optional Documents Notice */}
                    <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                        <FileText size={16} /> Additional Verification Docs (Optional)
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        * Optional documents can be uploaded later after driver registration.
                      </p>
                      
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">PAN Card Upload</label>
                        <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setPanFile(e.target.files?.[0] || null)} />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Medical Fitness Certificate</label>
                        <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setMedicalFile(e.target.files?.[0] || null)} />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Police Verification Certificate</label>
                        <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setPoliceFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 4: Employment Details */}
                {activeFormTab === 'employment' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
                    <div className="form-group">
                      <label className="form-label">Employment Status</label>
                      <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        <option value="AVAILABLE">Available</option>
                        <option value="ON_TRIP">On Trip</option>
                        <option value="OFF_DUTY">Off Duty</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Safety Score (Default 100)</label>
                      <input className="form-input" type="number" min="0" max="100" value={form.safety_score} onChange={e => setForm({ ...form, safety_score: e.target.value })} disabled={modalMode === 'create'} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Internal Notes</label>
                      <textarea className="form-input" style={{ minHeight: '60px', fontFamily: 'inherit' }} placeholder="Administrative private notes..." value={form.internal_notes} onChange={e => setForm({ ...form, internal_notes: e.target.value })}></textarea>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Admin Remarks</label>
                      <textarea className="form-input" style={{ minHeight: '60px', fontFamily: 'inherit' }} placeholder="Private feedback about the driver..." value={form.admin_remarks} onChange={e => setForm({ ...form, admin_remarks: e.target.value })}></textarea>
                    </div>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : modalMode === 'create' ? 'Register Driver' : 'Save Changes'}
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
