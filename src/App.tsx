import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PostListPage from './pages/PostListPage';
import PostDetailPage from './pages/PostDetailPage';
import PostCreatePage from './pages/PostCreatePage';
import PostEditPage from './pages/PostEditPage';
import ConfigMgmtPage from './pages/ConfigMgmtPage';
import ConfigMgmtDetailPage from './pages/ConfigMgmtDetailPage';
import ConfigMgmtCreatePage from './pages/ConfigMgmtCreatePage';
import ConfigMgmtEditPage from './pages/ConfigMgmtEditPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<PostListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route
              path="/posts/new"
              element={
                <ProtectedRoute>
                  <PostCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/posts/:id/edit"
              element={
                <ProtectedRoute>
                  <PostEditPage />
                </ProtectedRoute>
              }
            />
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
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
