import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { t } from '../../config/theme'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return }

    api.get(`/auth/verify-email/${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message) })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed.') })
  }, [])

  return (
    <div className={t.pageBg}>
      <div className={`${t.card} ${t.cardSm}`}>
        <div className={`${t.cardPadding} text-center`}>

          {status === 'loading' && (
            <>
              <div className="w-10 h-10 border-[3px] border-gray-100 border-t-blue-900 rounded-full animate-spin mx-auto mb-5" />
              <p className="text-sm text-gray-500">Verifying your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className={t.successIcon}>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Email verified</h2>
              <p className="text-sm text-gray-500 mb-7">{message}</p>
              <Link to="/login" className={t.btn} style={{ display: 'inline-block', width: 'auto', padding: '0.625rem 2rem' }}>
                Go to login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className={t.errorIcon}>
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Verification failed</h2>
              <p className="text-sm text-gray-500 mb-7">{message}</p>
              <div className="flex flex-col items-center gap-3">
                <Link to="/signup" className={t.btn} style={{ display: 'inline-block', width: 'auto', padding: '0.625rem 2rem' }}>
                  Back to sign up
                </Link>
                <Link to="/login" className={`text-xs font-medium ${t.link}`}>Already verified? Log in</Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
