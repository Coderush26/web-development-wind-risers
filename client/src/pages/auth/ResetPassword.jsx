import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { t } from '../../config/theme'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async ({ password }) => {
    try {
      await api.post(`/auth/reset-password/${token}`, { password })
      setDone(true)
      toast.success('Password updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.')
    }
  }

  if (!token) return (
    <div className={t.pageBg}>
      <div className={`${t.card} ${t.cardSm}`}>
        <div className={`${t.cardPadding} text-center`}>
          <p className="text-sm text-red-500 font-medium mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className={`text-sm font-medium ${t.link}`}>Request a new link</Link>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div className={t.pageBg}>
      <div className={`${t.card} ${t.cardSm}`}>
        <div className={`${t.cardPadding} text-center`}>
          <div className={t.successIcon}>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Password updated</h2>
          <p className="text-sm text-gray-500 mb-7">You can now sign in with your new password.</p>
          <button onClick={() => navigate('/login')} className={t.btn} style={{ width: 'auto', padding: '0.625rem 2rem' }}>
            Go to login
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={t.pageBg}>
      <div className={`${t.card} ${t.cardSm}`}>
        <div className={t.cardPadding}>

          <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-1">Set new password</h1>
          <p className="text-sm text-gray-500 mb-7">Choose a strong password for your account.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className={t.label}>New password</label>
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

            <div>
              <label className={t.label}>Confirm new password</label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === watch('password') || 'Passwords do not match',
                })}
                className={`${t.input} ${errors.confirmPassword ? t.inputError : ''}`}
              />
              {errors.confirmPassword && <p className={t.fieldError}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className={t.btn}>
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>

          <p className="text-center mt-6">
            <Link to="/login" className={`text-xs font-medium ${t.link}`}>Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
