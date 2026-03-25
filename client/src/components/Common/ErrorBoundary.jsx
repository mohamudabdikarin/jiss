import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: 48, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 16, color: 'var(--accent2)' }}>Something went wrong</h2>
          <p style={{ marginBottom: 24, color: 'var(--text-light)' }}>
            An unexpected error occurred. Please refresh the page or try again later.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
