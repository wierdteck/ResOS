import { useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Download, Home, LogOut, Menu as MenuIcon, RefreshCcw, ShieldCheck, Sparkles, Truck, Upload } from 'lucide-react';
import { publicAuthError, useAuth } from '../auth/AuthProvider.jsx';
import { useResosData } from '../services/ResosDataProvider.jsx';
import Button from './Button.jsx';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: Home, end: true },
  { to: '/dashboard/menu', label: 'Menu', icon: BarChart3 },
  { to: '/dashboard/compliance', label: 'Compliance', icon: ClipboardCheck },
  { to: '/dashboard/safety', label: 'Safety', icon: ShieldCheck },
  { to: '/dashboard/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/dashboard/reputation', label: 'Reputation', icon: Sparkles },
];

export default function Layout() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const { data, error: dataError, exportCsvBackup, importCsvBackup, isSaving, resetDemoData } = useResosData();
  const { signOut, user } = useAuth();
  const { restaurantProfile } = data;

  async function handleReset() {
    const confirmed = window.confirm('Reset the shared restaurant workspace back to the seeded demo data? This overwrites backend data for every signed-in user.');
    if (!confirmed) return;

    setBackupStatus({ type: 'info', message: 'Restoring seeded demo data...' });
    try {
      await resetDemoData();
      setBackupStatus({ type: 'success', message: 'Shared demo data restored.' });
      navigate('/dashboard');
    } catch (error) {
      setBackupStatus({ type: 'error', message: error.message || 'ResOS could not reset demo data.' });
    }
  }

  async function handleExport() {
    setBackupStatus({ type: 'info', message: 'Preparing CSV backup...' });
    try {
      const backup = await exportCsvBackup();
      const url = URL.createObjectURL(backup.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setBackupStatus({ type: 'success', message: `Exported ${backup.fileName}.` });
    } catch (error) {
      setBackupStatus({ type: 'error', message: error.message || 'ResOS could not export a CSV backup.' });
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || isImporting) return;

    setIsImporting(true);
    setBackupStatus({ type: 'info', message: 'Checking backup ZIP...' });
    try {
      const result = await importCsvBackup(file);
      setBackupStatus({ type: 'success', message: `Imported ${result.metadata.tables.length} CSV tables.` });
    } catch (error) {
      setBackupStatus({ type: 'error', message: error.message || 'ResOS could not import that backup.' });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      setBackupStatus({ type: 'error', message: publicAuthError(error) });
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <div className="logo">R</div>
          <div>
            <strong>ResOS</strong>
            <span>{restaurantProfile.restaurantName}</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-actions">
          <Button variant="ghost" icon={RefreshCcw} onClick={handleReset}>Reset Demo Data</Button>
          <Button variant="ghost" icon={Download} onClick={handleExport}>Export CSV Backup</Button>
          <Button variant="ghost" icon={Upload} onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import CSV Backup'}
          </Button>
          <input
            ref={fileInputRef}
            className="backup-file-input"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={handleImport}
          />
          {isSaving ? (
            <div className="backup-status backup-status-info" role="status">Saving shared workspace...</div>
          ) : null}
          {dataError ? (
            <div className="backup-status backup-status-error" role="alert">{dataError}</div>
          ) : null}
          {backupStatus ? (
            <div className={`backup-status backup-status-${backupStatus.type}`} role={backupStatus.type === 'error' ? 'alert' : 'status'}>
              {backupStatus.message}
            </div>
          ) : null}
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p>Corner Table Cafe</p>
            <h1>Restaurant Operations Dashboard</h1>
          </div>
          <div className="button-row">
            <span className="user-pill">{user?.email}</span>
            <Button to="/" variant="secondary" icon={MenuIcon}>Landing</Button>
            <Button variant="secondary" icon={LogOut} onClick={handleSignOut}>Sign Out</Button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
