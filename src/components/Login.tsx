import React, { useState } from 'react'
import { authenticateUser, registerUser } from '../lib/supabase'
import type { User } from '../lib/supabase'
import { UserCheck, UserPlus, Lock, User as UserIcon, Phone, BookOpen, GraduationCap, Eye, EyeOff } from 'lucide-react'

interface LoginProps {
  onLoginSuccess: (user: User) => void
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'Student' | 'Teacher'>('Student')
  const [programStrand, setProgramStrand] = useState('BSIT')
  const [academicLevel, setAcademicLevel] = useState('1st Year')
  const [phoneNumber, setPhoneNumber] = useState('+639123456789')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    if (!username || !password || !name || !phoneNumber) {
      setErrorMsg('Please fill in all required fields.')
      setLoading(false)
      return
    }

    // Format phone number to start with +639 if it's 09 or just digits
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
        password, // Simple text storage for school project
        role,
        program_strand: role === 'Student' ? programStrand : 'Faculty',
        academic_level: role === 'Student' ? academicLevel : 'Faculty',
        phone_number: formattedPhone
      })

      if (newUser) {
        setSuccessMsg('Account created successfully! Please log in.')
        setIsRegistering(false)
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
              <button type="button" onClick={() => { setIsRegistering(true); setErrorMsg(''); }}>
                Create one here
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
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
                <Phone size={16} /> Mobile Phone Number (for SMS)
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
                    <option value="1st Year">1st Year College</option>
                    <option value="2nd Year">2nd Year College</option>
                    <option value="3rd Year">3rd Year College</option>
                    <option value="4th Year">4th Year College</option>
                    <option value="Grade 11">Grade 11 Senior High</option>
                    <option value="Grade 12">Grade 12 Senior High</option>
                  </select>
                </div>
              )}
            </div>

            {role === 'Student' && (
              <div className="form-group">
                <label htmlFor="reg-strand">Program / Academic Strand</label>
                <select
                  id="reg-strand"
                  value={programStrand}
                  onChange={(e) => setProgramStrand(e.target.value)}
                >
                  <option value="BSIT">BS In Information Technology</option>
                  <option value="BSA">BS In Accountancy</option>
                  <option value="BSBA">BS In Business Administration</option>
                  <option value="BSED">Bachelor of Secondary Education</option>
                  <option value="Grade 11 - STEM">SHS STEM Strand</option>
                  <option value="Grade 12 - ICT">SHS TVL-ICT Strand</option>
                  <option value="Grade 11 - ABM">SHS ABM Strand</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register Account'} <UserPlus size={18} />
            </button>

            <div className="login-toggle">
              Already have an account?{' '}
              <button type="button" onClick={() => { setIsRegistering(false); setErrorMsg(''); }}>
                Sign in instead
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
