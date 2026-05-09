import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import CommandDashboard from './pages/CommandDashboard'
import CaptainDashboard from './pages/CaptainDashboard'
import PlaybackView from './pages/PlaybackView'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'captain' ? '/captain' : '/dashboard'} replace />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                element={<RootRedirect />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/verify-email"    element={<VerifyEmail />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="command">
              <CommandDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain"
          element={
            <ProtectedRoute role="captain">
              <CaptainDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/playback"
          element={
            <ProtectedRoute role="command">
              <PlaybackView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
