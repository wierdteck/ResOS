import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Menu from './pages/Menu.jsx';
import Compliance from './pages/Compliance.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Reputation from './pages/Reputation.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="menu" element={<Menu />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="safety" element={<Navigate to="/dashboard" replace />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="reputation" element={<Reputation />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
