import React, { useState, useEffect } from 'react'
import { addLibraryLog, fetchLibraryLogs } from '../lib/supabase'
import type { LibraryLog, User } from '../lib/supabase'
import { QrCode, LogIn, LogOut, History, RefreshCw, Volume2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface QRManagerProps {
  currentUser: User | null
  onLogCreated: () => void // Callback to refresh dashboard logs
}

export function QRManager({ currentUser, onLogCreated }: QRManagerProps) {
  const [logs, setLogs] = useState<LibraryLog[]>([])
  const [scanType, setScanType] = useState<'Entry' | 'Exit'>('Entry')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  // Simulate scanning library QR code
  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Student or teacher scanning the stationary gate QR
    const targetUserId = currentUser?.user_id
    if (!targetUserId) return

    setScanning(true)
    setScanResult(null)
    setLoading(true)

    // Simulate camera laser sweeping for 1.2s
    setTimeout(async () => {
      try {
        const newLog = await addLibraryLog(targetUserId, scanType)
        if (newLog) {
          playBeep()
          setScanResult(`Successfully logged ${scanType}!`)
          onLogCreated() // Refresh parent dashboard
          loadData() // Refresh local log list
        } else {
          setScanResult('Failed to log attendance. Try again.')
        }
      } catch (err) {
        setScanResult('Error saving gate record.')
        console.error(err)
      } finally {
        setScanning(false)
        setLoading(false)
      }
    }, 1200)
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
          <div className="qr-grid">
            <div className="qr-panel scan-desk">
              <div className="panel-header">
                <QrCode className="header-icon text-teal" />
                <div>
                  <h3>Scan Library Gate QR</h3>
                  <p className="subtitle">Identify check-in or check-out state</p>
                </div>
              </div>

              {/* Virtual Scanner Viewfinder on Student Screen */}
              <div className="viewfinder-container">
                <div className={`viewfinder-screen ${scanning ? 'scanning' : ''}`}>
                  <div className="viewfinder-borders">
                    <div className="border-tl"></div>
                    <div className="border-tr"></div>
                    <div className="border-bl"></div>
                    <div className="border-br"></div>
                  </div>
                  
                  {/* Scanning Laser Line */}
                  {scanning && <div className="scanner-laser"></div>}

                  <div className="scanner-status-overlay">
                    {scanning ? (
                      <span className="pulse-text">SCANNING LIBRARY GATE...</span>
                    ) : scanResult ? (
                      <span className="status-badge-result success">{scanResult}</span>
                    ) : (
                      <span className="pulse-text-slow">POINT CAMERA TO LIBRARY QR</span>
                    )}
                  </div>

                  {/* Target scan gate QR */}
                  <QRCodeSVG
                    value="MPCI-LIBRARY-GATE"
                    size={130}
                    bgColor="transparent"
                    fgColor="#0f7581"
                    level="Q"
                    className={`qr-svg-placeholder ${scanning ? 'spinning' : ''}`}
                  />
                </div>
              </div>

              {/* Scan controller */}
              <form onSubmit={handleSimulateScan} className="scan-control-form">
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
                  type="submit"
                  className="btn-primary scan-submit-btn"
                  disabled={loading}
                >
                  {scanning ? 'Analyzing QR Code...' : 'Simulate Scanning Library QR'} <Volume2 size={16} />
                </button>
              </form>
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
        </div>
      )}
    </div>
  )
}
