import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';

function ProtectedRoute({ children }) {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen felt-bg flex items-center justify-center">
        <div className="text-gold-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isConfigured && !user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, isConfigured } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isConfigured && user ? <Navigate to="/home" replace /> : <AuthPage />
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute><HomePage /></ProtectedRoute>
        }
      />
      <Route
        path="/lobby/:roomCode"
        element={
          <ProtectedRoute><LobbyPage /></ProtectedRoute>
        }
      />
      <Route
        path="/game/:roomCode"
        element={
          <ProtectedRoute><GamePage /></ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
