import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <h1>Check your email</h1>
            <p>If an account exists for {email}, we sent a 6-digit reset code. It expires in 15 minutes.</p>
          </div>
          <div style={{ marginTop: 24 }}>
            <Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FiMail /> Enter reset code
            </Link>
            <Link to="/login" className="btn btn-ghost" style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FiArrowLeft /> Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>Forgot password?</h1>
          <p>Enter your email and we&apos;ll send you a reset code</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@site.com"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><FiMail /> Send reset code</>}
          </button>
        </form>

        <Link to="/login" className="btn btn-ghost" style={{ width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <FiArrowLeft /> Back to login
        </Link>
      </div>
    </div>
  );
}
