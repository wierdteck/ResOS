import { useState } from 'react';
import { ArrowRight, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { publicAuthError, useAuth } from '../auth/AuthProvider.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { hasSupabaseConfig, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);

    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Use at least 8 characters for the new password.' });
      return;
    }

    if (password.length > 128) {
      setStatus({ type: 'error', message: 'Use 128 characters or fewer for the new password.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'The passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
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
          <p className="eyebrow">Password Reset</p>
          <h1>Set a new password</h1>
          <p className="muted">Use the reset link from your invited account email, then choose a new password.</p>
        </div>

        {!hasSupabaseConfig ? (
          <div className="backup-status backup-status-error" role="alert">
            Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            New Password
            <span className="input-with-icon">
              <KeyRound size={17} />
              <input
                autoComplete="new-password"
                disabled={!hasSupabaseConfig || isSubmitting}
                maxLength={128}
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
            {isSubmitting ? 'Saving...' : 'Save Password'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
