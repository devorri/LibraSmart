import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  const [logFilter, setLogFilter] = useState<'All' | 'Entry' | 'Exit'>('All')
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

  const streamRef = useRef<MediaStream | null>(null)

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

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
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
      setCameraError('Live camera requires HTTPS or WebKit context. Use "Snap / Photo" below.')
      return
    }

    setCameraError(null)
    setScanResult(null)
    setLoading(true)

    // Ensure camera active state is true so video element is rendered in DOM
    setCameraActive(true)

    const constraintsToTry = [
      { video: { facingMode: { exact: 'environment' } } },
      { video: { facingMode: 'environment' } },
      { video: { facingMode: 'user' } },
      { video: true }
    ]

    let mediaStream: MediaStream | null = null
    let lastError: unknown = null

    for (const constraint of constraintsToTry) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraint)
        if (mediaStream) break
      } catch (e) {
        lastError = e
      }
    }

    if (!mediaStream) {
      setCameraActive(false)
      const errName = (lastError as Error)?.name || ''
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Grant access or tap "Snap / Photo" below.')
      } else {
        setCameraError('Live camera stream unavailable. Try "Snap / Photo" below.')
      }
      setLoading(false)
      return
    }

    try {
      const video = videoRef.current
      if (video) {
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')
        video.setAttribute('muted', 'true')
        video.setAttribute('autoplay', 'true')
        video.srcObject = mediaStream
        streamRef.current = mediaStream
        await video.play().catch(e => console.warn('Video play warning:', e))
      }
      setScanResult('Point camera at the library gate QR code.')
      if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = window.setInterval(scanFrame, 300)
    } catch (err: unknown) {
      console.warn('Camera error:', err)
      setCameraError('Live camera error. Tap "Snap / Photo" below.')
      setCameraActive(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectLog = async () => {
    const targetUserId = currentUser?.user_id || guestStudentId
    if (!targetUserId) {
      setCameraError('Please select your user account (Student or Teacher) first.')
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
        setAllUsers(usersData.filter(u => u.role === 'Student' || u.role === 'Teacher'))
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
    // The scanner callbacks use refs for current scan state; camera start should only follow role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  const isElevatedUser = currentUser?.role === 'Librarian' || currentUser?.role === 'Administrator';

  const entryCount = useMemo(() => logs.filter((l) => l.type === 'Entry').length, [logs])
  const exitCount = useMemo(() => logs.filter((l) => l.type === 'Exit').length, [logs])

  const filteredLogs = useMemo(() => {
    if (logFilter === 'All') return logs
    return logs.filter((l) => l.type === logFilter)
  }, [logs, logFilter])

  return (
    <div className="qr-manager-section" style={{ width: '100%', maxWidth: isElevatedUser ? '1200px' : '460px', margin: '0 auto' }}>
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
            <div className="viewfinder-container" style={{ padding: '20px 0', display: 'grid', placeItems: 'center' }}>
              <div className="viewfinder-screen" style={{ width: '220px', height: '220px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '14px', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
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

            <div style={{ textAlign: 'center', padding: '0 16px 16px 16px', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>
              <p style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '6px' }}>Stationary Entrance QR Code</p>
              <p style={{ margin: 0, lineHeight: 1.45 }}>Students and teachers can scan this QR code with their mobile devices to log Entry or Exit attendance automatically.</p>
            </div>
          </div>

          {/* Live Entry Exit Logs */}
          <div className="qr-panel gate-history">
            <div className="panel-header-clean">
              <div className="panel-header-title">
                <History className="header-icon text-gold" />
                <div>
                  <h3 className="feed-title">Gate Entries & Exits</h3>
                  <p className="feed-subtitle">Real-time attendance tracking feed</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="log-filter-pills">
                  <button
                    type="button"
                    className={`filter-pill ${logFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setLogFilter('All')}
                  >
                    All ({logs.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill entry ${logFilter === 'Entry' ? 'active' : ''}`}
                    onClick={() => setLogFilter('Entry')}
                  >
                    <LogIn size={11} /> Entry ({entryCount})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill exit ${logFilter === 'Exit' ? 'active' : ''}`}
                    onClick={() => setLogFilter('Exit')}
                  >
                    <LogOut size={11} /> Exit ({exitCount})
                  </button>
                </div>
                <button className="btn-icon-refresh" onClick={loadData} title="Refresh Logs">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="logs-feed-container">
              {filteredLogs.length === 0 ? (
                <div className="empty-logs-state">
                  <History size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p className="empty-msg">No {logFilter !== 'All' ? logFilter.toLowerCase() : ''} logs recorded today.</p>
                </div>
              ) : (
                <div className="logs-feed-list">
                  {filteredLogs.map((log) => (
                    <div key={log.log_id} className={`log-feed-row ${log.type.toLowerCase()}`}>
                      <div className="log-type-indicator">
                        {log.type === 'Entry' ? <LogIn size={13} /> : <LogOut size={13} />}
                        <span>{log.type}</span>
                      </div>
                      <div className="log-user-details">
                        <strong>{log.users?.name || 'Unknown User'}</strong>
                        <div className="log-user-sub">
                          <span className="role-tag">{log.users?.role || 'User'}</span>
                          <span className="dot-divider">•</span>
                          <span className="program-tag">{log.users?.program_strand || 'General'}</span>
                        </div>
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
        // CLEAN, PURE, UNCLUTTERED STUDENT / MOBILE SCANNER CONSOLE
        <div className="qr-panel scan-desk" style={{ padding: '16px' }}>
          {!currentUser && (
            <div style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.95)', borderRadius: '8px', border: '1px solid #0f7581', marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Student or Teacher Account</label>
              <select
                value={guestStudentId ?? ''}
                onChange={(e) => setGuestStudentId(Number(e.target.value) || null)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #0f7581', fontSize: '0.85rem' }}
              >
                <option value="">-- Choose Student or Teacher --</option>
                {allUsers.map(s => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.name} (@{s.username}) — [{s.role}] {s.program_strand || 'General'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Direction Toggle */}
          <div className="scan-type-toggle" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              className={`toggle-btn btn-entry ${scanType === 'Entry' ? 'active' : ''}`}
              onClick={() => setScanType('Entry')}
              disabled={loading}
              style={{ fontSize: '0.95rem', padding: '10px' }}
            >
              <LogIn size={18} /> Entry Gate
            </button>
            <button
              type="button"
              className={`toggle-btn btn-exit ${scanType === 'Exit' ? 'active' : ''}`}
              onClick={() => setScanType('Exit')}
              disabled={loading}
              style={{ fontSize: '0.95rem', padding: '10px' }}
            >
              <LogOut size={18} /> Exit Gate
            </button>
          </div>

          {/* Live Camera Viewfinder Box */}
          <div className="viewfinder-container">
            <div className={`viewfinder-screen ${cameraActive ? 'camera-active' : ''}`} style={{ background: '#09131d', borderRadius: '12px' }}>
              <div className="viewfinder-borders">
                <div className="border-tl"></div>
                <div className="border-tr"></div>
                <div className="border-bl"></div>
                <div className="border-br"></div>
              </div>

              <video
                ref={videoRef}
                className="scanner-video"
                autoPlay
                muted
                playsInline
                style={{ display: cameraActive ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', background: '#000000' }}
              />
              {!cameraActive && (
                <QRCodeSVG
                  value="MPCI-LIBRARY-GATE"
                  size={140}
                  bgColor="transparent"
                  fgColor="#0f7581"
                  level="Q"
                  className="qr-svg-placeholder"
                />
              )}

              {cameraActive && <div className="scanner-laser"></div>}

              <div className="scanner-status-overlay" style={{ bottom: '12px', left: '10px', right: '10px' }}>
                {cameraError ? (
                  <span className="status-badge error" style={{ fontSize: '0.78rem' }}>{cameraError}</span>
                ) : cameraActive ? (
                  <span className="pulse-text" style={{ fontSize: '0.82rem' }}>{scanResult || 'Point camera at library gate QR...'}</span>
                ) : scanResult ? (
                  <span className="status-badge-result success" style={{ fontSize: '0.82rem' }}>{scanResult}</span>
                ) : (
                  <span className="pulse-text-slow" style={{ fontSize: '0.82rem' }}>Point camera at the gate QR</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={loading}
                style={{ margin: 0, justifyContent: 'center', fontSize: '0.88rem' }}
              >
                {cameraActive ? 'Stop Camera' : 'Start Camera'} <Camera size={16} />
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                style={{ margin: 0, justifyContent: 'center', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
              >
                Snap / Photo <Upload size={16} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              className="btn-secondary"
              onClick={handleDirectLog}
              disabled={loading || (!currentUser && !guestStudentId)}
              style={{ width: '100%', justifyContent: 'center', color: '#2dd4bf', borderColor: 'rgba(45, 212, 191, 0.4)', padding: '10px', fontSize: '0.88rem' }}
            >
              Quick {scanType} Pass <CheckCircle size={16} />
            </button>
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  )
}
