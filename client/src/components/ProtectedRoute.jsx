import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B0E14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#8B949E] text-sm font-medium tracking-wide">Authenticating…</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'captain' ? '/captain' : '/dashboard'} replace />
  }

  return children
}
