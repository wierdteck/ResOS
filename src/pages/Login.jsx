import { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Mail, UserPlus } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { publicAuthError, useAuth } from '../auth/AuthProvider.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';


export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasSupabaseConfig, isAuthenticated, isLoading, sendPasswordReset, signIn } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [from, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <main className="auth-shell">
        <Card className="auth-card">
          <p className="eyebrow">Checking Access</p>
          <h1>ResOS</h1>
          <p className="muted">Checking your session.</p>
        </Card>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (email.length > 254 || (mode === 'login' && password.length > 128)) {
        setStatus({ type: 'error', message: 'The submitted credentials are not valid.' });
        return;
      }

      if (mode === 'reset') {
        await sendPasswordReset(email);
        setStatus({ type: 'success', message: 'Password reset email sent. Check the invited user inbox.' });
      } else {
        await signIn(email, password);
        navigate(from, { replace: true });
      }
    } catch (error) {
      setStatus({ type: 'error', message: publicAuthError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <div className="auth-brand">
          <div className="logo">R</div>
          <div>
            <strong>ResOS</strong>
            <span>Restaurant Operations Dashboard</span>
          </div>
        </div>
        <div>
          <p className="eyebrow">Invite-only access</p>
          <h1>{mode === 'reset' ? 'Reset your password' : 'Sign in'}</h1>
          <p className="muted">
            {mode === 'reset'
              ? 'Enter the email for your invited account and Supabase will send a reset link.'
              : 'Use the email and password for your invited restaurant workspace account.'}
          </p>
        </div>

        {!hasSupabaseConfig ? (
          <div className="backup-status backup-status-error" role="alert">
            Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <span className="input-with-icon">
              <Mail size={17} />
              <input
                autoComplete="email"
                disabled={!hasSupabaseConfig || isSubmitting}
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </span>
          </label>

          {mode === 'login' ? (
            <label>
              Password
              <span className="input-with-icon">
                <KeyRound size={17} />
                <input
                  autoComplete="current-password"
                  disabled={!hasSupabaseConfig || isSubmitting}
                  maxLength={128}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </span>
            </label>
          ) : null}

          {status ? (
            <div className={`backup-status backup-status-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
              {status.message}
            </div>
          ) : null}

          <Button disabled={!hasSupabaseConfig || isSubmitting} icon={ArrowRight} type="submit">
            {isSubmitting ? 'Working...' : mode === 'reset' ? 'Send Reset Email' : 'Sign In'}
          </Button>
        </form>

        <button
          className="auth-link"
          disabled={isSubmitting}
          onClick={() => {
            setMode(mode === 'reset' ? 'login' : 'reset');
            setStatus(null);
          }}
          type="button"
        >
          {mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}
        </button>

        {mode === 'login' ? (
          <Button to="/signup" icon={UserPlus} variant="secondary">
            Create Account
          </Button>
        ) : null}

        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '1.5rem', textAlign: 'center' }}>
          Demo credentials: <strong>demo@demo.demo</strong> / <strong>demo</strong>
        </p>
      </Card>
    </main>
  );
}
