import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { hasSupabaseConfig, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Checking Access</p>
          <h1>Opening ResOS</h1>
          <p className="muted">Confirming your restaurant workspace session.</p>
        </section>
      </main>
    );
  }

  if (!hasSupabaseConfig || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
