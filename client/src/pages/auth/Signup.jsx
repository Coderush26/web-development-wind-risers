import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
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

export default function Signup() {
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone]               = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async ({ firstName, lastName, email, password }) => {
    try {
      await api.post('/auth/register', { firstName, lastName, email, password })
      setRegisteredEmail(email)
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  /* ── Success screen ──────────────────────────────────────────────────────── */
  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-sm">
          <div className="auth-card-body" style={{ textAlign: 'center' }}>
            <div className="status-icon-success">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-high)', marginBottom: '8px' }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-low)', marginBottom: '4px' }}>
              Verification link sent to
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-high)', marginBottom: '24px', fontFamily: 'var(--font-data)' }}>
              {registeredEmail}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
              Click the link in your email to activate your account.
            </p>
            <Link to="/login" className="auth-btn" style={{ display: 'inline-block', width: 'auto', padding: '10px 32px', textDecoration: 'none' }}>
              Go to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Form ────────────────────────────────────────────────────────────────── */
  return (
    <div className="auth-page">
      <div className="auth-card auth-card-md">
        <div className="auth-card-body">

          <Logo />

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Fleet Command System
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-high)', letterSpacing: '-0.02em' }}>
              Create your account
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-low)', marginTop: '6px' }}>
              Role assignment is handled by Fleet Command after verification
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="auth-label">First name</label>
                <input
                  type="text"
                  placeholder="John"
                  autoComplete="given-name"
                  {...register('firstName', { required: 'Required' })}
                  className={`auth-input${errors.firstName ? ' error' : ''}`}
                />
                {errors.firstName && <p className="auth-field-error">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="auth-label">Last name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  autoComplete="family-name"
                  {...register('lastName', { required: 'Required' })}
                  className={`auth-input${errors.lastName ? ' error' : ''}`}
                />
                {errors.lastName && <p className="auth-field-error">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="auth-label">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                })}
                className={`auth-input${errors.email ? ' error' : ''}`}
              />
              {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="auth-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  className={`auth-input${errors.password ? ' error' : ''}`}
                  style={{ paddingRight: '52px' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="auth-label">Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: v => v === watch('password') || 'Passwords do not match',
                  })}
                  className={`auth-input${errors.confirmPassword ? ' error' : ''}`}
                  style={{ paddingRight: '52px' }}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="auth-btn" style={{ marginTop: '4px' }}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          <p style={{ fontSize: '13px', color: 'var(--color-text-low)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-action)', fontWeight: 500, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
