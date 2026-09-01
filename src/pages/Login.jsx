import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { Mail, Lock, User, Phone, Building2, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('login') // login | register | forgot | reset-sent
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  // Google Sign-In
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleResponse,
        })
      }
    }
    document.head.appendChild(script)
    return () => { if (script.parentNode) script.parentNode.removeChild(script) }
  }, [])

  const handleGoogleResponse = async (response) => {
    try {
      // Decode the JWT token from Google
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      const { email, name, picture } = payload

      // Try to login, if user doesn't exist, register them
      try {
        await login(email, `google_${response.credential.slice(-8)}`)
      } catch {
        // User doesn't exist, register them
        await api.register({
          name: name || 'Google User',
          email,
          password: `google_${response.credential.slice(-8)}`,
        })
        await login(email, `google_${response.credential.slice(-8)}`)
      }
      navigate('/')
    } catch (err) {
      setError('Google sign-in failed. Please try again.')
    }
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        navigate('/')
      } else if (mode === 'register') {
        if (!form.name) { setError('Name is required'); setSubmitting(false); return }
        await register(form)
        navigate('/')
      } else if (mode === 'forgot') {
        // Simulate password reset (in production, send email)
        await api.forgotPassword(form.email).catch(() => {})
        setMode('reset-sent')
        setSuccess('If an account exists with that email, a password reset link has been sent.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const triggerGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt()
    } else {
      setError('Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.')
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 36 36" width="40" height="40" fill="none">
                <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 26c0-8 3.5-14 8-17.5C22.5 12 26 18 26 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--ff-heading)', fontSize: '1.3rem' }}>
                <span style={{ color: 'var(--gold)' }}>Yirga</span>Coffee
              </span>
            </Link>
          </div>

          {/* Back to login from reset-sent */}
          {mode === 'reset-sent' && (
            <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.85rem', marginBottom: 16 }}>
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          )}

          {/* Tabs - only show for login/register */}
          {(mode === 'login' || mode === 'register') && (
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Sign In</button>
              <button className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`} onClick={() => { setMode('register'); setError(''); setSuccess('') }}>Create Account</button>
            </div>
          )}

          {/* Google Sign-In Button */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <button
                onClick={triggerGoogleSignIn}
                style={{
                  width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', background: 'var(--white)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontSize: '.92rem', fontWeight: 500, marginBottom: 16, transition: 'var(--transition)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or continue with email</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            </>
          )}

          {/* Reset Sent Confirmation */}
          {mode === 'reset-sent' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={28} color="#27AE60" />
              </div>
              <h3 style={{ fontFamily: 'var(--ff-heading)', marginBottom: 8 }}>Check Your Email</h3>
              <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {success || 'If an account exists with that email, we\'ve sent a password reset link.'}
              </p>
              <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginTop: 12 }}>
                Didn't receive it? Check your spam folder or try again.
              </p>
            </div>
          )}

          {/* Form */}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Forgot password form */}
              {mode === 'forgot' && (
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess('') }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.85rem', marginBottom: 16 }}>
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              )}

              {mode === 'forgot' && (
                <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              )}

              {mode === 'register' && (
                <div className="form-group">
                  <label><User size={14} style={{ verticalAlign: -2 }} /> Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="John Smith" />
                </div>
              )}

              <div className="form-group">
                <label><Mail size={14} style={{ verticalAlign: -2 }} /> Email Address *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@company.com" />
              </div>

              {(mode === 'login' || mode === 'register') && (
                <div className="form-group">
                  <label>
                    <Lock size={14} style={{ verticalAlign: -2 }} /> Password * {mode === 'register' && <span className="form-hint">(min 6 characters)</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="Enter password"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div className="form-group">
                    <label><Phone size={14} style={{ verticalAlign: -2 }} /> Phone</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+251 9XX XXX XXX" />
                  </div>
                  <div className="form-group">
                    <label><Building2 size={14} style={{ verticalAlign: -2 }} /> Company / Business</label>
                    <input type="text" name="company" value={form.company} onChange={handleChange} placeholder="Your company name" />
                  </div>
                </>
              )}

              {/* Forgot password link - only on login */}
              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '.82rem', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}
              {success && mode !== 'reset-sent' && <div className="auth-error" style={{ background: '#E8F5E9', color: '#27AE60' }}>{success}</div>}

              <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                {submitting ? 'Please wait...' :
                 mode === 'login' ? 'Sign In' :
                 mode === 'register' ? 'Create Account' :
                 'Send Reset Link'}
              </button>
            </form>
          )}

          {/* Footer links */}
          {mode === 'login' && (
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.85rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <button type="button" onClick={() => { setMode('register'); setError(''); setSuccess('') }} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', fontSize: '.85rem' }}>
                Create one here
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.85rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess('') }} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', fontSize: '.85rem' }}>
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}


