import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CasualPage from './pages/CasualPage';
import RankedPage from './pages/RankedPage';
import LeaderboardPage from './pages/LeaderboardPage';
import RulesPage from './pages/RulesPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';

function ProtectedRoute({ children }) {
  const { user, guestMode, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen felt-bg flex items-center justify-center">
        <div className="text-antique-gold-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isConfigured && !user && !guestMode) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, guestMode, isConfigured } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isConfigured && (user || guestMode)
            ? <Navigate to="/home" replace />
            : <AuthPage />
        }
      />
      <Route path="/home" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/casual" element={<ProtectedRoute><CasualPage /></ProtectedRoute>} />
      <Route path="/ranked" element={<ProtectedRoute><RankedPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
      <Route path="/lobby/:roomCode" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
      <Route path="/game/:roomCode" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      <Route path="/rules" element={<RulesPage />} />
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
