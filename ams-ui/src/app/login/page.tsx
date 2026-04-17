'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react'
import { authApi } from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    authApi.me()
      .then(() => {
        router.replace('/')
      })
      .catch(() => {
        localStorage.removeItem('ams_user')
      })
  }, [router])

  // Force password change state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [pendingUser, setPendingUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [changeError, setChangeError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setError('')
    setIsLoading(true)
    try {
      const user = await authApi.login(email, password)

      if (user.must_change_password) {
        // Don't navigate — show the change password modal
        setPendingUser(user)
        setShowChangePassword(true)
      } else {
        localStorage.setItem('ams_user', JSON.stringify(user))
        router.replace('/')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    }
    setIsLoading(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) { setChangeError('Please fill in all fields'); return }
    if (newPassword.length < 6) { setChangeError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setChangeError('Passwords do not match'); return }

    setChangeError('')
    setChangingPassword(true)
    try {
      await authApi.changePassword(pendingUser.id, newPassword, confirmPassword)

      // Password changed — update the user object and proceed to dashboard
      const updatedUser = { ...pendingUser, must_change_password: false }
      localStorage.setItem('ams_user', JSON.stringify(updatedUser))
      router.replace('/')
    } catch (err: any) {
      setChangeError(err.message || 'Failed to change password')
    }
    setChangingPassword(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdfcfb 0%, #f5f0eb 30%, #f0e6da 60%, #ede0d4 100%)' }}>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      {/* Top-right warm accent */}
      <div className="absolute top-[-15%] right-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(244,164,64,0.06) 0%, transparent 65%)' }} />
      {/* Bottom-left cool accent */}
      <div className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(120,100,80,0.04) 0%, transparent 65%)' }} />

      <div className="relative z-10 w-full max-w-[960px] overflow-hidden rounded-2xl flex flex-col lg:flex-row" style={{ background: '#ffffff', boxShadow: '0 25px 50px rgba(0,0,0,0.1), 0 10px 25px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
        {/* Left — Brand */}
        <div className="lg:w-[45%] flex flex-col items-center justify-center p-10 lg:p-14 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #f4a440 0%, #e8933a 50%, #d4802e 100%)' }}>
          <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] rounded-full border pointer-events-none" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
          <div className="absolute bottom-[-40px] left-[-40px] w-[160px] h-[160px] rounded-full border pointer-events-none" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <div className="absolute top-[20%] left-[10%] w-[100px] h-[100px] rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="w-36 h-36 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
              <img src="/LOGO%20SVG.svg" alt="Chanakya Career Point" className="w-full h-full object-contain relative z-10" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight lg:leading-tight" style={{ color: '#ffffff' }}>
                Chanakya Career<br />
                <span style={{ color: 'rgba(255,255,255,0.95)' }}>Point</span>
              </h1>
              <p className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Admission Management System</p>
              <div className="w-12 h-[2px] mx-auto rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
            </div>
            <div className="space-y-3 w-full max-w-[220px]">
              {['Multi-Branch Control', 'Real-time Analytics', 'WhatsApp Integration'].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#ffffff' }} />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Form / Change Password */}
        <div className="lg:w-[55%] flex items-center justify-center p-8 lg:p-14" style={{ background: '#ffffff' }}>
          <div className="w-full max-w-[360px]">

            {/* ═══════════ CHANGE PASSWORD VIEW ═══════════ */}
            {showChangePassword ? (
              <>
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(244,164,64,0.12)' }}>
                    <KeyRound size={28} style={{ color: '#f4a440' }} />
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Change Your Password</h2>
                  <p className="text-base mt-2 leading-relaxed" style={{ color: '#4b5563' }}>
                    Welcome, <strong style={{ color: '#0f172a' }}>{pendingUser?.full_name}</strong>! For security, you must set a new password before continuing.
                  </p>
                </div>

                {changeError && (
                  <div className="mb-4 px-4 py-3 rounded-lg text-xs font-medium" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.15)' }}>{changeError}</div>
                )}

                <div className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold" style={{ color: '#374151' }}>New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200" size={18} style={{ color: newPassword ? '#f4a440' : '#9ca3af' }} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-11 pr-12 py-3 rounded-xl text-base outline-none transition-all duration-200"
                        style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#0f172a' }}
                        onFocus={e => { e.target.style.borderColor = '#f4a440'; e.target.style.boxShadow = '0 0 0 3px rgba(244,164,64,0.12)' }}
                        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                      />
                      <button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold" style={{ color: '#374151' }}>Confirm Password</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200" size={18} style={{ color: confirmPassword && confirmPassword === newPassword ? '#10b981' : '#9ca3af' }} />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-base outline-none transition-all duration-200"
                        style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#0f172a' }}
                        onFocus={e => { e.target.style.borderColor = '#f4a440'; e.target.style.boxShadow = '0 0 0 3px rgba(244,164,64,0.12)' }}
                        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                      />
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-[11px] mt-1" style={{ color: '#dc2626' }}>Passwords do not match</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                      <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: '#10b981' }}>
                        <ShieldCheck size={11} /> Passwords match
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all duration-300 mt-4 group disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: changingPassword ? 'rgba(244,164,64,0.5)' : '#f4a440', color: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
                  >
                    {changingPassword
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><span>Set New Password & Continue</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                    }
                  </button>
                </div>
              </>
            ) : (
              /* ═══════════ NORMAL LOGIN VIEW ═══════════ */
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Welcome back</h2>
                  <p className="text-base mt-2" style={{ color: '#4b5563' }}>Sign in to your account to continue</p>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-lg text-xs font-medium" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold" style={{ color: '#374151' }}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200" size={18} style={{ color: email ? '#f4a440' : '#9ca3af' }} />
                      <input id="login-email" type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@123"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-base outline-none transition-all duration-200"
                        style={{ background: '#fafafa', border: '1px solid #e2e4e8', color: '#0f172a' }}
                        onFocus={e => { e.target.style.borderColor = '#f4a440'; e.target.style.boxShadow = '0 0 0 3px rgba(244,164,64,0.12)' }}
                        onBlur={e => { e.target.style.borderColor = '#e2e4e8'; e.target.style.boxShadow = 'none' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold" style={{ color: '#374151' }}>Password</label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200" size={18} style={{ color: password ? '#f4a440' : '#9ca3af' }} />
                      <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                        className="w-full pl-11 pr-12 py-3.5 rounded-xl text-base outline-none transition-all duration-200"
                        style={{ background: '#fafafa', border: '1px solid #e2e4e8', color: '#0f172a' }}
                        onFocus={e => { e.target.style.borderColor = '#f4a440'; e.target.style.boxShadow = '0 0 0 3px rgba(244,164,64,0.12)' }}
                        onBlur={e => { e.target.style.borderColor = '#e2e4e8'; e.target.style.boxShadow = 'none' }}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button id="login-submit" type="submit" disabled={isLoading}
                    className="w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all duration-300 mt-4 group"
                    style={{ background: isLoading ? 'rgba(244,164,64,0.5)' : 'linear-gradient(135deg, #f4a440 0%, #e8933a 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              </>
            )}

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: '#9ca3af' }}>Secure Login</span>
              <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
            </div>
            <p className="text-center text-[11px]" style={{ color: '#9ca3af' }}>© {new Date().getFullYear()} Chanakya Career Point. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
