import { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, LogIn, Mail } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { publicAuthError, useAuth } from '../auth/AuthProvider.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { hasSupabaseConfig, isAuthenticated, isLoading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

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
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);

    if (email.length > 254) {
      setStatus({ type: 'error', message: 'Use a valid email address.' });
      return;
    }

    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Use at least 8 characters for the password.' });
      return;
    }

    if (password.length > 128) {
      setStatus({ type: 'error', message: 'Use 128 characters or fewer for the password.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'The passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await signUp(email, password);
      if (data.session) {
        navigate('/dashboard', { replace: true });
        return;
      }
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
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
          <p className="eyebrow">Create account</p>
          <h1>Sign up</h1>
          <p className="muted">Create a restaurant workspace account with your email and a password.</p>
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

          <label>
            Password
            <span className="input-with-icon">
              <KeyRound size={17} />
              <input
                autoComplete="new-password"
                disabled={!hasSupabaseConfig || isSubmitting}
                maxLength={128}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </span>
          </label>

          <label>
            Confirm Password
            <span className="input-with-icon">
              <KeyRound size={17} />
              <input
                autoComplete="new-password"
                disabled={!hasSupabaseConfig || isSubmitting}
                maxLength={128}
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </span>
          </label>

          {status ? (
            <div className={`backup-status backup-status-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
              {status.message}
            </div>
          ) : null}

          <Button disabled={!hasSupabaseConfig || isSubmitting} icon={ArrowRight} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        <Button to="/login" icon={LogIn} variant="secondary">
          Back to Sign In
        </Button>
      </Card>
    </main>
  );
}
