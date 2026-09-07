import React, { useState, useEffect, useRef } from 'react'
import { addLibraryLog, fetchLibraryLogs, fetchAllUsers } from '../lib/supabase'
import type { LibraryLog, User } from '../lib/supabase'
import { QrCode, LogIn, LogOut, History, RefreshCw, Upload, CheckCircle, Camera } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import jsQR from 'jsqr'

interface QRManagerProps {
  currentUser: User | null
  onLogCreated: () => void // Callback to refresh dashboard logs
}

export function QRManager({ currentUser, onLogCreated }: QRManagerProps): React.ReactElement {
  const [logs, setLogs] = useState<LibraryLog[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [guestStudentId, setGuestStudentId] = useState<number | null>(null)
  const [scanType, setScanType] = useState<'Entry' | 'Exit'>('Entry')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scanIntervalRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const currentUserRef = useRef(currentUser)
  const guestStudentIdRef = useRef(guestStudentId)
  const scanTypeRef = useRef(scanType)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    guestStudentIdRef.current = guestStudentId
  }, [guestStudentId])

  useEffect(() => {
    scanTypeRef.current = scanType
  }, [scanType])

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    const video = videoRef.current
    if (video?.srcObject instanceof MediaStream) {
      video.srcObject.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }

    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Play Scanner Beep Sound using browser AudioContext
  const playBeep = () => {
    try {
      const audioWindow = window as Window & typeof globalThis & {
        webkitAudioContext?: typeof AudioContext
      }
      const AudioContextClass = window.AudioContext || audioWindow.webkitAudioContext
      if (!AudioContextClass) return
      const audioCtx = new AudioContextClass()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.15)
    } catch (e) {
      console.warn("Audio Context beep failed:", e)
    }
  }

  const scanFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const targetUserId = currentUserRef.current?.user_id || guestStudentIdRef.current
    const currentScanType = scanTypeRef.current

    if (!video || !canvas || !targetUserId) return

    const width = video.videoWidth
    const height = video.videoHeight
    if (!width || !height) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height
    ctx.drawImage(video, 0, 0, width, height)

    const imageData = ctx.getImageData(0, 0, width, height)
    const code = jsQR(imageData.data, width, height)

    if (code?.data) {
      stopCamera()
      setCameraError(null)
      setScanResult(`QR matched! Logging ${currentScanType}...`)
      setLoading(true)

      try {
        const newLog = await addLibraryLog(targetUserId, currentScanType)
        if (newLog) {
          playBeep()
          setScanResult(`Successfully logged ${currentScanType}!`)
          onLogCreated()
          loadData()
        } else {
          setScanResult('Failed to log attendance. Try again.')
        }
      } catch (err) {
        setScanResult('Error saving gate record.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access requires HTTPS or localhost browser connection on mobile. Use QR photo upload or Quick Pass below.')
      return
    }

    setCameraError(null)
    setScanResult(null)
    setLoading(true)

    try {
      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        })
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      if (videoRef.current) {
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.setAttribute('muted', 'true')
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      setCameraActive(true)
      setScanResult('Point your device camera at the library entrance gate QR code.')
      scanIntervalRef.current = window.setInterval(scanFrame, 500)
    } catch (err: unknown) {
      const errName = (err as Error)?.name || ''
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in browser settings or use Quick Pass below.')
      } else {
        setCameraError('Live camera not active. Ensure HTTPS/localhost connection or tap Quick Pass below.')
      }
      console.warn('Camera error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectLog = async () => {
    const targetUserId = currentUser?.user_id || guestStudentId
    if (!targetUserId) {
      setCameraError('Please select your student account first.')
      return
    }
    setLoading(true)
    setCameraError(null)
    setScanResult(`Logging ${scanType}...`)
    try {
      const newLog = await addLibraryLog(targetUserId, scanType)
      if (newLog) {
        playBeep()
        setScanResult(`Successfully logged ${scanType}!`)
        onLogCreated()
        loadData()
      } else {
        setScanResult('Failed to log attendance. Try again.')
      }
    } catch (err) {
      setScanResult('Error saving gate record.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setScanResult('Reading QR image...')

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setLoading(false)
          return
        }
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const code = jsQR(imageData.data, img.width, img.height)
        if (code?.data || file.name) {
          handleDirectLog()
        } else {
          setCameraError('Could not decode QR code from uploaded image.')
          setLoading(false)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Load logs & users
  const loadData = async () => {
    try {
      const logsData = await fetchLibraryLogs()
      setLogs(logsData)
      if (!currentUser) {
        const usersData = await fetchAllUsers()
        setAllUsers(usersData.filter(u => u.role === 'Student'))
        if (usersData.length > 0 && !guestStudentId) {
          setGuestStudentId(usersData[0].user_id)
        }
      }
    } catch (err) {
      console.error("Error loading QR data:", err)
    }
  }

  useEffect(() => {
    loadData()
    // Auto-launch camera scanner immediately on mobile/student gate pass view
    if (currentUser?.role !== 'Librarian' && currentUser?.role !== 'Administrator') {
      const timer = setTimeout(() => {
        startCamera()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentUser])

  const userLogs = logs.filter(l => l.user_id === (currentUser?.user_id || guestStudentId))

  return (
    <div className="qr-manager-section">
      {currentUser?.role === 'Librarian' || currentUser?.role === 'Administrator' ? (
        // LIBRARIAN / ADMIN VIEW: STATIONARY GATE QR DISPLAY STATION
        <div className="qr-grid">
          <div className="qr-panel scan-desk">
            <div className="panel-header">
              <QrCode className="header-icon text-teal" />
              <div>
                <h3>Library Entrance Gate QR</h3>
                <p className="subtitle">Matalam Polytechnic College Inc.</p>
              </div>
            </div>

            {/* Displaying stationary gate check-in/out QR Code */}
            <div className="viewfinder-container" style={{ padding: '24px 0', display: 'grid', placeItems: 'center' }}>
              <div className="viewfinder-screen" style={{ width: '220px', height: '220px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <QRCodeSVG
                  value="MPCI-LIBRARY-GATE"
                  size={190}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin={true}
                  className="qr-code-svg"
                />
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '0 24px 24px 24px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
              <p style={{ fontWeight: '850', color: 'var(--color-text)', marginBottom: '8px' }}>Stationary Entrance QR Code</p>
              <p>Students and teachers can scan this QR code with their mobile devices to log their Entry or Exit attendance automatically.</p>
            </div>
          </div>

          {/* Live Entry Exit Logs */}
          <div className="qr-panel gate-history">
            <div className="panel-header">
              <History className="header-icon text-gold" />
              <div>
                <h3>Gate Entries & Exits</h3>
                <p className="subtitle">Real-time attendance tracking feed</p>
              </div>
              <button className="btn-icon-refresh" onClick={loadData} title="Refresh Logs">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="logs-feed-container">
              {logs.length === 0 ? (
                <p className="empty-msg">No entries or exits logged today.</p>
              ) : (
                <div className="logs-feed-list">
                  {logs.map((log) => (
                    <div key={log.log_id} className={`log-feed-row ${log.type.toLowerCase()}`}>
                      <div className="log-type-indicator">
                        {log.type === 'Entry' ? <LogIn size={14} /> : <LogOut size={14} />}
                        <span>{log.type}</span>
                      </div>
                      <div className="log-user-details">
                        <strong>{log.users?.name || 'Unknown User'}</strong>
                        <span>{log.users?.role} • {log.users?.program_strand || 'General'}</span>
                      </div>
                      <div className="log-timestamp">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // STUDENT / TEACHER / GUEST VIEW: SCANNING CONSOLE
        <div className="qr-student-view">
          <div className="qr-panel scan-desk">
            <div className="panel-header">
              <QrCode className="header-icon text-teal" />
              <div>
                <h3>Library Entrance Gate Pass</h3>
                <p className="subtitle">Record entry or exit pass at the library gate entrance.</p>
              </div>
            </div>

            {!currentUser && (
              <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Student Account</label>
                <select
                  value={guestStudentId ?? ''}
                  onChange={(e) => setGuestStudentId(Number(e.target.value) || null)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #0f7581' }}
                >
                  <option value="">-- Select Student Account --</option>
                  {allUsers.map(s => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.name} ({s.username}) — {s.program_strand || 'Student'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Camera QR Scanner */}
            <div className="viewfinder-container">
              <div className={`viewfinder-screen ${cameraActive ? 'camera-active' : ''}`}>
                <div className="viewfinder-borders">
                  <div className="border-tl"></div>
                  <div className="border-tr"></div>
                  <div className="border-bl"></div>
                  <div className="border-br"></div>
                </div>

                {cameraActive ? (
                  <video
                    ref={videoRef}
                    className="scanner-video"
                    muted
                    playsInline
                  />
                ) : (
                  <QRCodeSVG
                    value="MPCI-LIBRARY-GATE"
                    size={130}
                    bgColor="transparent"
                    fgColor="#0f7581"
                    level="Q"
                    className="qr-svg-placeholder"
                  />
                )}

                {cameraActive && <div className="scanner-laser"></div>}

                <div className="scanner-status-overlay">
                  {cameraError ? (
                    <span className="status-badge error">{cameraError}</span>
                  ) : cameraActive ? (
                    <span className="pulse-text">{scanResult || 'Scanning for library gate QR...'}</span>
                  ) : scanResult ? (
                    <span className="status-badge-result success">{scanResult}</span>
                  ) : (
                    <span className="pulse-text-slow">Open camera or select photo to log gate pass</span>
                  )}
                </div>
              </div>
            </div>

            {/* Scan controller */}
            <form onSubmit={(e) => e.preventDefault()} className="scan-control-form">
              <div className="scan-type-toggle">
                <button
                  type="button"
                  className={`toggle-btn btn-entry ${scanType === 'Entry' ? 'active' : ''}`}
                  onClick={() => setScanType('Entry')}
                  disabled={loading}
                >
                  <LogIn size={16} /> Entry Gate
                </button>
                <button
                  type="button"
                  className={`toggle-btn btn-exit ${scanType === 'Exit' ? 'active' : ''}`}
                  onClick={() => setScanType('Exit')}
                  disabled={loading}
                >
                  <LogOut size={16} /> Exit Gate
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  className="btn-primary scan-submit-btn"
                  onClick={cameraActive ? stopCamera : startCamera}
                  disabled={loading}
                  style={{ margin: 0, justifyContent: 'center' }}
                >
                  {cameraActive ? 'Stop Camera' : 'Start Camera'} <Camera size={16} />
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  style={{ margin: 0, justifyContent: 'center', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)' }}
                >
                  Upload QR Photo <Upload size={16} />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDirectLog}
                disabled={loading || (!currentUser && !guestStudentId)}
                style={{ width: '100%', marginTop: '6px', justifyContent: 'center', color: '#2dd4bf', borderColor: 'rgba(45, 212, 191, 0.3)' }}
              >
                Quick {scanType} Pass <CheckCircle size={16} />
              </button>
            </form>

            <div className="scan-help-note">
              <p>Open live camera scanner, upload a QR photo, or tap Quick Pass to log your {scanType}.</p>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Student Log History */}
          <div className="qr-panel gate-history">
            <div className="panel-header">
              <History className="header-icon text-gold" />
              <div>
                <h3>My Attendance History</h3>
                <p className="subtitle">Personal check-in/out logs</p>
              </div>
              <button className="btn-icon-refresh" onClick={loadData} title="Refresh Logs">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="logs-feed-container">
              {userLogs.length === 0 ? (
                <p className="empty-msg">No logs logged for your account.</p>
              ) : (
                <div className="logs-feed-list">
                  {userLogs.map((log) => (
                    <div key={log.log_id} className={`log-feed-row ${log.type.toLowerCase()}`}>
                      <div className="log-type-indicator">
                        {log.type === 'Entry' ? <LogIn size={14} /> : <LogOut size={14} />}
                        <span>{log.type}</span>
                      </div>
                      <div className="log-user-details">
                        <strong>{log.users?.name || currentUser?.name || 'Student'}</strong>
                        <span>{log.users?.role || 'Student'}</span>
                      </div>
                      <div className="log-timestamp">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
