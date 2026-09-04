import React, { useState } from 'react'
import { authenticateUser, registerUser, queueNotification, sendSMSViaSemaphore } from '../lib/supabase'
import type { User } from '../lib/supabase'
import { UserCheck, Lock, User as UserIcon, Phone, BookOpen, GraduationCap, Eye, EyeOff, ShieldCheck, RefreshCcw, Smartphone, Send, MessageSquare, X } from 'lucide-react'

interface LoginProps {
  onLoginSuccess: (user: User) => void
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'Student' | 'Teacher'>('Student')
  const [programStrand, setProgramStrand] = useState('ICT')
  const [academicLevel, setAcademicLevel] = useState('1st Year')
  const [phoneNumber, setPhoneNumber] = useState('+639123456789')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Test SMS Modal State
  const [showTestSmsModal, setShowTestSmsModal] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('This is LibraSmart')
  const [testSmsLoading, setTestSmsLoading] = useState(false)
  const [testSmsStatus, setTestSmsStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    if (!username || !password) {
      setErrorMsg('Please fill in all fields.')
      setLoading(false)
      return
    }

    try {
      const user = await authenticateUser(username, password)
      if (user) {
        onLoginSuccess(user)
      } else {
        setErrorMsg('Invalid username or password.')
      }
    } catch (err) {
      setErrorMsg('An error occurred during sign in.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    if (!username || !password || !name || !phoneNumber) {
      setErrorMsg('Please fill in all required fields.')
      setLoading(false)
      return
    }

    let formattedPhone = phoneNumber.trim()
    if (formattedPhone.startsWith('09')) {
      formattedPhone = '+63' + formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+63' + formattedPhone
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)

    const smsMessage = `LibraSmart OTP: Your account verification code is ${otp}. Do not share this code.`

    await sendSMSViaSemaphore(formattedPhone, smsMessage)
    await queueNotification(0, formattedPhone, smsMessage, 'Transaction')

    setShowOtpStep(true)
    setSuccessMsg(`OTP verification code sent to ${formattedPhone} via SMS.`)
    setLoading(false)
  }

  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (enteredOtp.trim() !== generatedOtp) {
      setErrorMsg('Invalid OTP code. Please check the SMS notification and try again.')
      return
    }

    setLoading(true)

    let formattedPhone = phoneNumber.trim()
    if (formattedPhone.startsWith('09')) {
      formattedPhone = '+63' + formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+63' + formattedPhone
    }

    try {
      const newUser = await registerUser({
        name,
        username: username.toLowerCase().trim(),
        password,
        role,
        program_strand: role === 'Student' ? programStrand : 'Faculty',
        academic_level: role === 'Student' ? academicLevel : 'Faculty',
        phone_number: formattedPhone
      })

      if (newUser) {
        setSuccessMsg('Account created & authenticated successfully! Please log in.')
        setIsRegistering(false)
        setShowOtpStep(false)
        setEnteredOtp('')
        setUsername(newUser.username)
        setPassword('')
      } else {
        setErrorMsg('Username may already be taken. Try another.')
      }
    } catch (err) {
      setErrorMsg('An error occurred during registration.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault()
    setTestSmsStatus(null)

    if (!testPhone.trim()) {
      setTestSmsStatus({ type: 'error', text: 'Please enter a mobile phone number.' })
      return
    }

    setTestSmsLoading(true)

    let formattedPhone = testPhone.trim()
    if (formattedPhone.startsWith('09')) {
      formattedPhone = '+63' + formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+63' + formattedPhone
    }

    const textToSend = testMessage.trim() || 'This is LibraSmart'

    try {
      const success = await sendSMSViaSemaphore(formattedPhone, textToSend)
      await queueNotification(0, formattedPhone, textToSend, 'Transaction')

      if (success) {
        setTestSmsStatus({
          type: 'success',
          text: `Test SMS successfully sent to ${formattedPhone} via Semaphore (Sender: TranslertPH)!`
        })
      } else {
        setTestSmsStatus({
          type: 'error',
          text: 'Failed to send SMS. Please verify network connection or mobile number.'
        })
      }
    } catch (err: any) {
      console.error('Test SMS error:', err)
      setTestSmsStatus({
        type: 'error',
        text: err?.message || 'Error sending test SMS.'
      })
    } finally {
      setTestSmsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className={`login-card ${isRegistering ? 'login-card-register' : ''}`}>
        <div className="login-header">
          <img src="/librasmart-logo-1024.png" alt="LibraSmart Logo" className="login-logo" />
          <h2>LibraSmart</h2>
          <p className="login-subtitle">
            Web-Based Library Management System & Analytics<br />
            <strong>Matalam Polytechnic College Inc.</strong>
          </p>
        </div>

        {errorMsg && <div className="login-alert error">{errorMsg}</div>}
        {successMsg && <div className="login-alert success">{successMsg}</div>}

        {!isRegistering ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">
                <UserIcon size={16} /> Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. marlon"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={16} /> Password
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>

            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'} <UserCheck size={18} />
            </button>

            <div className="login-toggle">
              Don't have an account?{' '}
              <button type="button" onClick={() => { setIsRegistering(true); setShowOtpStep(false); setErrorMsg(''); }}>
                Create one here
              </button>
            </div>
          </form>
        ) : showOtpStep ? (
          <form onSubmit={handleVerifyOtpAndRegister} className="login-form">
            <div className="otp-verification-box">
              <ShieldCheck size={36} className="otp-icon" />
              <h3>User Authentication (OTP)</h3>
              <p>Enter the 6-digit OTP sent to <strong>{phoneNumber}</strong> to verify you are a real user.</p>
              
              <div className="form-group">
                <label htmlFor="otp-input">Enter 6-Digit OTP</label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="e.g. 123456"
                  className="otp-code-input"
                  required
                />
              </div>

              <button type="submit" className="btn-primary login-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP & Create Account'} <ShieldCheck size={18} />
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '0.75rem', width: '100%' }}
                onClick={() => setShowOtpStep(false)}
              >
                <RefreshCcw size={16} /> Back to Edit Details
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-name">
                <BookOpen size={16} /> Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marlon G. Tagamolila"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-username">
                <UserIcon size={16} /> Username
              </label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (for login)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">
                <Lock size={16} /> Password
              </label>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">
                <Phone size={16} /> Mobile Phone Number (for SMS OTP)
              </label>
              <input
                id="reg-phone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+639123456789"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="reg-role">Role</label>
                <select
                  id="reg-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'Student' | 'Teacher')}
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                </select>
              </div>

              {role === 'Student' && (
                <div className="form-group">
                  <label htmlFor="reg-level">
                    <GraduationCap size={16} /> Grade/Year Level
                  </label>
                  <select
                    id="reg-level"
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                  >
                    <option value="1st Year">1st Year Course</option>
                    <option value="2nd Year">2nd Year Course</option>
                    <option value="3rd Year">3rd Year Course</option>
                    <option value="4th Year">4th Year Course</option>
                    <option value="Grade 11">Grade 11 Senior High</option>
                    <option value="Grade 12">Grade 12 Senior High</option>
                  </select>
                </div>
              )}
            </div>

            {role === 'Student' && (
              <div className="form-group">
                <label htmlFor="reg-strand">Program / Academic Strand / Course</label>
                <select
                  id="reg-strand"
                  value={programStrand}
                  onChange={(e) => setProgramStrand(e.target.value)}
                >
                  <optgroup label="SHS Strands (G11 - G12)">
                    <option value="ICT">ICT (Information & Communications Technology)</option>
                    <option value="SMAW">SMAW (Shielded Metal Arc Welding)</option>
                    <option value="Automotive">Automotive Servicing</option>
                    <option value="HUMSS">HUMSS (Humanities & Social Sciences)</option>
                    <option value="Healthcare">Healthcare Services</option>
                  </optgroup>
                  <optgroup label="College Courses (1st - 2nd Year & Degree)">
                    <option value="IT">IT / BS In Information Technology</option>
                    <option value="Healthcare">Healthcare Course</option>
                    <option value="SMAW">SMAW Course</option>
                    <option value="Automotive">Automotive Course</option>
                    <option value="BSA">BSA (BS In Accountancy)</option>
                    <option value="BSBA">BSBA (BS In Business Administration)</option>
                    <option value="BSED">BSED (Bachelor of Secondary Education)</option>
                  </optgroup>
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP Verification'} <ShieldCheck size={18} />
            </button>

            <div className="login-toggle">
              Already have an account?{' '}
              <button type="button" onClick={() => { setIsRegistering(false); setShowOtpStep(false); setErrorMsg(''); }}>
                Sign in instead
              </button>
            </div>
          </form>
        )}

        <button
          type="button"
          className="btn-test-sms-landing"
          onClick={() => {
            setShowTestSmsModal(true)
            setTestSmsStatus(null)
          }}
        >
          <Smartphone size={16} /> Test Real SMS Gateway
        </button>

        {showTestSmsModal && (
          <div className="test-sms-modal-overlay" onClick={() => setShowTestSmsModal(false)}>
            <div className="test-sms-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="test-sms-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={20} style={{ color: '#2dd4bf' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Test Real SMS Gateway</h3>
                </div>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  onClick={() => setShowTestSmsModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <p className="test-sms-subtitle">
                Enter your mobile phone number below to send a live SMS message via Semaphore Gateway (Sender: <strong>TranslertPH</strong>).
              </p>

              {testSmsStatus && (
                <div className={`login-alert ${testSmsStatus.type}`} style={{ marginBottom: '14px' }}>
                  {testSmsStatus.text}
                </div>
              )}

              <form onSubmit={handleSendTestSms} className="test-sms-form">
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="test-phone">
                    <Phone size={15} /> Mobile Phone Number
                  </label>
                  <input
                    id="test-phone"
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="e.g. 09123456789 or +639123456789"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="test-msg">
                    <MessageSquare size={15} /> SMS Message Text
                  </label>
                  <textarea
                    id="test-msg"
                    rows={3}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="This is LibraSmart"
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowTestSmsModal(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn-primary" disabled={testSmsLoading}>
                    {testSmsLoading ? 'Sending SMS...' : 'Send Test SMS'} <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
