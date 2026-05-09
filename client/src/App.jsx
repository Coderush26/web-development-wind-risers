import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page — to be built */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-linear-to-br from-black via-gray-950 to-blue-950 flex items-center justify-center">
              <h1 className="text-4xl font-bold text-white">CodeRush — Coming Soon</h1>
            </div>
          }
        />

        {/* Auth */}
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/verify-email"    element={<VerifyEmail />} />

        {/* Protected routes go here later */}
      </Routes>
    </Router>
  )
}

export default App
