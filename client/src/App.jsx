import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import CommandDashboard from './pages/CommandDashboard'

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

        {/* Captain dashboard — Phase 8 */}
        <Route
          path="/captain"
          element={
            <ProtectedRoute role="captain">
              <div className="flex items-center justify-center h-screen bg-[#0B0E14] text-[#8B949E] text-sm">
                Captain dashboard — coming in Phase 8
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
