import { useState, useEffect } from 'react'
import { fetchNotifications } from '../lib/supabase'
import type { Notification, User } from '../lib/supabase'
import { Smartphone, X, Bell, ShieldAlert, CheckCheck } from 'lucide-react'

interface SMSPhoneSimulatorProps {
  currentUser: User | null
  triggerRefreshSignal: number // Incremented whenever a notification is sent
}

export function SMSPhoneSimulator({ currentUser, triggerRefreshSignal }: SMSPhoneSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeBanner, setActiveBanner] = useState<Notification | null>(null)

  // Load notifications
  useEffect(() => {
    async function loadNotifications() {
      if (!currentUser) return
      try {
        const data = await fetchNotifications()
        // If librarian/admin, show all notifications. If student/teacher, only show theirs.
        const userNotifs = currentUser.role === 'Librarian' || currentUser.role === 'Administrator'
          ? data
          : data.filter(n => n.user_id === currentUser.user_id)

        // Detect if there is a brand new notification that wasn't in our previous list
        if (notifications.length > 0 && data.length > notifications.length) {
          const newNotif = data[0] // Since it's sorted by date_sent desc
          // Show slide-down notification banner
          if (currentUser.role === 'Librarian' || currentUser.role === 'Administrator' || newNotif.user_id === currentUser.user_id) {
            setActiveBanner(newNotif)
            setUnreadCount(prev => prev + 1)
            // Auto hide banner after 5 seconds
            setTimeout(() => {
              setActiveBanner(null);
            }, 5000)
          }
        }
        setNotifications(userNotifs)
      } catch (err) {
        console.error("Error loading notifications in simulator:", err)
      }
    }
    loadNotifications()
    // Poll every 5 seconds to get updates for SMS simulation
    const interval = setInterval(loadNotifications, 5000)
    return () => clearInterval(interval)
  }, [currentUser, triggerRefreshSignal])

  // Count unread whenever notifications list updates and phone is closed
  useEffect(() => {
    if (!isOpen && notifications.length > 0) {
      // Simple mock unread: count items created in the last 15 minutes
      const now = Date.now()
      const recent = notifications.filter(n => (now - new Date(n.date_sent).getTime()) < 15 * 60000).length
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadCount(recent)
    } else if (isOpen) {
      setUnreadCount(0)
    }
  }, [notifications, isOpen])

  if (!currentUser) return null

  return (
    <>
      {/* Dynamic Slide-down SMS Toast Banner */}
      {activeBanner && (
        <div className="sms-banner-alert" onClick={() => { setIsOpen(true); setActiveBanner(null); }}>
          <div className="sms-banner-icon">
            <Smartphone size={20} />
          </div>
          <div className="sms-banner-content">
            <div className="sms-banner-title">
              <span>Message • {activeBanner.users?.name || 'User'}</span>
              <small>now</small>
            </div>
            <p className="sms-banner-text">{activeBanner.message}</p>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        className={`sms-floating-trigger ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Open MPCI SMS Gateway Simulator"
      >
        <Smartphone size={24} />
        {unreadCount > 0 && <span className="sms-badge">{unreadCount}</span>}
        <span className="sms-trigger-label">SMS Simulator</span>
      </button>

      {/* Phone Window */}
      {isOpen && (
        <div className="phone-mockup-wrapper">
          <div className="phone-device">
            {/* Phone Notch & Status Bar */}
            <div className="phone-header">
              <div className="phone-notch"></div>
              <div className="phone-status">
                <span>9:41</span>
                <div className="phone-signals">
                  <span>5G</span>
                  <div className="battery-icon"></div>
                </div>
              </div>
            </div>

            {/* App Header */}
            <div className="phone-app-bar">
              <button className="phone-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
              <div className="phone-contact-info">
                <strong>MPCI_Library</strong>
                <span>SMS Notification Gateway</span>
              </div>
              <div className="phone-icon-placeholder">
                <Bell size={16} />
              </div>
            </div>

            {/* Messages Screen */}
            <div className="phone-messages-screen">
              {notifications.length === 0 ? (
                <div className="phone-empty-state">
                  <ShieldAlert size={36} />
                  <p>No SMS messages in queue.</p>
                  <small>Borrow a book or trigger an alert to see SMS notifications here.</small>
                </div>
              ) : (
                <div className="phone-chat-history">
                  <div className="chat-date-separator">TODAY</div>
                  
                  {/* Map reverse to show oldest first at top, newest at bottom */}
                  {[...notifications].reverse().map((notif) => {
                    const isSelf = currentUser.role === 'Librarian' || currentUser.role === 'Administrator' 
                      ? false 
                      : notif.user_id === currentUser.user_id

                    return (
                      <div key={notif.notification_id} className={`sms-bubble-wrapper ${isSelf ? 'incoming' : 'outgoing'}`}>
                        {currentUser.role === 'Librarian' && (
                          <span className="sms-recipient-label">
                            To: {notif.users?.name || 'Unknown'} ({notif.phone_number})
                          </span>
                        )}
                        <div className="sms-bubble">
                          <p>{notif.message}</p>
                          <span className="sms-time">
                            {new Date(notif.date_sent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <CheckCheck size={12} className="check-double" />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>


            {/* Read-Only Status Strip */}
            <div className="phone-readonly-strip">
              <span className="phone-readonly-dot"></span>
              <span>MPCI Library Gateway — Notifications Only</span>
            </div>
            
            {/* Home Indicator */}
            <div className="phone-home-indicator" onClick={() => setIsOpen(false)}></div>
          </div>
        </div>
      )}
    </>
  )
}
