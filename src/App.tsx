import { useState, useEffect, useMemo } from 'react'
import { Login } from './components/Login'
import { SMSPhoneSimulator } from './components/SMSPhoneSimulator'
import { EbookReader } from './components/EbookReader'
import { QRManager } from './components/QRManager'
import type { User, Book, Transaction } from './lib/supabase'
import './App.css'
import {
  fetchBooks,
  addBook,
  deleteBook,
  fetchTransactions,
  createTransaction,
  approveTransaction,
  returnBookTransaction,
  queueNotification,
  isUsingMock
} from './lib/supabase'

import {
  BookOpen,
  Clock,
  CheckCircle,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  FileText,
  QrCode,
  LogOut,
  Smartphone,
  BookMarked,
  Sparkles,
  Info,
  UserCheck,
  X,
  Compass,
  ShoppingBag
} from 'lucide-react'

type View = 'overview' | 'catalog' | 'ai' | 'analytics' | 'reports' | 'qr' | 'storefront'

export default function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [view, setView] = useState<View>('storefront')
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Database Data States
  const [books, setBooks] = useState<Book[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  // Interaction/Simulations States
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [ebookToRead, setEbookToRead] = useState<Book | null>(null)
  
  // Librarian Modals
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)
  const [newBookTitle, setNewBookTitle] = useState('')
  const [newBookAuthor, setNewBookAuthor] = useState('')
  const [newBookIsbn, setNewBookIsbn] = useState('')
  const [newBookCategory, setNewBookCategory] = useState('Information Technology')
  const [newBookRelevance, setNewBookRelevance] = useState('BSIT')
  const [newBookStatus, setNewBookStatus] = useState<'Available' | 'E-book'>('Available')
  const [newBookContent, setNewBookContent] = useState('')

  // Load all books & transactions from Supabase
  const loadDatabaseData = async () => {
    try {
      const booksData = await fetchBooks()
      setBooks(booksData)
      const txsData = await fetchTransactions()
      setTransactions(txsData)
    } catch (err) {
      console.error('Error loading library database:', err)
    }
  }

  // Load data immediately on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDatabaseData()
  }, [])

  // Handle Log Out
  const handleLogout = () => {
    setCurrentUser(null)
    setView('storefront')
  }

  // -------------------------------------------------------------
  // SMS REMINDER SENDER HELPER
  // -------------------------------------------------------------
  const sendSMS = async (userId: number, phone: string, message: string, type: 'Due' | 'Overdue' | 'Transaction') => {
    await queueNotification(userId, phone, message, type)
    setRefreshSignal((prev) => prev + 1) // Wake up SMS simulator instantly
  }

  // -------------------------------------------------------------
  // LIBRARIAN ACTIONS
  // -------------------------------------------------------------
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBookTitle || !newBookAuthor || !newBookIsbn) return

    const added = await addBook({
      title: newBookTitle,
      author: newBookAuthor,
      isbn: newBookIsbn,
      category: newBookCategory,
      program_strand_relevance: newBookRelevance,
      status: newBookStatus,
      ebook_url: newBookStatus === 'E-book' ? 'https://example.com/books/' + newBookIsbn : null,
      content: newBookStatus === 'E-book' ? newBookContent : null
    })

    if (added) {
      setIsAddBookOpen(false)
      // Reset Form
      setNewBookTitle('')
      setNewBookAuthor('')
      setNewBookIsbn('')
      setNewBookContent('')
      loadDatabaseData()
    } else {
      alert('Failed to add book. Check if ISBN is unique.')
    }
  }

  const handleDeleteBook = async (book_id: number) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      const deleted = await deleteBook(book_id)
      if (deleted) {
        loadDatabaseData()
      } else {
        alert('Could not delete book.')
      }
    }
  }

  const handleApproveBorrow = async (tx: Transaction) => {
    const approved = await approveTransaction(tx.transaction_id)
    if (approved) {
      if (tx.users?.phone_number) {
        const msg = `MPCI Library: Your request to borrow "${tx.books?.title}" has been approved! Return due date is ${tx.due_date}.`
        await sendSMS(tx.user_id, tx.users.phone_number, msg, 'Transaction')
      }
      loadDatabaseData()
    }
  }

  const handleReturnBook = async (tx: Transaction) => {
    const returned = await returnBookTransaction(tx.transaction_id, tx.book_id)
    if (returned) {
      if (tx.users?.phone_number) {
        const msg = `MPCI Library: Thank you! "${tx.books?.title}" was successfully returned on ${new Date().toLocaleDateString()}. No penalties incurred.`
        await sendSMS(tx.user_id, tx.users.phone_number, msg, 'Transaction')
      }
      loadDatabaseData()
    }
  }

  const handleTriggerOverdueSMS = async (tx: Transaction) => {
    if (tx.users?.phone_number) {
      const msg = `MPCI Library WARNING: "${tx.books?.title}" is OVERDUE since ${tx.due_date}. Please return it immediately to avoid student record holds.`
      await sendSMS(tx.user_id, tx.users.phone_number, msg, 'Overdue')
      alert(`Overdue warning SMS queued for ${tx.users.name}`)
    }
  }

  // -------------------------------------------------------------
  // STUDENT ACTIONS
  // -------------------------------------------------------------
  const handleRequestBorrow = async (book: Book) => {
    if (!currentUser) {
      setShowLoginModal(true)
      return
    }

    if (book.status !== 'Available') {
      alert('This book is currently unavailable. Try E-books or see recommendations.')
      return
    }

    const tx = await createTransaction(currentUser.user_id, book.book_id)
    if (tx) {
      if (currentUser.phone_number) {
        const msg = `MPCI Library: Your request to borrow "${book.title}" is received. Please go to the library counter for physical releasing.`
        await sendSMS(currentUser.user_id, currentUser.phone_number, msg, 'Transaction')
      }
      alert('Borrow request submitted! Awaiting Librarian approval.')
      loadDatabaseData()
    }
  }

  const handleBorrowOnline = (book: Book) => {
    if (!currentUser) {
      setShowLoginModal(true)
      return
    }

    if (book.status !== 'E-book') {
      alert('This title does not have an online e-book copy yet. Try borrowing the physical copy.')
      return
    }

    setEbookToRead(book)
  }

  // -------------------------------------------------------------
  // AI RECOMMENDATION LOGIC ENGINE
  // -------------------------------------------------------------
  const aiRecommendations = useMemo(() => {
    if (!currentUser || books.length === 0) return []

    const userProgram = currentUser.program_strand || 'BSIT'
    const strandMatched = books.filter(
      (b) => b.program_strand_relevance?.toLowerCase() === userProgram.toLowerCase()
    )

    const categoryPopularity: Record<string, number> = {}
    transactions.forEach(t => {
      if (t.books) {
        categoryPopularity[t.books.category] = (categoryPopularity[t.books.category] || 0) + 1
      }
    })

    const recs: Array<{ book: Book; reason: string; type: 'Program Strand Match' | 'Collaborative Match' }> = []

    strandMatched.forEach(b => {
      recs.push({
        book: b,
        reason: `Highly relevant for ${userProgram} students studying ${b.category}.`,
        type: 'Program Strand Match'
      })
    })

    books.forEach(b => {
      if (categoryPopularity[b.category] && !recs.some(r => r.book.book_id === b.book_id)) {
        recs.push({
          book: b,
          reason: `Popular subject: ${categoryPopularity[b.category]} students borrowed ${b.category} titles recently.`,
          type: 'Collaborative Match'
        })
      }
    })

    return recs.slice(0, 3)
  }, [books, transactions, currentUser])

  // -------------------------------------------------------------
  // CATEGORIES COMPILATION
  // -------------------------------------------------------------
  const categoriesList = useMemo(() => {
    const categories = new Set(books.map(b => b.category))
    return ['All', ...Array.from(categories)]
  }, [books])

  // -------------------------------------------------------------
  // SEARCH & CATEGORY FILTERING (Combined)
  // -------------------------------------------------------------
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchSearch = 
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()) ||
        book.category.toLowerCase().includes(query.toLowerCase()) ||
        (book.program_strand_relevance && book.program_strand_relevance.toLowerCase().includes(query.toLowerCase()))
      
      const matchCategory = selectedCategory === 'All' || book.category === selectedCategory
      
      return matchSearch && matchCategory
    })
  }, [books, query, selectedCategory])

  // Get cover graphic class based on index
  const getCoverClass = (index: number) => {
    const gradients = [
      'cover-gradient-1',
      'cover-gradient-2',
      'cover-gradient-3',
      'cover-gradient-4',
      'cover-gradient-5',
      'cover-gradient-6'
    ]
    return gradients[index % gradients.length]
  }

  // -------------------------------------------------------------
  // ANALYTICS DATA COMPUTATIONS
  // -------------------------------------------------------------
  const analyticsData = useMemo(() => {
    const strandBorrows: Record<string, number> = { BSIT: 0, BSA: 0, BSBA: 0, BSED: 0, SHS: 0 }
    let totalBorrows = 0
    let overdueCount = 0
    let physicalBorrowed = 0
    let ebookReads = 0

    transactions.forEach((t) => {
      totalBorrows++
      if (t.status === 'Overdue') overdueCount++
      if (t.status === 'Borrowed') physicalBorrowed++

      const strand = t.users?.program_strand || ''
      if (strand.toUpperCase().includes('BSIT')) strandBorrows.BSIT++
      else if (strand.toUpperCase().includes('BSA')) strandBorrows.BSA++
      else if (strand.toUpperCase().includes('BSBA')) strandBorrows.BSBA++
      else if (strand.toUpperCase().includes('BSED')) strandBorrows.BSED++
      else if (strand.toUpperCase().includes('GRADE')) strandBorrows.SHS++
    })

    books.forEach(b => {
      if (b.status === 'E-book') ebookReads += 12
    })

    return {
      strandBorrows,
      totalBorrows,
      overdueCount,
      physicalBorrowed,
      ebookReads,
      totalBooks: books.length
    }
  }, [books, transactions])

  // -------------------------------------------------------------
  // EXPORTABLE REPORTS (CSV Generator)
  // -------------------------------------------------------------
  const handleExportCSV = (reportType: 'books' | 'transactions' | 'users') => {
    let headers: string[] = []
    let rows: string[][] = []
    const filename = `MPCI_Library_${reportType}_Report.csv`

    if (reportType === 'books') {
      headers = ['Book ID', 'Title', 'Author', 'ISBN', 'Category', 'Relevance', 'Status']
      rows = books.map(b => [
        b.book_id.toString(),
        b.title,
        b.author,
        b.isbn,
        b.category,
        b.program_strand_relevance || 'General',
        b.status
      ])
    } else if (reportType === 'transactions') {
      headers = ['Transaction ID', 'Student', 'Book Title', 'Borrow Date', 'Due Date', 'Return Date', 'Status']
      rows = transactions.map(t => [
        t.transaction_id.toString(),
        t.users?.name || 'Unknown',
        t.books?.title || 'Unknown',
        t.borrow_date,
        t.due_date,
        t.return_date || 'N/A',
        t.status
      ])
    } else if (reportType === 'users') {
      headers = ['User ID', 'Name', 'Username', 'Role', 'Strand/Department', 'Level', 'Phone Number']
      rows = transactions
        .map(t => t.users)
        .filter((u, index, self) => u && self.findIndex(s => s?.username === u?.username) === index)
        .map(u => [
          u?.username || '',
          u?.name || '',
          u?.username || '',
          'Student/Teacher',
          u?.program_strand || 'General',
          u?.academic_level || 'N/A',
          u?.phone_number || ''
        ])
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // =============================================================
  // RENDER PUBLIC E-COMMERCE STOREFRONT (Guest View or Browsing View)
  // =============================================================
  if (view === 'storefront' || !currentUser) {
    return (
      <div className="public-storefront">
        
        {/* PUBLIC STORE HEADER */}
        <header className="store-header">
          <div className="store-brand">
            <img src="/librasmart-logo-1024.png" alt="MPCI Logo" />
            <h2>LibraSmart</h2>
          </div>

          <nav className="public-nav" aria-label="Public pages">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#catalog">Catalog</a>
          </nav>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className={`connection-pill ${isUsingMock() ? 'mock' : ''}`} style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
              <div className="connection-pulse"></div>
              <span>{isUsingMock() ? 'Offline Mode' : 'Online'}</span>
            </div>

            {currentUser ? (
              <button className="btn-primary" onClick={() => setView('overview')}>
                <Compass size={16} /> My Dashboard
              </button>
            ) : (
              <button className="btn-primary" onClick={() => setShowLoginModal(true)}>
                <UserCheck size={16} /> Login
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE AREA FOR STORE */}
        <div style={{ padding: '30px clamp(15px, 4vw, 50px)' }}>
          <div className="storefront-wrapper">
            
            <section className="store-hero" id="home">
              <p className="eyebrow">Matalam Polytechnic College Inc. Library</p>
              <h1>Smarter library access for students, teachers, and librarians.</h1>
              <p>
                LibraSmart modernizes MPCI library operations with online catalog search,
                e-book reading, AI-based book recommendations, QR entry and exit tracking,
                SMS notifications, and real-time analytics.
              </p>

              <div className="store-hero-actions">
                <a className="btn-primary" href="#catalog">Browse catalog</a>
                <button className="btn-secondary" onClick={() => setShowLoginModal(true)}>
                  Login
                </button>
              </div>

              <div className="public-stats" aria-label="LibraSmart highlights">
                <div>
                  <strong>AI</strong>
                  <span>Personal book recommendations</span>
                </div>
                <div>
                  <strong>QR</strong>
                  <span>Library entry and exit records</span>
                </div>
                <div>
                  <strong>SMS</strong>
                  <span>Borrowing and overdue alerts</span>
                </div>
                <div>
                  <strong>PDF</strong>
                  <span>Downloadable library reports</span>
                </div>
              </div>
              
              <div className="public-hero-preview" aria-label="LibraSmart preview">
                <img src="/librasmart-logo-1024.png" alt="LibraSmart logo" />
                <div>
                  <span>Today</span>
                  <strong>47 active transactions</strong>
                  <small>Catalog, SMS, QR gate, and analytics synced</small>
                </div>
              </div>
            </section>

            <section className="public-section public-split" id="about">
              <div>
                <p className="eyebrow">About the system</p>
                <h2>Built from the library problems identified in the study.</h2>
              </div>
              <p>
                The system addresses manual logbooks, shelf-by-shelf book searching,
                slow borrowing records, difficult overdue tracking, and limited
                visibility into borrowing trends. It gives MPCI a single web-based
                workspace for students, teachers, librarians, and administrators.
              </p>
            </section>

            <section className="public-section" id="features">
              <div className="public-section-heading">
                <p className="eyebrow">Core features</p>
                <h2>Everything the library desk needs, without the clutter.</h2>
              </div>

              <div className="public-feature-grid">
                <article>
                  <BookOpen size={20} />
                  <h3>Book Catalog Management</h3>
                  <p>Add, update, search, and monitor physical and digital books by title, author, ISBN, category, and program relevance.</p>
                </article>
                <article>
                  <Sparkles size={20} />
                  <h3>AI Recommendations</h3>
                  <p>Suggest learning materials based on academic strand, level, borrowing history, and similar student activity.</p>
                </article>
                <article>
                  <BookMarked size={20} />
                  <h3>E-book Reading</h3>
                  <p>Let users access selected learning materials online while still supporting physical book release at the library counter.</p>
                </article>
                <article>
                  <Smartphone size={20} />
                  <h3>SMS Notifications</h3>
                  <p>Send transaction confirmations, due date reminders, and overdue notices directly to the borrower.</p>
                </article>
                <article>
                  <QrCode size={20} />
                  <h3>QR Entry and Exit</h3>
                  <p>Replace manual gate logs with scannable user passes for faster visit monitoring.</p>
                </article>
                <article>
                  <TrendingUp size={20} />
                  <h3>Analytics and Reports</h3>
                  <p>Track high-demand books, borrowing trends, user activity, and export reports for documentation.</p>
                </article>
              </div>
            </section>

            <section className="public-section">
              <div className="public-section-heading">
                <p className="eyebrow">How it works</p>
                <h2>Simple flow from discovery to report generation.</h2>
              </div>

              <div className="public-steps">
                <div>
                  <span>01</span>
                  <strong>Search or scan</strong>
                  <p>Students find books online, while QR passes record library entry and exit.</p>
                </div>
                <div>
                  <span>02</span>
                  <strong>Borrow or read</strong>
                  <p>Physical books are requested online and released on site; e-books open immediately.</p>
                </div>
                <div>
                  <span>03</span>
                  <strong>Notify and analyze</strong>
                  <p>SMS alerts, transaction history, analytics, and reports keep operations transparent.</p>
                </div>
              </div>
            </section>

            <section className="store-grid-section" id="catalog">
              <div className="catalog-heading-row">
                <div>
                  <p className="eyebrow">Library catalog</p>
                  <h3>Browse available books and e-books</h3>
                </div>
              </div>

              <div className="store-search-bar">
                <Search size={20} />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, author, course code, strand..." 
                />
              </div>

              {/* Tag filters pill */}
              <div className="filter-tags-row">
                {categoriesList.map(category => (
                  <button 
                    key={category} 
                    className={`tag-pill ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {/* AI PUBLIC CORNER (When logged in) */}
            {currentUser && (
              <section className="store-grid-section">
                <h3>Recommended For You (AI-Matching)</h3>
                <div className="ai-recommendations-list" style={{ marginBottom: '30px' }}>
                  {aiRecommendations.map(({ book, reason, type }) => (
                    <div key={book.book_id} className="ai-rec-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                      <span className="ai-badge-header">{type}</span>
                      <h4 style={{ fontSize: '0.98rem' }}>{book.title}</h4>
                      <span className="author" style={{ fontSize: '0.78rem' }}>By {book.author}</span>
                      <p style={{ fontSize: '0.78rem', margin: '8px 0', color: 'var(--color-text-muted)' }}>{reason}</p>
                      <div className="book-action-grid">
                        <button
                          className="btn-primary"
                          onClick={() => handleBorrowOnline(book)}
                          disabled={book.status !== 'E-book'}
                        >
                          Borrow Online
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleRequestBorrow(book)}
                          disabled={book.status !== 'Available'}
                        >
                          Borrow Physical
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* MAIN E-COMMERCE PRODUCTS GRID */}
            <section className="store-grid-section">
              <h3>Catalog results ({filteredBooks.length})</h3>
              
              <div className="store-grid">
                {filteredBooks.length === 0 ? (
                  <p className="empty-msg" style={{ gridColumn: 'span 4' }}>
                    No matching books found. Try searching for "design", "IT", or "CCNA".
                  </p>
                ) : (
                  filteredBooks.map((book, index) => (
                    <div key={book.book_id} className="book-store-card">
                      {/* CSS gradient book cover */}
                      <div className={`book-cover-stage ${getCoverClass(index)}`}>
                        <span className="cover-title">{book.title}</span>
                        <span className="cover-author">{book.author}</span>
                      </div>

                      {/* Info layout */}
                      <div className="book-store-info">
                        <span className="book-category-tag">{book.category}</span>
                        <h4>{book.title}</h4>
                        <span className="book-author">By {book.author}</span>
                        
                        {/* Status elements */}
                        <div className="book-status-row">
                          <span className={`badge ${
                            book.status === 'Available' 
                              ? 'badge-success' 
                              : book.status === 'E-book' 
                              ? 'badge-info' 
                              : 'badge-warning'
                          }`}>
                            {book.status}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-text-muted)' }}>
                            ISBN: {book.isbn}
                          </span>
                        </div>

                        <div className="book-action-grid">
                          <button
                            className="btn-primary"
                            onClick={() => handleBorrowOnline(book)}
                            disabled={book.status !== 'E-book'}
                          >
                            Borrow Online
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => handleRequestBorrow(book)}
                            disabled={book.status !== 'Available'}
                          >
                            Borrow Physical
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        </div>

        {/* MODAL USER AUTH OVERLAY */}
        {showLoginModal && (
          <div className="modal-login-overlay">
            <div className="modal-login-card">
              <button className="modal-login-close" onClick={() => setShowLoginModal(false)}>
                <X size={18} />
              </button>
              <Login onLoginSuccess={(user) => {
                setCurrentUser(user)
                setShowLoginModal(false)
                setView('overview')
              }} />
            </div>
          </div>
        )}

        {/* DIGITIZED E-BOOK READER OVERLAY SCREEN */}
        {ebookToRead && (
          <EbookReader book={ebookToRead} onClose={() => setEbookToRead(null)} />
        )}

        {/* PERSISTENT MOBILE SMS DISPLAY GATEWAY SIMULATOR */}
        <SMSPhoneSimulator currentUser={currentUser} triggerRefreshSignal={refreshSignal} />
      </div>
    )
  }

  // =============================================================
  // RENDER AUTHENTICATED USER DESK (Sidebar + Workspace Dashboard)
  // =============================================================
  return (
    <main className="app-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar" aria-label="LibraSmart Navigation">
        <a className="brand" href="#top">
          <img src="/librasmart-logo-1024.png" alt="MPCI Logo" />
          <span>LibraSmart</span>
        </a>

        <nav>
          <button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}>
            <BookMarked size={18} /> Overview
          </button>
          
          {/* Link back to store view */}
          <button className={(view as string) === 'storefront' ? 'active' : ''} onClick={() => setView('storefront')}>
            <ShoppingBag size={18} /> Book Storefront
          </button>

          <button className={view === 'catalog' ? 'active' : ''} onClick={() => setView('catalog')}>
            <BookOpen size={18} /> Book Catalog
          </button>
          
          {currentUser.role !== 'Librarian' && currentUser.role !== 'Administrator' && (
            <button className={view === 'ai' ? 'active' : ''} onClick={() => setView('ai')}>
              <Sparkles size={18} /> AI Recommendations
            </button>
          )}
          <button className={view === 'qr' ? 'active' : ''} onClick={() => setView('qr')}>
            <QrCode size={18} /> QR Gate Pass
          </button>
          <button className={view === 'analytics' ? 'active' : ''} onClick={() => setView('analytics')}>
            <TrendingUp size={18} /> Analytics
          </button>
          <button className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}>
            <FileText size={18} /> Reports
          </button>
        </nav>

        {/* LOGGED IN USER PROFILE FOOTER */}
        <div className="side-profile">
          <div className="profile-card">
            <div className="profile-avatar">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details">
              <span className="profile-name">{currentUser.name}</span>
              <span className="profile-role">{currentUser.role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE */}
      <section className="workspace" id="top">
        
        {/* TOPBAR BANNER */}
        <header className="topbar">
          <div className="topbar-info">
            <p className="eyebrow">Matalam Polytechnic College Inc.</p>
            <h1>Library Management Desk</h1>
            <p className="subtitle">AI recommendations, E-Books, SMS alerts, and live entry logs</p>
          </div>
          
          <div className={`connection-pill ${isUsingMock() ? 'mock' : ''}`}>
            <div className="connection-pulse"></div>
            <span>
              {isUsingMock() ? 'Database Offline (LocalStorage)' : 'Database Connected'}
            </span>
          </div>
        </header>

        {/* VIEW OVERVIEW (DASHBOARD) */}
        {view === 'overview' && (
          <>
            <section className="hero-panel">
              <div className="hero-copy">
                <h2>Welcome back, {currentUser.name}!</h2>
                <p>
                  Explore MPCI's unified library operations. Search the shelf catalogue, open digital E-books instantly, check active book loan transactions, and display your entry/exit QR gate pass.
                </p>
                <div className="hero-actions">
                  <button className="btn-primary" onClick={() => setView('storefront')}>
                    Go to Book Storefront
                  </button>
                  <button className="btn-secondary" onClick={() => setView('qr')}>
                    Get QR Entry Code
                  </button>
                </div>
              </div>
              <div className="logo-stage">
                <img src="/librasmart-logo-1024.png" alt="LibraSmart Branding" />
                <div className="scan-card">
                  <Smartphone size={16} className="text-teal" />
                  <span>SMS Portal Active</span>
                </div>
              </div>
            </section>

            {/* DASHBOARD METRICS */}
            <section className="metrics">
              <div className="metric-card">
                <div className="metric-icon-box">
                  <BookOpen size={24} />
                </div>
                <div className="metric-info">
                  <h3>{analyticsData.totalBooks}</h3>
                  <span>Catalogued Books</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon-box">
                  <Clock size={24} />
                </div>
                <div className="metric-info">
                  <h3>{analyticsData.physicalBorrowed}</h3>
                  <span>Active Borrows</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box">
                  <Info size={24} />
                </div>
                <div className="metric-info">
                  <h3>{analyticsData.overdueCount}</h3>
                  <span>Overdue Items</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box">
                  <CheckCircle size={24} />
                </div>
                <div className="metric-info">
                  <h3>{analyticsData.ebookReads}</h3>
                  <span>Digital E-Book Access</span>
                </div>
              </div>
            </section>

            {/* DASHBOARD CONTENT GRID */}
            <div className="dashboard-grid">
              
              {/* Left Column: List active transactions / student borrows */}
              <div className="panel-card">
                <div className="panel-card-header">
                  <div className="panel-title">
                    <Clock size={20} />
                    <h3>
                      {currentUser.role === 'Librarian' || currentUser.role === 'Administrator' 
                        ? 'Active Borrow & Return Desk' 
                        : 'My Borrow Transactions'}
                    </h3>
                  </div>
                </div>

                <div className="activity-list">
                  {transactions.length === 0 ? (
                    <p className="empty-msg">No active borrows or pending release requests.</p>
                  ) : (
                    transactions.map((tx) => {
                      if (currentUser.role !== 'Librarian' && currentUser.role !== 'Administrator' && tx.user_id !== currentUser.user_id) {
                        return null
                      }

                      return (
                        <div 
                          key={tx.transaction_id} 
                          className={`activity-row-new ${tx.status === 'Returned' ? 'return' : tx.status === 'Overdue' ? 'overdue' : ''}`}
                        >
                          <div className="activity-icon-container">
                            <BookOpen size={16} />
                          </div>
                          
                          <div className="activity-detail-block">
                            <strong>{tx.books?.title}</strong>
                            <span>
                              {currentUser.role === 'Librarian' || currentUser.role === 'Administrator'
                                ? `Borrower: ${tx.users?.name || 'Unknown Student'}`
                                : `Author: ${tx.books?.author}`}
                            </span>
                            <span>Due Date: {tx.due_date} {tx.status === 'Overdue' && ' (OVERDUE)'}</span>
                          </div>

                          <div className="activity-action-pane" style={{ display: 'flex', gap: '8px' }}>
                            <span className={`badge ${
                              tx.status === 'Returned' 
                                ? 'badge-success' 
                                : tx.status === 'Overdue' 
                                ? 'badge-danger' 
                                : tx.status === 'Requested'
                                ? 'badge-warning'
                                : 'badge-info'
                            }`}>
                              {tx.status}
                            </span>
                            
                            {(currentUser.role === 'Librarian' || currentUser.role === 'Administrator') && (
                              <>
                                {tx.status === 'Requested' && (
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    onClick={() => handleApproveBorrow(tx)}
                                  >
                                    Approve Release
                                  </button>
                                )}
                                {tx.status === 'Borrowed' && (
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#10b981' }}
                                    onClick={() => handleReturnBook(tx)}
                                  >
                                    Mark Returned
                                  </button>
                                )}
                                {tx.status === 'Overdue' && (
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ef4444' }}
                                    onClick={() => handleTriggerOverdueSMS(tx)}
                                    title="Resend Overdue warning SMS"
                                  >
                                    Send SMS Alert
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Disaster Recovery Overview */}
              <div className="panel-card">
                <div className="panel-card-header">
                  <div className="panel-title">
                    <CheckCircle size={20} />
                    <h3>Disaster Recovery Plan (DRP)</h3>
                  </div>
                </div>
                
                <div className="recovery-panel">
                  <div className="recovery-row-new">
                    <strong>Technical Failure</strong>
                    <span>Power backups (UPS), Cloud hosting replication, offline local database fallback capability.</span>
                  </div>
                  <div className="recovery-row-new" style={{ borderLeftColor: '#0f7581' }}>
                    <strong>Network Outage</strong>
                    <span>Hybrid offline local logging. Sync entry/exit attendance to Supabase when connection restores.</span>
                  </div>
                  <div className="recovery-row-new" style={{ borderLeftColor: '#102131' }}>
                    <strong>Data Integrity</strong>
                    <span>Automated daily backups, schema logs, locked row policies, and strict operator-role permissions.</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW CATALOG (SHELF AND E-BOOKS LIST) */}
        {view === 'catalog' && (
          <div className="panel-card">
            <div className="panel-card-header">
              <div className="panel-title">
                <BookOpen size={20} />
                <h3>Shelf Book Catalogue Management</h3>
              </div>
              
              {(currentUser.role === 'Librarian' || currentUser.role === 'Administrator') && (
                <button className="btn-primary" onClick={() => setIsAddBookOpen(true)}>
                  <Plus size={16} /> Add Book Record
                </button>
              )}
            </div>

            <div className="table-toolbar">
              <div className="search-box-wrapper">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Search books by title, author, category, or strand..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN Code</th>
                    <th>Category</th>
                    <th>Academic Strand</th>
                    <th>Media Status</th>
                    <th>Shelf Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-msg">No book matches found in catalog.</td>
                    </tr>
                  ) : (
                    filteredBooks.map((book) => (
                      <tr key={book.book_id}>
                        <td style={{ fontWeight: '700' }}>{book.title}</td>
                        <td>{book.author}</td>
                        <td><code>{book.isbn}</code></td>
                        <td>{book.category}</td>
                        <td>
                          <span className="badge badge-info">{book.program_strand_relevance || 'General'}</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            book.status === 'Available' 
                              ? 'badge-success' 
                              : book.status === 'E-book' 
                              ? 'badge-info' 
                              : 'badge-warning'
                          }`}>
                            {book.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {currentUser.role !== 'Librarian' && currentUser.role !== 'Administrator' && (
                              <>
                                <button
                                  className="btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  onClick={() => handleBorrowOnline(book)}
                                  disabled={book.status !== 'E-book'}
                                >
                                  Borrow Online
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  onClick={() => handleRequestBorrow(book)}
                                  disabled={book.status !== 'Available'}
                                >
                                  Borrow Physical
                                </button>
                              </>
                            )}

                            {(currentUser.role === 'Librarian' || currentUser.role === 'Administrator') && (
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#dc2626' }}
                                onClick={() => handleDeleteBook(book.book_id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW AI RECOMMENDATIONS */}
        {view === 'ai' && (
          <div className="panel-card">
            <div className="panel-card-header">
              <div className="panel-title">
                <Sparkles size={20} />
                <h3>Personalized AI-Based Book Recommendations</h3>
              </div>
            </div>

            <div className="ai-intro-card">
              <strong>Smart Recommendation Agent Model</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                This section displays suggestions dynamically generated based on your program strand (<strong>{currentUser.program_strand || 'BSIT'}</strong>), your year level (<strong>{currentUser.academic_level || 'General'}</strong>), and matching borrows by other MPCI students.
              </p>
            </div>

            <div className="ai-recommendations-list">
              {aiRecommendations.length === 0 ? (
                <p className="empty-msg">No recommendations available. Fill out your program strand or borrow books to seed recommendations.</p>
              ) : (
                aiRecommendations.map(({ book, reason, type }) => (
                  <div key={book.book_id} className="ai-rec-card">
                    <span className="ai-badge-header">{type}</span>
                    <h4>{book.title}</h4>
                    <span className="author">By {book.author}</span>
                    <div className="explanation">
                      {reason}
                    </div>
                    
                    <div className="book-action-grid" style={{ marginTop: 'auto' }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleBorrowOnline(book)}
                        disabled={book.status !== 'E-book'}
                      >
                        Borrow Online
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => handleRequestBorrow(book)}
                        disabled={book.status !== 'Available'}
                      >
                        Borrow Physical
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW QR MANAGER PASS/SCANNER */}
        {view === 'qr' && (
          <QRManager currentUser={currentUser} onLogCreated={loadDatabaseData} />
        )}

        {/* VIEW ANALYTICS */}
        {view === 'analytics' && (
          <>
            {/* Visual Charts Container */}
            <div className="analytics-card-grid">
              
              {/* Chart 1: Bar Chart (SVG-based) */}
              <div className="panel-card">
                <div className="panel-card-header">
                  <div className="panel-title">
                    <TrendingUp size={20} />
                    <h3>Borrowing Trends by Academic Program</h3>
                  </div>
                </div>

                <div className="svg-chart-container">
                  <svg className="chart-svg" width="360" height="200" viewBox="0 0 360 200">
                    <line x1="40" y1="20" x2="340" y2="20" stroke="#f1f5f9" strokeWidth="1.5" />
                    <line x1="40" y1="70" x2="340" y2="70" stroke="#f1f5f9" strokeWidth="1.5" />
                    <line x1="40" y1="120" x2="340" y2="120" stroke="#f1f5f9" strokeWidth="1.5" />
                    <line x1="40" y1="170" x2="340" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* BSIT */}
                    <rect x="60" y={170 - analyticsData.strandBorrows.BSIT * 20} width="32" height={analyticsData.strandBorrows.BSIT * 20} fill="#0f7581" rx="4" />
                    <text x="76" y="188" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">BSIT</text>
                    <text x="76" y={160 - analyticsData.strandBorrows.BSIT * 20} fontSize="11" fontWeight="800" fill="#102131" textAnchor="middle">{analyticsData.strandBorrows.BSIT}</text>

                    {/* BSA */}
                    <rect x="120" y={170 - analyticsData.strandBorrows.BSA * 20} width="32" height={analyticsData.strandBorrows.BSA * 20} fill="#f2bd4a" rx="4" />
                    <text x="136" y="188" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">BSA</text>
                    <text x="136" y={160 - analyticsData.strandBorrows.BSA * 20} fontSize="11" fontWeight="800" fill="#102131" textAnchor="middle">{analyticsData.strandBorrows.BSA}</text>

                    {/* BSBA */}
                    <rect x="180" y={170 - analyticsData.strandBorrows.BSBA * 20} width="32" height={analyticsData.strandBorrows.BSBA * 20} fill="#102131" rx="4" />
                    <text x="196" y="188" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">BSBA</text>
                    <text x="196" y={160 - analyticsData.strandBorrows.BSBA * 20} fontSize="11" fontWeight="800" fill="#102131" textAnchor="middle">{analyticsData.strandBorrows.BSBA}</text>

                    {/* BSED */}
                    <rect x="240" y={170 - analyticsData.strandBorrows.BSED * 20} width="32" height={analyticsData.strandBorrows.BSED * 20} fill="#ef4444" rx="4" />
                    <text x="256" y="188" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">BSED</text>
                    <text x="256" y={160 - analyticsData.strandBorrows.BSED * 20} fontSize="11" fontWeight="800" fill="#102131" textAnchor="middle">{analyticsData.strandBorrows.BSED}</text>

                    {/* SHS */}
                    <rect x="300" y={170 - analyticsData.strandBorrows.SHS * 20} width="32" height={analyticsData.strandBorrows.SHS * 20} fill="#10b981" rx="4" />
                    <text x="316" y="188" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">SHS</text>
                    <text x="316" y={160 - analyticsData.strandBorrows.SHS * 20} fontSize="11" fontWeight="800" fill="#102131" textAnchor="middle">{analyticsData.strandBorrows.SHS}</text>
                  </svg>
                </div>
              </div>

              {/* Chart 2: Donut Chart */}
              <div className="panel-card">
                <div className="panel-card-header">
                  <div className="panel-title">
                    <BookMarked size={20} />
                    <h3>Media Status Distribution</h3>
                  </div>
                </div>

                <div className="svg-chart-container">
                  <svg className="chart-svg" width="240" height="200" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="70" fill="transparent" stroke="#10b981" strokeWidth="20" strokeDasharray="300 440" strokeDashoffset="0" />
                    <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f2bd4a" strokeWidth="20" strokeDasharray="100 440" strokeDashoffset="-300" />
                    <circle cx="100" cy="100" r="70" fill="transparent" stroke="#0f7581" strokeWidth="20" strokeDasharray="40 440" strokeDashoffset="-400" />
                    <circle cx="100" cy="100" r="55" fill="#ffffff" />
                    <text x="100" y="98" fontSize="20" fontWeight="900" fill="#102131" textAnchor="middle">
                      {books.length}
                    </text>
                    <text x="100" y="116" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">
                      Total Media
                    </text>
                  </svg>
                </div>

                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color-dot" style={{ backgroundColor: '#10b981' }}></div>
                    <span>Available Books</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-dot" style={{ backgroundColor: '#f2bd4a' }}></div>
                    <span>Loaned Out</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-dot" style={{ backgroundColor: '#0f7581' }}></div>
                    <span>Digital E-Books</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="panel-card">
              <div className="panel-card-header">
                <div className="panel-title">
                  <Smartphone size={20} />
                  <h3>SMS Gateway Reminders Log Status</h3>
                </div>
              </div>

              <div className="recovery-panel">
                <div className="recovery-row-new" style={{ borderLeftColor: '#0f7581' }}>
                  <strong>Transaction Updates</strong>
                  <span>Auto-sent when borrowing is approved, or return is completed. Confirms check-out codes and timestamps.</span>
                </div>
                <div className="recovery-row-new" style={{ borderLeftColor: '#f2bd4a' }}>
                  <strong>Due Warnings</strong>
                  <span>Sent 48 hours prior to transaction return deadline. Informs students of deadline dates to prevent holds.</span>
                </div>
                <div className="recovery-row-new" style={{ borderLeftColor: '#ef4444' }}>
                  <strong>Overdue Reminders</strong>
                  <span>Triggered daily on active overdue items. Includes custom warnings outlining institutional panel policies.</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW REPORTS */}
        {view === 'reports' && (
          <div className="panel-card">
            <div className="panel-card-header">
              <div className="panel-title">
                <FileText size={20} />
                <h3>Automated Report Generation Panel</h3>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Download official school logs in Excel/CSV format for administrative documentation, inventory auditing, and student activity analysis.
            </p>

            <div className="reports-grid">
              
              <div className="report-item-card">
                <div className="report-card-top">
                  <strong>Book Inventory Masterlist</strong>
                  <span>Format: CSV • System Generated</span>
                  <p>Comprehensive report outlining all books catalogued in the system, detailing author, ISBN, category, and shelf status.</p>
                </div>
                <button className="btn-primary btn-report-download" onClick={() => handleExportCSV('books')}>
                  Download Masterlist CSV
                </button>
              </div>

              <div className="report-item-card">
                <div className="report-card-top">
                  <strong>Library Loan & Transactions</strong>
                  <span>Format: CSV • Live Operations</span>
                  <p>Comprehensive transaction log listing all active borrowings, request submissions, return dates, and overdue items.</p>
                </div>
                <button className="btn-primary btn-report-download" onClick={() => handleExportCSV('transactions')}>
                  Download Transactions CSV
                </button>
              </div>

              <div className="report-item-card">
                <div className="report-card-top">
                  <strong>Active Borrowers Directory</strong>
                  <span>Format: CSV • Dynamic</span>
                  <p>Administrative log summarizing active library cards, student names, phone numbers, and academic levels.</p>
                </div>
                <button className="btn-primary btn-report-download" onClick={() => handleExportCSV('users')}>
                  Download Directory CSV
                </button>
              </div>

            </div>
          </div>
        )}

      </section>

      {/* LIBRARIAN ADD BOOK RECORD MODAL */}
      {isAddBookOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add New Book to Shelf</h3>
              <button className="btn-close-modal" onClick={() => setIsAddBookOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddBook} className="modal-form">
              <div className="form-group">
                <label htmlFor="b-title">Book Title</label>
                <input 
                  id="b-title" 
                  type="text" 
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="e.g. Applied Web Systems Design" 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="b-author">Author Name</label>
                <input 
                  id="b-author" 
                  type="text" 
                  value={newBookAuthor}
                  onChange={(e) => setNewBookAuthor(e.target.value)}
                  placeholder="e.g. A. Boranbayev" 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="b-isbn">ISBN Code Number</label>
                <input 
                  id="b-isbn" 
                  type="text" 
                  value={newBookIsbn}
                  onChange={(e) => setNewBookIsbn(e.target.value)}
                  placeholder="e.g. 978-013-482" 
                  required 
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="b-cat">Category</label>
                  <select 
                    id="b-cat" 
                    value={newBookCategory} 
                    onChange={(e) => setNewBookCategory(e.target.value)}
                  >
                    <option value="Information Technology">Information Technology</option>
                    <option value="Research">Research</option>
                    <option value="Library Science">Library Science</option>
                    <option value="Database">Database Management</option>
                    <option value="Accounting">Accounting & Finance</option>
                    <option value="Networking">Networking (CCNA)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="b-relevance">Strand Relevance</label>
                  <select 
                    id="b-relevance" 
                    value={newBookRelevance} 
                    onChange={(e) => setNewBookRelevance(e.target.value)}
                  >
                    <option value="BSIT">BSIT</option>
                    <option value="BSA">BSA</option>
                    <option value="BSBA">BSBA</option>
                    <option value="BSED">BSED</option>
                    <option value="General">General / All Strands</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="b-status">Media Access Format</label>
                <select 
                  id="b-status" 
                  value={newBookStatus} 
                  onChange={(e) => setNewBookStatus(e.target.value as 'Available' | 'E-book')}
                >
                  <option value="Available">Physical (Shelf Book)</option>
                  <option value="E-book">Digital (Online E-Book)</option>
                </select>
              </div>

              {newBookStatus === 'E-book' && (
                <div className="form-group">
                  <label htmlFor="b-content">E-Book Digital Contents (Chapters)</label>
                  <textarea 
                    id="b-content" 
                    value={newBookContent}
                    onChange={(e) => setNewBookContent(e.target.value)}
                    placeholder="Chapter 1: Principles of study...\n\nChapter 2: Structural implementations..."
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAddBookOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Book Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITIZED E-BOOK READER OVERLAY SCREEN */}
      {ebookToRead && (
        <EbookReader book={ebookToRead} onClose={() => setEbookToRead(null)} />
      )}

      {/* PERSISTENT MOBILE SMS DISPLAY GATEWAY SIMULATOR */}
      <SMSPhoneSimulator currentUser={currentUser} triggerRefreshSignal={refreshSignal} />
    </main>
  )
}
