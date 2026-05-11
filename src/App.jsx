import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ResosDataProvider } from './services/ResosDataProvider.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Menu from './pages/Menu.jsx';
import Compliance from './pages/Compliance.jsx';
import Safety from './pages/Safety.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Reputation from './pages/Reputation.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ResosDataProvider>
              <Layout />
            </ResosDataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="menu" element={<Menu />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="safety" element={<Safety />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="reputation" element={<Reputation />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
