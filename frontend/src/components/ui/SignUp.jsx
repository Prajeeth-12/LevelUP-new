import React, { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'

// Google Icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C37.205 35.092 44 29.894 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
)

export const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please sign in instead.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.')
      } else {
        setError(err.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to sign up with Google.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden selection:bg-orange-500/20">
      {/* Subtle Warm Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center animate-fade-in relative z-10">
        <div
          onClick={() => navigate('/')}
          className="cursor-pointer hover:opacity-90 transition-opacity mb-4 flex items-center justify-center"
        >
          <img src="/logo.png" alt="LevelUP" className="h-9 w-auto object-contain dark:hidden" />
          <img src="/logo-white.png" alt="LevelUP" className="h-9 w-auto object-contain hidden dark:block" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mb-2">
          <Sparkles className="w-3 h-3" />
          <span>Zero-to-One Career OS</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl relative z-10">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-normal text-foreground font-serif italic mb-1.5">
            Start your <span className="text-orange-600 dark:text-orange-400">journey</span>.
          </h1>
          <p className="text-xs text-muted-foreground">
            Create your account to unlock AI-powered roadmaps and skill gap analysis.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl px-4 py-3 text-xs mb-5 font-medium">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground border border-border font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-2xs mb-4"
        >
          <GoogleIcon />
          <span>Sign up with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">or with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              className="w-full input-base py-2.5 px-3.5 text-xs rounded-2xl"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full input-base py-2.5 px-3.5 pr-10 text-xs rounded-2xl"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full input-base py-2.5 px-3.5 pr-10 text-xs rounded-2xl"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Creating Account…</span>
              </span>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border/60">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignUp
