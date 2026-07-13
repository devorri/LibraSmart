import { useState, useEffect, useRef } from 'react'
import { addLibraryLog, fetchLibraryLogs } from '../lib/supabase'
import type { LibraryLog, User } from '../lib/supabase'
import { QrCode, LogIn, LogOut, History, RefreshCw, Volume2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import jsQR from 'jsqr'

interface QRManagerProps {
  currentUser: User | null
  onLogCreated: () => void // Callback to refresh dashboard logs
}

export function QRManager({ currentUser, onLogCreated }: QRManagerProps) {
  const [logs, setLogs] = useState<LibraryLog[]>([])
  const [scanType, setScanType] = useState<'Entry' | 'Exit'>('Entry')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

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

  const scanFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const targetUserId = currentUser?.user_id

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
      if (code.data.includes('MPCI-LIBRARY-GATE')) {
        stopCamera()
        setCameraError(null)
        setScanResult(`QR matched! Logging ${scanType}.`)
        setLoading(true)

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
      } else {
        setScanResult('Detected QR is not the library gate code.')
      }
    }
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser.')
      return
    }

    setCameraError(null)
    setScanResult(null)
    setLoading(true)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
        setCameraActive(true)
      setScanResult('Point your device at the library gate QR code.')
      scanIntervalRef.current = window.setInterval(scanFrame, 700)
    } catch (err) {
      setCameraError('Unable to open camera. Please allow access or use a supported device.')
      console.error('Camera error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load logs
  const loadData = async () => {
    try {
      const logsData = await fetchLibraryLogs()
      setLogs(logsData)
    } catch (err) {
      console.error("Error loading QR logs:", err)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [currentUser])

  // Play Scanner Beep Sound using browser AudioContext (no external files needed!)
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
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime) // 1000 Hz beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.15) // Beep duration 0.15s
    } catch (e) {
      console.warn("Audio Context beep failed:", e)
    }
  }

  const userLogs = logs.filter(l => l.user_id === currentUser?.user_id)

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
        // STUDENT / TEACHER VIEW: SCANNING HANDHELD CONSOLE
        <div className="qr-student-view">
            <div className="qr-panel scan-desk">
              <div className="panel-header">
                <QrCode className="header-icon text-teal" />
                <div>
                  <h3>Student / Teacher Gate Scanner</h3>
                  <p className="subtitle">Tap Scan to record entry or exit at the library gate. Select your direction first.</p>
                </div>
              </div>

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
                      <span className="pulse-text-slow">Open camera and point at the gate QR</span>
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

                <button
                  type="button"
                  className="btn-primary scan-submit-btn"
                  onClick={cameraActive ? stopCamera : startCamera}
                  disabled={loading}
                >
                  {cameraActive ? 'Stop Camera Scanner' : 'Open Camera Scanner'} <Volume2 size={16} />
                </button>
              </form>

              <div className="scan-help-note">
                <p>Open the camera scanner and point at the library gate QR to record your {scanType} pass.</p>
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
                          <strong>{currentUser?.name}</strong>
                          <span>{currentUser?.role}</span>
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
