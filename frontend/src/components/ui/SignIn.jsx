import { useState } from 'react'
import { Eye, EyeOff, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// ─── Google Icon ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C37.205 35.092 44 29.894 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
)

// ─── Feature chip ─────────────────────────────────────────────────────────────
const FeatureChip = ({ children }) => (
  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-sm text-white/90">
    <CheckCircle2 className="w-4 h-4 text-violet-300 shrink-0" />
    {children}
  </div>
)

// ─── SignIn ───────────────────────────────────────────────────────────────────
export const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [resetSent, setResetSent]       = useState(false)
  const [resetMode, setResetMode]       = useState(false)
  const navigate                        = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.code === 'auth/invalid-credential'
        ? 'Incorrect email or password. Please try again.'
        : err.message || 'Failed to sign in.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Enter your email first.'); return }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
      setError('')
    } catch (err) {
      setError(err.message || 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-background">

      {/* ── Left Hero Panel ─────────────────────────────────────────────── */}
      <div className="auth-hero w-[45%] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-20 translate-x-1/3 translate-y-1/3"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-auto">
            <img src="/logo.png" alt="LevelUP" className="h-10 w-auto object-contain rounded-lg" />
          </div>

          {/* Hero copy */}
          <div className="mb-auto">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4 font-serif italic">
              Level up your<br />
              <span className="text-orange-400">skills</span> one day<br />
              at a time.
            </h1>
            <p className="text-white/70 text-base mb-8 leading-relaxed">
              Your personal learning OS — track skills, get AI-powered gap analysis, and stay on your learning path.
            </p>
            <div className="space-y-2.5">
              <FeatureChip>AI Skill Gap Analyzer</FeatureChip>
              <FeatureChip>Personalized Learning Roadmaps</FeatureChip>
              <FeatureChip>Progress tracking & analytics</FeatureChip>
              <FeatureChip>Kanban-style skill board</FeatureChip>
            </div>
          </div>

          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} LevelUP. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────────────────── */}
      <div className="auth-form-panel flex-1">
        <div className="w-full max-w-sm mx-auto">
          {!resetMode ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-1">Welcome back</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to continue your learning journey</p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full btn-outline flex items-center justify-center gap-2.5 py-3 mb-4"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-accent" />
                <span className="text-xs font-semibold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-accent" />
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="label-base">Email</label>
                  <input
                    type="email"
                    className="input-base"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="label-base mb-0">Password</label>
                    <button
                      type="button"
                      onClick={() => setResetMode(true)}
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-base pr-10 rounded-2xl"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="font-bold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  Sign up free
                </button>
              </p>
            </>
          ) : (
            /* ── Forgot Password mode ── */
            <>
              <button
                onClick={() => { setResetMode(false); setResetSent(false); setError('') }}
                className="btn-ghost mb-6 text-sm gap-1 -ml-2"
              >
                ← Back to sign in
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-1">Reset password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                We'll send a password reset link to your email.
              </p>
              {resetSent ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-4 text-sm">
                  ✅ Reset email sent! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="label-base">Email address</label>
                    <input
                      type="email"
                      className="input-base"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full btn-primary py-3">
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SignIn
