import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Home, Menu as MenuIcon, RefreshCcw, Sparkles, Truck } from 'lucide-react';
import Button from './Button.jsx';
import { getAllData, resetDemoData } from '../services/dataStore.js';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: Home, end: true },
  { to: '/dashboard/menu', label: 'Menu', icon: BarChart3 },
  { to: '/dashboard/compliance', label: 'Compliance', icon: ClipboardCheck },
  { to: '/dashboard/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/dashboard/reputation', label: 'Reputation', icon: Sparkles },
];

export default function Layout() {
  const navigate = useNavigate();
  const { restaurantProfile } = getAllData();

  function handleReset() {
    resetDemoData();
    navigate('/dashboard');
    window.dispatchEvent(new Event('resos:data-reset'));
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
        <Button variant="ghost" icon={RefreshCcw} onClick={handleReset}>Reset Demo Data</Button>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p>Corner Table Cafe</p>
            <h1>Restaurant Operations Dashboard</h1>
          </div>
          <Button to="/" variant="secondary" icon={MenuIcon}>Landing</Button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
