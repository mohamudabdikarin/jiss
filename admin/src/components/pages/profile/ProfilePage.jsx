import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authAPI } from '../../../api';
import { FiSave, FiLock, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile({ name, email });
      updateUser({ name, email });
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setChangingPw(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) { toast.error(err.response?.data?.message || 'Password change failed'); }
    finally { setChangingPw(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title"><FiUser style={{ marginRight: 8 }} /> Profile Info</h3></div>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={user?.role || ''} disabled style={{ opacity: 0.5 }} /></div>
          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}><FiSave /> {saving ? 'Saving...' : 'Save Profile'}</button>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title"><FiLock style={{ marginRight: 8 }} /> Change Password</h3></div>
          <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /><p className="form-helper">Min 8 chars, uppercase, lowercase, and number</p></div>
          <button className="btn btn-primary" onClick={handleChangePassword} disabled={changingPw || !currentPassword || !newPassword}><FiLock /> {changingPw ? 'Changing...' : 'Change Password'}</button>
        </div>
      </div>
    </div>
  );
}
