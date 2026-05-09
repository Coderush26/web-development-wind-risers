import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { t } from '../../config/theme'

const Logo = () => (
  <div className="w-9 h-9 bg-blue-950 rounded-xl flex items-center justify-center mb-7">
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3L4 14h8l-1 7 9-11h-8l1-7z" />
    </svg>
  </div>
)


export default function Signup() {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
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

  /* ── Success screen ─────────────────────────────────────────── */
  if (done) {
    return (
      <div className={t.pageBg}>
        <div className={`${t.card} ${t.cardSm}`}>
          <div className={`${t.cardPadding} text-center`}>
            <div className={t.successIcon}>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Check your inbox</h2>
            <p className="text-sm text-gray-500 mb-0.5">
              We emailed a verification link to
            </p>
            <p className="text-sm font-medium text-gray-800 mb-5">{registeredEmail}</p>
            <p className="text-xs text-gray-400 mb-7">Click the link to activate your account.</p>
            <Link to="/login" className={t.btn} style={{ display: 'inline-block', width: 'auto', padding: '0.625rem 2rem' }}>
              Go to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Form ───────────────────────────────────────────────────── */
  return (
    <div className={`${t.pageBg} relative`}>

      {/* Back to home */}
      <Link to="/" className={`absolute top-6 left-6 ${t.backLink}`}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className={`${t.card} ${t.cardMd}`}>
        <div className={t.cardPadding}>

          <Logo />

          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1 mb-7">Start building with CodeRush today</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={t.label}>First name</label>
                <input
                  type="text"
                  placeholder="John"
                  autoComplete="given-name"
                  {...register('firstName', { required: 'Required' })}
                  className={`${t.input} ${errors.firstName ? t.inputError : ''}`}
                />
                {errors.firstName && <p className={t.fieldError}>{errors.firstName.message}</p>}
              </div>
              <div>
                <label className={t.label}>Last name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  autoComplete="family-name"
                  {...register('lastName', { required: 'Required' })}
                  className={`${t.input} ${errors.lastName ? t.inputError : ''}`}
                />
                {errors.lastName && <p className={t.fieldError}>{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={t.label}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                })}
                className={`${t.input} ${errors.email ? t.inputError : ''}`}
              />
              {errors.email && <p className={t.fieldError}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className={t.label}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  className={`${t.input} ${errors.password ? t.inputError : ''} pr-14`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors">
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className={t.fieldError}>{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className={t.label}>Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === watch('password') || 'Passwords do not match',
                  })}
                  className={`${t.input} ${errors.confirmPassword ? t.inputError : ''} pr-14`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors">
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && <p className={t.fieldError}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className={`${t.btn} mt-1`}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

        </div>

        {/* Card footer */}
        <div className="border-t border-gray-100 px-8 py-4 bg-gray-50/60 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-gray-800 hover:text-gray-950 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
