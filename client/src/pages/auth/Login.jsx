import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

const Logo = () => (
  <div className="auth-logo-mark">
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <path strokeLinecap="round" strokeOpacity={0.4} d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" />
    </svg>
  </div>
)

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      const { data: res } = await api.post('/auth/login', data)
      login(res.user, res.token)
      toast.success('Access granted')
      navigate(res.user.role === 'captain' ? '/captain' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-sm">
        <div className="auth-card-body">

          <Logo />

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Fleet Command System
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-high)', letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-low)', marginTop: '6px' }}>
              Sign in to access the operations center
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label className="auth-label">Email address</label>
              <input
                type="email"
                placeholder="operator@fleet.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                })}
                className={`auth-input${errors.email ? ' error' : ''}`}
              />
              {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--color-text-low)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--color-action)'}
                  onMouseLeave={e => e.target.style.color = 'var(--color-text-low)'}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                  className={`auth-input${errors.password ? ' error' : ''}`}
                  style={{ paddingRight: '52px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--color-text-low)'}
                  onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="auth-btn" style={{ marginTop: '4px' }}>
              {isSubmitting ? 'Authenticating…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          <p style={{ fontSize: '13px', color: 'var(--color-text-low)', textAlign: 'center' }}>
            No account?{' '}
            <Link to="/signup" style={{ color: 'var(--color-action)', fontWeight: 500, textDecoration: 'none' }}>
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
