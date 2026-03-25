import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>IJCDS Admin</h1>
          <p>Sign in to manage your content</p>
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
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="login-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <FiEyeOff size={20} aria-hidden /> : <FiEye size={20} aria-hidden />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><FiLogIn /> Sign In</>}
          </button>
          <Link to="/forgot-password" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13 }}>
            Forgot password?
          </Link>
        </form>
      </div>
    </div>
  );
}
