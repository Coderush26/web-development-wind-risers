import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { t } from '../../config/theme'

const Logo = () => (
  <div className="w-9 h-9 bg-blue-950 rounded-xl flex items-center justify-center mb-7">
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3L4 14h8l-1 7 9-11h-8l1-7z" />
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
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className={t.pageBg}>
      <div className={`${t.card} ${t.cardSm}`}>
        <div className={t.cardPadding}>

          {/* Brand mark */}
          <Logo />

          {/* Heading */}
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Sign in to CodeRush</h1>
          <p className="text-sm text-gray-500 mt-1 mb-7">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

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
              <div className="flex items-center justify-between mb-1.5">
                <label className={t.label} style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" className={t.linkMuted}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                  className={`${t.input} ${errors.password ? t.inputError : ''} pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className={t.fieldError}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className={`${t.btn} mt-1`}>
              {isSubmitting ? 'Signing in…' : 'Continue'}
            </button>
          </form>

        </div>

        {/* Card footer */}
        <div className="border-t border-gray-100 px-8 py-4 bg-gray-50/60 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-gray-800 hover:text-gray-950 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
