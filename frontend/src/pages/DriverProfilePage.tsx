import { useEffect, useState } from 'react';
import { api } from '../api';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  contact_number: string;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  joining_date: string | null;
  monthly_salary: number;
  profile_photo_path: string | null;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  aadhaar_number: string | null;
  aadhaar_file_path: string | null;
  license_file_path: string | null;
  pan_file_path: string | null;
  medical_cert_path: string | null;
  police_verification_path: string | null;
}

export default function DriverProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Password reset state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.get('/driver-portal/profile')
      .then(res => {
        setProfile(res.profile);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await api.put('/driver-portal/profile/password', { oldPassword, newPassword });
      setSuccessMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) return <div><p style={{ color: 'var(--text-secondary)' }}>Loading profile info...</p></div>;
  if (!profile) return <div><p style={{ color: 'var(--text-secondary)' }}>Failed to load profile.</p></div>;

  const checkDocStatus = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { label: 'Expired', className: 'badge-danger' };
    if (days <= 30) return { label: `Expiring in ${days} days`, className: 'badge-warning' };
    return { label: 'Valid', className: 'badge-success' };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Profile Header Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1rem' }}>
        {profile.profile_photo_path ? (
          <img 
            src={`http://localhost:5000/${profile.profile_photo_path}`} 
            alt="Profile" 
            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700
          }}>
            {getInitials(profile.name)}
          </div>
        )}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{profile.name}</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{profile.email}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Ph: {profile.contact_number}</p>
        </div>
      </div>

      {/* Tabs / Info grids */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', margin: 0 }}>
          Personal & Emergency Info
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>Address:</span> <strong>{profile.address || '—'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Joining Date:</span> <strong>{profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : '—'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Monthly Salary:</span> <strong>₹{profile.monthly_salary.toLocaleString()}</strong></div>
          <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Emergency Contact:</span>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>
              {profile.emergency_contact_name || '—'} ({profile.emergency_contact_phone || '—'})
            </div>
          </div>
        </div>
      </div>

      {/* Document Validation Grid */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', margin: 0 }}>
          Verified Identity Documents
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <div>
              <strong style={{ display: 'block' }}>Driving License</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>No: {profile.license_number} ({profile.license_category})</span>
            </div>
            <span className={`badge ${checkDocStatus(profile.license_expiry_date).className}`} style={{ fontSize: '0.65rem' }}>
              {checkDocStatus(profile.license_expiry_date).label}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
            <div>
              <strong style={{ display: 'block' }}>Aadhaar Card</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{profile.aadhaar_number ? `No: ${profile.aadhaar_number}` : 'Missing'}</span>
            </div>
            <span className={`badge ${profile.aadhaar_file_path ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
              {profile.aadhaar_file_path ? 'Uploaded' : 'Missing'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
            <div>
              <strong style={{ display: 'block' }}>PAN Card (Optional)</strong>
            </div>
            <span className={`badge ${profile.pan_file_path ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
              {profile.pan_file_path ? 'Uploaded' : 'Missing'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
            <div>
              <strong style={{ display: 'block' }}>Medical Fitness Certificate</strong>
            </div>
            <span className={`badge ${profile.medical_cert_path ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
              {profile.medical_cert_path ? 'Uploaded' : 'Missing'}
            </span>
          </div>

        </div>
      </div>

      {/* Change Password Form */}
      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Lock size={14} /> Update Password
        </h3>

        {successMsg && (
          <div className="card" style={{ background: 'var(--success-light)', color: '#065F46', border: '1px solid #A7F3D0', padding: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={14} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Current Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={oldPassword} 
              onChange={e => setOldPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>New Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Confirm Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} disabled={passwordSubmitting}>
            {passwordSubmitting ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

    </div>
  );
}
