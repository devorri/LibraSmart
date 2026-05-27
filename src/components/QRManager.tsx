import React, { useState, useEffect } from 'react'
import { addLibraryLog, fetchLibraryLogs, fetchAllUsers } from '../lib/supabase'
import type { LibraryLog, User } from '../lib/supabase'
import { QrCode, LogIn, LogOut, History, ShieldCheck, RefreshCw, Volume2 } from 'lucide-react'

interface QRManagerProps {
  currentUser: User | null
  onLogCreated: () => void // Callback to refresh dashboard logs
}

export function QRManager({ currentUser, onLogCreated }: QRManagerProps) {
  const [logs, setLogs] = useState<LibraryLog[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [scanType, setScanType] = useState<'Entry' | 'Exit'>('Entry')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load logs
  const loadData = async () => {
    try {
      const logsData = await fetchLibraryLogs()
      setLogs(logsData)

      if (currentUser?.role === 'Librarian' || currentUser?.role === 'Administrator') {
        const usersData = await fetchAllUsers()
        // Filter out librarians/admins for logging entry/exit
        const studentsAndTeachers = usersData.filter(u => u.role === 'Student' || u.role === 'Teacher')
        setAllUsers(studentsAndTeachers)
        if (studentsAndTeachers.length > 0) {
          setSelectedUserId(studentsAndTeachers[0].user_id.toString())
        }
      }
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

  // Simulate scanning QR code
  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return

    setScanning(true)
    setScanResult(null)
    setLoading(true)

    // Simulate camera laser sweeping for 1.2s
    setTimeout(async () => {
      try {
        const targetUserId = parseInt(selectedUserId)
        const targetUser = allUsers.find(u => u.user_id === targetUserId)
        
        if (!targetUser) {
          setScanResult('Error: User not found.')
          setScanning(false)
          setLoading(false)
          return
        }

        const newLog = await addLibraryLog(targetUserId, scanType)
        if (newLog) {
          playBeep()
          setScanResult(`Successfully logged ${scanType} for ${targetUser.name}!`)
          onLogCreated() // Refresh parent dashboard
          loadData() // Refresh local log list
        } else {
          setScanResult('Failed to log transaction. Try again.')
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
        // LIBRARIAN / ADMIN VIEW: SCANNING CONSOLE
        <div className="qr-grid">
          <div className="qr-panel scan-desk">
            <div className="panel-header">
              <QrCode className="header-icon text-teal" />
              <div>
                <h3>QR Gate Scanner</h3>
                <p className="subtitle">Matalam Polytechnic College Inc. Entrance</p>
              </div>
            </div>

            {/* Virtual Scan Camera Viewfinder */}
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
                    <span className="pulse-text">SCANNING CARD QR...</span>
                  ) : scanResult ? (
                    <span className="status-badge-result success">{scanResult}</span>
                  ) : (
                    <span className="pulse-text-slow">READY FOR QR CODE PASS</span>
                  )}
                </div>
                
                <QrCode size={120} className={`qr-svg-placeholder ${scanning ? 'spinning' : ''}`} />
              </div>
            </div>

            {/* Scan Simulation Controller */}
            <form onSubmit={handleSimulateScan} className="scan-control-form">
              <div className="form-group">
                <label htmlFor="student-select">Select Student / Teacher Code</label>
                <select
                  id="student-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={loading}
                >
                  {allUsers.length === 0 ? (
                    <option>No registered users found</option>
                  ) : (
                    allUsers.map(u => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name} ({u.role} - {u.program_strand || 'General'})
                      </option>
                    ))
                  )}
                </select>
              </div>

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
                disabled={loading || allUsers.length === 0}
              >
                {scanning ? 'Reading barcode...' : 'Simulate Scanning'} <Volume2 size={16} />
              </button>
            </form>
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
        // STUDENT / TEACHER VIEW: MY PASS
        <div className="qr-student-view">
          <div className="qr-card-container">
            <div className="school-header">
              <img src="/librasmart-logo-1024.png" alt="MPCI Logo" className="school-logo" />
              <div>
                <h3>Matalam Polytechnic College Inc.</h3>
                <span>LIBRARY ENTRY PASS</span>
              </div>
            </div>

            <div className="qr-pass-body">
              <div className="qr-pass-display">
                {/* Draw a beautiful simulated QR Code using SVG */}
                <svg width="200" height="200" viewBox="0 0 200 200" className="qr-code-svg">
                  {/* Outer square */}
                  <rect x="0" y="0" width="200" height="200" fill="white" rx="12" />
                  
                  {/* Finder pattern TL */}
                  <rect x="15" y="15" width="45" height="45" fill="#102131" />
                  <rect x="25" y="25" width="25" height="25" fill="white" />
                  <rect x="30" y="30" width="15" height="15" fill="#102131" />

                  {/* Finder pattern TR */}
                  <rect x="140" y="15" width="45" height="45" fill="#102131" />
                  <rect x="150" y="25" width="25" height="25" fill="white" />
                  <rect x="155" y="30" width="15" height="15" fill="#102131" />

                  {/* Finder pattern BL */}
                  <rect x="15" y="140" width="45" height="45" fill="#102131" />
                  <rect x="25" y="150" width="25" height="25" fill="white" />
                  <rect x="30" y="155" width="15" height="15" fill="#102131" />

                  {/* Simulated QR Code pixels */}
                  <rect x="75" y="20" width="10" height="10" fill="#f2bd4a" />
                  <rect x="90" y="35" width="15" height="10" fill="#0f7581" />
                  <rect x="110" y="15" width="20" height="10" fill="#102131" />
                  <rect x="70" y="60" width="10" height="30" fill="#102131" />
                  <rect x="100" y="65" width="30" height="10" fill="#0f7581" />
                  <rect x="150" y="80" width="15" height="15" fill="#f2bd4a" />
                  
                  <rect x="20" y="75" width="15" height="15" fill="#0f7581" />
                  <rect x="40" y="100" width="25" height="10" fill="#102131" />
                  <rect x="80" y="110" width="40" height="15" fill="#f2bd4a" />
                  <rect x="130" y="110" width="20" height="25" fill="#102131" />
                  
                  <rect x="75" y="140" width="15" height="10" fill="#102131" />
                  <rect x="100" y="155" width="20" height="20" fill="#0f7581" />
                  <rect x="160" y="145" width="15" height="30" fill="#102131" />
                </svg>
                <div className="qr-laser-line"></div>
              </div>
              
              <div className="student-pass-details">
                <h4>{currentUser?.name}</h4>
                <p className="student-id">ID: MPCI-2026-{currentUser?.user_id.toString().padStart(4, '0')}</p>
                <p className="student-meta">{currentUser?.role} • {currentUser?.program_strand || 'General Department'}</p>
              </div>
            </div>

            <div className="qr-pass-footer">
              <ShieldCheck size={16} /> Present this QR code pass at the library exit or entry desk gate scanner.
            </div>
          </div>

          {/* Student Log History */}
          <div className="student-logs-card">
            <div className="card-header">
              <History size={18} />
              <h4>My Gate Attendance Logs</h4>
            </div>
            
            <div className="logs-feed-container">
              {userLogs.length === 0 ? (
                <p className="empty-msg">No entry/exit logs found for your account.</p>
              ) : (
                <div className="logs-feed-list">
                  {userLogs.map(l => (
                    <div key={l.log_id} className={`log-feed-row ${l.type.toLowerCase()}`}>
                      <div className="log-type-indicator">
                        {l.type === 'Entry' ? <LogIn size={14} /> : <LogOut size={14} />}
                        <span>{l.type}</span>
                      </div>
                      <div className="log-user-details">
                        <strong>Library {l.type} Record</strong>
                        <span>Recorded successfully</span>
                      </div>
                      <div className="log-timestamp">
                        {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
