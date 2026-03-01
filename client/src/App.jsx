import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import Layout from './components/layout/Layout';
import { Loader } from './components/common';

// Lazy loaded pages for code splitting
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Tournaments = lazy(() => import('./pages/tournaments/Tournaments'));
const Teams = lazy(() => import('./pages/teams/Teams'));
const Players = lazy(() => import('./pages/players/Players'));
const Matches = lazy(() => import('./pages/matches/Matches'));
const MatchDetail = lazy(() => import('./pages/matches/MatchDetail'));
const LiveScoring = lazy(() => import('./pages/scoring/LiveScoring'));
const Scoreboard = lazy(() => import('./pages/scoreboard/Scoreboard'));
const Analytics = lazy(() => import('./pages/analytics/Analytics'));

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const init = useThemeStore((s) => s.init);

  useEffect(() => { init(); }, []);

  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><Loader /></div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/scoreboard/:id" element={<Scoreboard />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/matches/:id" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
          <Route path="/scoring/:id" element={<ProtectedRoute><LiveScoring /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
