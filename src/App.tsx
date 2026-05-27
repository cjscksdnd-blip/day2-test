import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ConfigMgmtPage from './pages/ConfigMgmtPage';
import ConfigMgmtDetailPage from './pages/ConfigMgmtDetailPage';
import ConfigMgmtCreatePage from './pages/ConfigMgmtCreatePage';
import ConfigMgmtEditPage from './pages/ConfigMgmtEditPage';
import VacationPage from './pages/VacationPage';
import VacationCreatePage from './pages/VacationCreatePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/config-mgmt" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/config-mgmt" element={<ConfigMgmtPage />} />
            <Route path="/config-mgmt/:id" element={<ConfigMgmtDetailPage />} />
            <Route
              path="/config-mgmt/new"
              element={
                <ProtectedRoute>
                  <ConfigMgmtCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/config-mgmt/:id/edit"
              element={
                <ProtectedRoute>
                  <ConfigMgmtEditPage />
                </ProtectedRoute>
              }
            />
            <Route path="/vacation" element={<VacationPage />} />
            <Route path="/vacation/new" element={<VacationCreatePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
