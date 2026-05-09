import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { t } from '../../config/theme'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async ({ email }) => {
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmittedEmail(email)
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.')
    }
  }

  return (
    <div className={t.pageBg}>
      <div className={`${t.card} ${t.cardSm}`}>
        <div className={t.cardPadding}>

          {sent ? (
            <div className="text-center py-2">
              <div className={t.infoIcon}>
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-0.5">Reset link sent to</p>
              <p className="text-sm font-medium text-gray-800 mb-1.5">{submittedEmail}</p>
              <p className="text-xs text-gray-400 mb-7">The link expires in 1 hour.</p>
              <Link to="/login" className={t.btn} style={{ display: 'inline-block', width: 'auto', padding: '0.625rem 2rem' }}>
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className={t.cardBackLink}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to login
              </Link>

              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Reset your password</h1>
              <p className="text-sm text-gray-500 mt-1 mb-7">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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

                <button type="submit" disabled={isSubmitting} className={t.btn}>
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
