import { useState, useEffect, useMemo, useRef } from 'react'
import { Login } from './components/Login'
import { SMSPhoneSimulator } from './components/SMSPhoneSimulator'
import { EbookReader } from './components/EbookReader'
import { QRManager } from './components/QRManager'
import type { User, Book, Transaction } from './lib/supabase'
import './App.css'
import {
  fetchBooks,
  addBook,
  updateBook,
  deleteBook,
  fetchTransactions,
  createTransaction,
  approveTransaction,
  returnBookTransaction,
  queueNotification,
  fetchAllUsers,
  registerUser,
  isUsingMock,
  uploadBookCover,
  uploadProfilePhoto,
  updateUser,
  uploadEbookFile
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
  ShoppingBag,
  Pencil,
  Camera,
  Upload,
  ImagePlus,
  AlertTriangle,
  History
} from 'lucide-react'

type View = 'overview' | 'catalog' | 'ai' | 'analytics' | 'reports' | 'qr' | 'users' | 'storefront'

type ExternalBookResult = {
  key: string
  title: string
  authors: string
  publishedDate: string
  publisher: string
  categories: string
  description: string
  coverUrl: string | null
  previewUrl: string
  infoUrl: string
  buyUrl: string | null
  accessViewStatus: string
  embeddable: boolean
}

export default function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [view, setView] = useState<View>('storefront')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [storeTab, setStoreTab] = useState<'home' | 'catalog'>('home')

  // Database Data States
  const [books, setBooks] = useState<Book[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentUsername, setNewStudentUsername] = useState('')
  const [newStudentPassword, setNewStudentPassword] = useState('')
  const [newStudentPhone, setNewStudentPhone] = useState('+639')
  const [newStudentProgramStrand, setNewStudentProgramStrand] = useState('BSIT')
  const [newStudentAcademicLevel, setNewStudentAcademicLevel] = useState('1st Year')
  const [newStudentError, setNewStudentError] = useState('')
  const [newStudentSuccess, setNewStudentSuccess] = useState('')
  const [newStudentLoading, setNewStudentLoading] = useState(false)
  const [selectedManualBorrowStudentId, setSelectedManualBorrowStudentId] = useState<number | null>(null)
  const [selectedManualBorrowBookId, setSelectedManualBorrowBookId] = useState<number | null>(null)
  const [manualBorrowDueDays, setManualBorrowDueDays] = useState(7)
  const [manualBorrowError, setManualBorrowError] = useState('')
  const [manualBorrowSuccess, setManualBorrowSuccess] = useState('')
  const [manualBorrowLoading, setManualBorrowLoading] = useState(false)
  
  // Interaction/Simulations States
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [ebookToRead, setEbookToRead] = useState<Book | null>(null)
  const [externalBookResults, setExternalBookResults] = useState<ExternalBookResult[]>([])
  const [externalSearchStatus, setExternalSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [externalSearchMessage, setExternalSearchMessage] = useState('')
  
  // Librarian Modals
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)
  const [newBookTitle, setNewBookTitle] = useState('')
  const [newBookAuthor, setNewBookAuthor] = useState('')
  const [newBookIsbn, setNewBookIsbn] = useState('')
  const [newBookCategory, setNewBookCategory] = useState('Information Technology')
  const [newBookRelevance, setNewBookRelevance] = useState('BSIT')
  const [newBookStatus, setNewBookStatus] = useState<'Available' | 'E-book'>('Available')
  const [newBookContent, setNewBookContent] = useState('')
  const [newBookCoverUrl, setNewBookCoverUrl] = useState('')   // existing URL (for edit mode)
  const [newBookCoverFile, setNewBookCoverFile] = useState<File | null>(null)  // new upload file
  const [newBookCoverPreview, setNewBookCoverPreview] = useState<string>('')   // local preview
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [newBookTotalCopies, setNewBookTotalCopies] = useState<number>(1)
  const [editingBookId, setEditingBookId] = useState<number | null>(null)

  // Profile photo upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [newBookEbookFile, setNewBookEbookFile] = useState<File | null>(null)
  const [newBookEbookUrl, setNewBookEbookUrl] = useState<string>('')
  const [isUploadingEbook, setIsUploadingEbook] = useState(false)
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const ebookFileInputRef = useRef<HTMLInputElement>(null)

  // Load all books & transactions from Supabase
  const loadDatabaseData = async () => {
    try {
      const booksData = await fetchBooks()
      setBooks(booksData)
      const txsData = await fetchTransactions()
      setTransactions(txsData)
      const usersData = await fetchAllUsers()
      setUsers(usersData)
    } catch (err) {
      console.error('Error loading library database:', err)
    }
  }

  // Load data immediately on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDatabaseData()
  }, [])

  const isStudent = currentUser?.role === 'Student'
  const studentCount = useMemo(() => users.filter((u) => u.role === 'Student').length, [users])

  useEffect(() => {
    if (isStudent && (view === 'analytics' || view === 'reports' || view === 'users')) {
      setView('overview')
    }
  }, [isStudent, view])

  // Handle Log Out
  const handleLogout = () => {
    setCurrentUser(null)
    setView('storefront')
    setStoreTab('home')
  }

  const resetNewStudentForm = () => {
    setNewStudentName('')
    setNewStudentUsername('')
    setNewStudentPassword('')
    setNewStudentPhone('+639')
    setNewStudentProgramStrand('BSIT')
    setNewStudentAcademicLevel('1st Year')
    setNewStudentError('')
    setNewStudentSuccess('')
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewStudentError('')
    setNewStudentSuccess('')
    setNewStudentLoading(true)

    if (!newStudentName || !newStudentUsername || !newStudentPassword || !newStudentPhone) {
      setNewStudentError('Please fill in all required student fields.')
      setNewStudentLoading(false)
      return
    }

    let formattedPhone = newStudentPhone.trim()
    if (formattedPhone.startsWith('09')) {
      formattedPhone = '+63' + formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+63' + formattedPhone
    }

    try {
      const student = await registerUser({
        name: newStudentName.trim(),
        username: newStudentUsername.toLowerCase().trim(),
        password: newStudentPassword,
        role: 'Student',
        program_strand: newStudentProgramStrand,
        academic_level: newStudentAcademicLevel,
        phone_number: formattedPhone
      })

      if (!student) {
        setNewStudentError('Unable to create student. Try another username.')
      } else {
        setUsers((prev) => [...prev, student])
        setNewStudentSuccess('Student record created successfully.')
        resetNewStudentForm()
      }
    } catch (err) {
      console.error(err)
      setNewStudentError('Unable to create student record. Please try again.')
    } finally {
      setNewStudentLoading(false)
    }
  }

  const handleManualLendBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setManualBorrowError('')
    setManualBorrowSuccess('')
    setManualBorrowLoading(true)

    const book = books.find((b) => b.book_id === selectedManualBorrowBookId)
    const student = users.find((u) => u.user_id === selectedManualBorrowStudentId)

    if (!student || !book) {
      setManualBorrowError('Please select a student and a book to proceed.')
      setManualBorrowLoading(false)
      return
    }

    if (book.status !== 'Available' || (book.available_copies ?? 0) <= 0) {
      setManualBorrowError('The selected book is not currently available for physical lending.')
      setManualBorrowLoading(false)
      return
    }

    const tx = await createTransaction(student.user_id, book.book_id, 'Borrowed', manualBorrowDueDays)
    if (tx) {
      setManualBorrowSuccess(`Issued “${book.title}” to ${student.name}. Due ${tx.due_date}.`)
      setSelectedManualBorrowBookId(null)
      setSelectedManualBorrowStudentId(null)
      setManualBorrowDueDays(7)
      loadDatabaseData()

      if (student.phone_number) {
        const msg = `MPCI Library: "${book.title}" has been issued to you. Return due date is ${tx.due_date}.`
        await sendSMS(student.user_id, student.phone_number, msg, 'Transaction')
      }
    } else {
      setManualBorrowError('Unable to issue the selected book. Please try again.')
    }

    setManualBorrowLoading(false)
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
  const resetBookForm = () => {
    setEditingBookId(null)
    setNewBookTitle('')
    setNewBookAuthor('')
    setNewBookIsbn('')
    setNewBookCategory('Information Technology')
    setNewBookRelevance('BSIT')
    setNewBookStatus('Available')
    setNewBookContent('')
    setNewBookCoverUrl('')
    setNewBookCoverFile(null)
    setNewBookCoverPreview('')
    setNewBookTotalCopies(1)
    setNewBookEbookFile(null)
    setNewBookEbookUrl('')
    if (coverFileInputRef.current) coverFileInputRef.current.value = ''
    if (ebookFileInputRef.current) ebookFileInputRef.current.value = ''
  }

  const handleOpenAddBook = () => {
    resetBookForm()
    setIsAddBookOpen(true)
  }

  const handleOpenEditBook = (book: Book) => {
    setEditingBookId(book.book_id)
    setNewBookTitle(book.title)
    setNewBookAuthor(book.author)
    setNewBookIsbn(book.isbn)
    setNewBookCategory(book.category)
    setNewBookRelevance(book.program_strand_relevance || 'General')
    setNewBookStatus(book.status === 'E-book' ? 'E-book' : 'Available')
    setNewBookContent(book.content || '')
    setNewBookCoverUrl(book.cover_image_url || '')
    setNewBookCoverPreview(book.cover_image_url || '')
    setNewBookCoverFile(null)
    setNewBookTotalCopies(book.total_copies ?? 1)
    setNewBookEbookUrl(book.ebook_url || '')
    setNewBookEbookFile(null)
    setIsAddBookOpen(true)
  }

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBookTitle || !newBookAuthor || !newBookIsbn) return

    let finalCoverUrl = newBookCoverUrl || null

    // If the admin selected a new cover file, upload it first
    if (newBookCoverFile && newBookIsbn) {
      setIsUploadingCover(true)
      const uploaded = await uploadBookCover(newBookCoverFile, newBookIsbn)
      setIsUploadingCover(false)
      if (uploaded) {
        finalCoverUrl = uploaded
      } else {
        alert('Cover image upload failed. Please check your Supabase bucket permissions and try again.')
        return
      }
    }

    const totalCopies = newBookTotalCopies
    let availableCopies = newBookTotalCopies

    if (editingBookId) {
      const existingBook = books.find(b => b.book_id === editingBookId)
      if (existingBook) {
        const borrowedCount = Math.max(0, (existingBook.total_copies ?? 1) - (existingBook.available_copies ?? 1))
        availableCopies = Math.max(0, totalCopies - borrowedCount)
      }
    }

    let finalEbookUrl = newBookStatus === 'E-book' ? newBookEbookUrl : null

    // If the admin selected a new ebook file, upload it
    if (newBookStatus === 'E-book' && newBookEbookFile && newBookIsbn) {
      setIsUploadingEbook(true)
      const uploaded = await uploadEbookFile(newBookEbookFile, newBookIsbn)
      setIsUploadingEbook(false)
      if (uploaded) {
        finalEbookUrl = uploaded
      } else {
        alert('E-book PDF file upload failed. Please try again.')
        return
      }
    }

    const bookPayload = {
      title: newBookTitle,
      author: newBookAuthor,
      isbn: newBookIsbn,
      category: newBookCategory,
      program_strand_relevance: newBookRelevance,
      status: (newBookStatus === 'E-book' ? 'E-book' : (availableCopies === 0 ? 'Borrowed' : 'Available')) as 'Available' | 'Borrowed' | 'E-book',
      ebook_url: finalEbookUrl,
      content: newBookStatus === 'E-book' ? newBookContent : null,
      cover_image_url: finalCoverUrl,
      total_copies: newBookStatus === 'E-book' ? 1 : totalCopies,
      available_copies: newBookStatus === 'E-book' ? 1 : availableCopies
    }

    const saved = editingBookId
      ? await updateBook(editingBookId, bookPayload)
      : await addBook(bookPayload)

    if (saved) {
      setIsAddBookOpen(false)
      resetBookForm()
      loadDatabaseData()
    } else {
      alert(editingBookId ? 'Failed to update book record.' : 'Failed to add book. Check if ISBN is unique.')
    }
  }

  // Profile photo upload handler
  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return
    setIsUploadingAvatar(true)
    const url = await uploadProfilePhoto(file, currentUser.user_id)
    if (url) {
      await updateUser(currentUser.user_id, { avatar_url: url })
      setCurrentUser(prev => prev ? { ...prev, avatar_url: url } : prev)
    } else {
      alert('Profile photo upload failed. Check your Supabase bucket permissions.')
    }
    setIsUploadingAvatar(false)
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

    if (book.available_copies !== undefined && book.available_copies <= 0) {
      alert('All physical copies of this book are currently borrowed. Please wait for a copy to be returned.')
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

  const handlePreviewExternalBook = (result: ExternalBookResult) => {
    if (!result.embeddable) {
      window.open(result.previewUrl, '_blank', 'noopener,noreferrer')
      return
    }

    setEbookToRead({
      book_id: -Date.now(),
      title: result.title,
      author: result.authors,
      isbn: result.key,
      category: result.categories,
      program_strand_relevance: 'External',
      status: 'E-book',
      ebook_url: `google-books:${result.key}`,
      content: null,
      cover_image_url: result.coverUrl,
      total_copies: 1,
      available_copies: 1,
      google_books_id: result.key,
      google_preview_url: result.previewUrl
    })
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
        book.isbn.toLowerCase().includes(query.toLowerCase()) ||
        book.category.toLowerCase().includes(query.toLowerCase()) ||
        (book.program_strand_relevance && book.program_strand_relevance.toLowerCase().includes(query.toLowerCase()))
      
      const matchCategory = selectedCategory === 'All' || book.category === selectedCategory
      
      return matchSearch && matchCategory
    })
  }, [books, query, selectedCategory])

  const externalSearchLinks = useMemo(() => {
    const term = query.trim()
    if (!term) return []

    const encoded = encodeURIComponent(term)
    return [
      {
        label: 'Google Books',
        url: `https://www.google.com/search?q=${encoded}+book`
      },
      {
        label: 'Open Library',
        url: `https://openlibrary.org/search?q=${encoded}`
      },
      {
        label: 'WorldCat',
        url: `https://www.worldcat.org/search?q=${encoded}`
      }
    ]
  }, [query])

  useEffect(() => {
    const term = query.trim()

    if (!term) {
      setExternalBookResults([])
      setExternalSearchStatus('idle')
      setExternalSearchMessage('')
      return
    }

    const controller = new AbortController()
    setExternalSearchStatus('loading')
    setExternalSearchMessage('')

    const timer = window.setTimeout(async () => {
      try {
        const googleBooksApiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
        const params = new URLSearchParams({
          q: term,
          maxResults: '8',
          printType: 'books',
          projection: 'lite'
        })

        if (googleBooksApiKey) {
          params.set('key', googleBooksApiKey)
        }

        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(response.status === 429
            ? 'Google Books rate limit reached. Add VITE_GOOGLE_BOOKS_API_KEY in .env to make this reliable.'
            : `Google Books search failed with status ${response.status}.`
          )
        }

        const payload: {
          items?: Array<{
            id?: string
            volumeInfo?: {
              title?: string
              authors?: string[]
              publisher?: string
              publishedDate?: string
              description?: string
              categories?: string[]
              imageLinks?: {
                thumbnail?: string
                smallThumbnail?: string
              }
              previewLink?: string
              infoLink?: string
            }
            saleInfo?: {
              buyLink?: string
            }
            accessInfo?: {
              webReaderLink?: string
              accessViewStatus?: string
              embeddable?: boolean
            }
          }>
        } = await response.json()

        const results = (payload.items || [])
          .filter((item) => item.id && item.volumeInfo?.title)
          .map((item) => ({
            key: item.id as string,
            title: item.volumeInfo?.title || 'Untitled book',
            authors: item.volumeInfo?.authors?.slice(0, 3).join(', ') || 'Author not listed',
            publishedDate: item.volumeInfo?.publishedDate || 'Date not listed',
            publisher: item.volumeInfo?.publisher || 'Publisher not listed',
            categories: item.volumeInfo?.categories?.slice(0, 2).join(', ') || 'Category not listed',
            description: item.volumeInfo?.description
              ? item.volumeInfo.description.replace(/<[^>]+>/g, '').slice(0, 180)
              : 'No description available from Google Books.',
            coverUrl: (item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail || null)?.replace('http:', 'https:') || null,
            previewUrl: item.volumeInfo?.previewLink || item.accessInfo?.webReaderLink || item.volumeInfo?.infoLink || `https://books.google.com/books?id=${item.id}`,
            infoUrl: item.volumeInfo?.infoLink || `https://books.google.com/books?id=${item.id}`,
            buyUrl: item.saleInfo?.buyLink || null,
            accessViewStatus: item.accessInfo?.accessViewStatus || 'UNKNOWN',
            embeddable: item.accessInfo?.embeddable === true
          }))

        setExternalBookResults(results)
        setExternalSearchStatus('ready')
        setExternalSearchMessage('')
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('External book search error:', err)
          setExternalBookResults([])
          setExternalSearchStatus('error')
          setExternalSearchMessage(err instanceof Error ? err.message : 'Google Books results are unavailable right now.')
        }
      }
    }, 450)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

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
      availableBooks: books.filter(b => b.status === 'Available').length,
      ebookBooks: books.filter(b => b.status === 'E-book').length,
      requestedCount: transactions.filter(t => t.status === 'Requested').length,
      returnedCount: transactions.filter(t => t.status === 'Returned').length,
      totalBooks: books.length
    }
  }, [books, transactions])

  const activeTransactions = useMemo(() => {
    return transactions.filter(t => t.status !== 'Returned')
  }, [transactions])

  const topDemandBooks = useMemo(() => {
    const demandMap = transactions.reduce<Record<number, { book: Transaction['books']; count: number }>>((acc, tx) => {
      if (!tx.books) return acc
      acc[tx.book_id] = acc[tx.book_id] || { book: tx.books, count: 0 }
      acc[tx.book_id].count += 1
      return acc
    }, {})

    return Object.values(demandMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }, [transactions])

  const roleFocus = useMemo(() => {
    if (!currentUser) {
      return {
        title: 'Public access portal',
        description: 'Browse the catalog, preview learning resources, and sign in to request books or read e-books.',
        primary: 'Browse Catalog',
        secondary: 'Login',
        primaryView: 'storefront' as View,
        secondaryView: 'storefront' as View
      }
    }

    if (currentUser.role === 'Librarian' || currentUser.role === 'Administrator') {
      return {
        title: 'Librarian / Admin Console',
        description: 'Approve borrowing requests, update returns, monitor overdue books, scan QR entries, export reports, and create student records offline.',
        primary: 'Open Catalog',
        secondary: 'Manage Students',
        primaryView: 'catalog' as View,
        secondaryView: 'users' as View
      }
    }

    if (currentUser.role === 'Teacher') {
      return {
        title: 'Teacher resource support',
        description: 'Search available materials, read e-books, recommend learning resources for classes, and review AI-matched references by program and level.',
        primary: 'Find Materials',
        secondary: 'AI Matches',
        primaryView: 'catalog' as View,
        secondaryView: 'ai' as View
      }
    }

    return {
      title: 'Student learning workspace',
      description: 'Find books matched to your program, request physical copies, read e-books online, and present your QR gate pass.',
      primary: 'Get Recommendations',
      secondary: 'My QR Pass',
      primaryView: 'ai' as View,
      secondaryView: 'qr' as View
    }
  }, [currentUser])

  // -------------------------------------------------------------
  // EXPORTABLE REPORTS (CSV Generator)
  // -------------------------------------------------------------
  const handleExportCSV = (reportType: 'books' | 'transactions' | 'overdue' | 'users') => {
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
    } else if (reportType === 'overdue') {
      headers = ['Transaction ID', 'Borrower', 'Book Title', 'Program/Strand', 'Academic Level', 'Due Date', 'Notification Status']
      rows = transactions
        .filter(t => t.status === 'Overdue')
        .map(t => [
          t.transaction_id.toString(),
          t.users?.name || 'Unknown',
          t.books?.title || 'Unknown',
          t.users?.program_strand || 'General',
          t.users?.academic_level || 'N/A',
          t.due_date,
          'Overdue SMS ready'
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
            <a 
              href="#home" 
              className={storeTab === 'home' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); setStoreTab('home'); }}
            >
              Home
            </a>
            <a 
              href="#catalog" 
              className={storeTab === 'catalog' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); setStoreTab('catalog'); }}
            >
              Catalog
            </a>
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
            
            {storeTab === 'home' ? (
              <>
                <section className="store-hero" id="home">
                  <p className="eyebrow">Matalam Polytechnic College Inc. Library</p>
                  <h1>LibraSmart Library Management System</h1>
                  <p>
                    Web-based library management with AI-based book recommendation,
                    e-book access, analytics, SMS notification, automated reports,
                    and QR-code entry and exit tracking for Matalam Polytechnic College Inc.
                  </p>

                  <div className="store-hero-actions">
                    <button className="btn-primary" onClick={() => setStoreTab('catalog')}>Browse catalog</button>
                    <button className="btn-secondary" onClick={() => setShowLoginModal(true)}>
                      Login
                    </button>
                  </div>

                  <div className="public-stats" aria-label="LibraSmart highlights">
                    <div>
                      <strong>{analyticsData.totalBooks}</strong>
                      <span>Catalogued print and digital resources</span>
                    </div>
                    <div>
                      <strong>{analyticsData.availableBooks}</strong>
                      <span>Currently available shelf books</span>
                    </div>
                    <div>
                      <strong>{analyticsData.ebookBooks}</strong>
                      <span>Online e-book materials ready to read</span>
                    </div>
                    <div>
                      <strong>{activeTransactions.length}</strong>
                      <span>Active borrowing and return records</span>
                    </div>
                  </div>
                  
                  <div className="public-hero-preview" aria-label="LibraSmart preview">
                    <img src="/librasmart-logo-1024.png" alt="LibraSmart logo" />
                    <div>
                      <span>Today</span>
                      <strong>{activeTransactions.length} active transactions</strong>
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
                    The system addresses manual user records, shelf-by-shelf book searching,
                    slow borrowing and returning records, difficult overdue monitoring,
                    and limited visibility into borrowing trends, high-demand books,
                    and student reading behavior.
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
                      <p>Add, edit, delete, search, and monitor books by title, author, ISBN, category, academic level, and program or strand relevance.</p>
                    </article>
                    <article>
                      <Sparkles size={20} />
                      <h3>AI Recommendations</h3>
                      <p>Suggest learning materials based on academic track, subjects, grade or year level, borrowing history, and popular books.</p>
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
                      <p>Track borrowing trends, high-demand books, reading behavior, user activity, and generated reports for documentation.</p>
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
              </>
            ) : (
              <>
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
                      placeholder="Search by title, author, ISBN, subject, strand..." 
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
                        <div key={book.book_id} className="ai-rec-card" style={{ borderLeft: '4px solid var(--color-primary)', display: 'flex', flexDirection: 'column' }}>
                          <span className="ai-badge-header">{type}</span>
                          <div style={{ display: 'flex', gap: '12px', padding: '16px 16px 0 16px' }}>
                            {book.cover_image_url ? (
                              <img src={book.cover_image_url} alt={book.title} style={{ width: '50px', height: '66px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '50px', height: '66px', borderRadius: '4px', background: 'linear-gradient(135deg, #0a5c63 0%, #1d2e38 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px', flexShrink: 0 }}>
                                MPCI
                              </div>
                            )}
                            <div>
                              <h4 style={{ fontSize: '0.92rem', margin: '0 0 2px 0' }}>{book.title}</h4>
                              <span className="author" style={{ fontSize: '0.78rem' }}>By {book.author}</span>
                            </div>
                          </div>
                          <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <p style={{ fontSize: '0.78rem', margin: '8px 0', color: 'var(--color-text-muted)' }}>{reason}</p>
                            <div className="book-action-grid" style={{ marginTop: 'auto', paddingTop: '8px' }}>
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
                                disabled={book.status !== 'Available' || (book.available_copies !== undefined && book.available_copies <= 0)}
                              >
                                {book.available_copies === 0 ? 'All Copies Out' : 'Borrow Physical'}
                              </button>
                            </div>
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
                      <div className="empty-msg" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
                        <p>No matching books found in the local catalog.</p>
                        {query.trim() ? (
                          <>
                            <p>Check Google Books results below, or search these sources directly:</p>
                            <div className="external-search-links">
                              {externalSearchLinks.map((link) => (
                                <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="external-link-btn">
                                  {link.label}
                                </a>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p>Try searching for keywords like "design", "IT", or "CCNA".</p>
                        )}
                      </div>
                    ) : (
                      filteredBooks.map((book, index) => (
                        <div key={book.book_id} className="book-store-card">
                          {/* CSS gradient or image book cover */}
                          <div 
                            className={`book-cover-stage ${getCoverClass(index)}`}
                            style={book.cover_image_url ? { backgroundImage: `url(${book.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                          >
                            {!book.cover_image_url && (
                              <>
                                <span className="cover-title">{book.title}</span>
                                <span className="cover-author">{book.author}</span>
                              </>
                            )}
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

                            {/* Copies availability badge */}
                            {book.status !== 'E-book' && (
                              <div className="book-copies-indicator">
                                <span className={`copies-count-text ${book.available_copies === 0 ? 'out-of-stock' : ''}`}>
                                  {book.available_copies ?? 0} / {book.total_copies ?? 1} copies available
                                </span>
                              </div>
                            )}

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
                                disabled={book.status !== 'Available' || (book.available_copies !== undefined && book.available_copies <= 0)}
                              >
                                {book.available_copies === 0 ? 'All Copies Out' : 'Borrow Physical'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {query.trim() && (
                    <div className="search-engine-results">
                      <div className="search-engine-heading">
                        <div>
                          <p className="eyebrow">Online search</p>
                          <h3>Google Books results for "{query.trim()}"</h3>
                        </div>
                        <span>{externalSearchStatus === 'loading' ? 'Searching...' : `${externalBookResults.length} results`}</span>
                      </div>

                      {externalSearchStatus === 'error' && (
                        <p className="external-search-status">
                          {externalSearchMessage || 'Google Books results are unavailable right now.'}
                        </p>
                      )}

                      {externalSearchStatus === 'loading' && (
                        <p className="external-search-status">Searching Google Books...</p>
                      )}

                      {externalSearchStatus === 'ready' && externalBookResults.length === 0 && (
                        <p className="external-search-status">No Google Books results found for this search.</p>
                      )}

                      {externalBookResults.length > 0 && (
                        <div className="external-book-results">
                          {externalBookResults.map((result) => (
                            <article key={result.key} className="external-book-card">
                              {result.coverUrl ? (
                                <img src={result.coverUrl} alt={result.title} />
                              ) : (
                                <div className="external-book-cover-placeholder">
                                  <BookOpen size={24} />
                                </div>
                              )}
                              <div>
                                <span className="external-source-label">Google Books</span>
                                <h4>{result.title}</h4>
                                <p>{result.authors}</p>
                                <span>{result.publisher} • {result.publishedDate}</span>
                                <span>{result.categories}</span>
                                <span className={`google-access-pill ${result.embeddable ? 'is-embeddable' : ''}`}>
                                  {result.embeddable ? 'Embeddable preview' : result.accessViewStatus.replaceAll('_', ' ').toLowerCase()}
                                </span>
                                <p className="external-book-description">{result.description}</p>
                                <div className="external-book-actions">
                                  <button type="button" className="external-link-btn" onClick={() => handlePreviewExternalBook(result)}>
                                    <BookOpen size={14} />
                                    {result.embeddable ? 'Read Preview' : 'Open Preview'}
                                  </button>
                                  <a href={result.infoUrl} target="_blank" rel="noreferrer">
                                    <Info size={14} />
                                    Details
                                  </a>
                                  {result.buyUrl && (
                                    <a href={result.buyUrl} target="_blank" rel="noreferrer">
                                      <ShoppingBag size={14} />
                                      Buy
                                    </a>
                                  )}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}

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
          <button className={(view as string) === 'storefront' ? 'active' : ''} onClick={() => { setView('storefront'); setStoreTab('catalog'); }}>
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
          {!isStudent && (
            <>
              <button className={view === 'analytics' ? 'active' : ''} onClick={() => setView('analytics')}>
                <TrendingUp size={18} /> Analytics
              </button>
              <button className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}>
                <FileText size={18} /> Reports
              </button>
              {(currentUser.role === 'Librarian' || currentUser.role === 'Administrator') && (
                <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>
                  <UserCheck size={18} /> Student Records
                </button>
              )}
            </>
          )}
        </nav>

        {/* LOGGED IN USER PROFILE FOOTER */}
        <div className="side-profile">
          <div className="profile-card">
            <div
              className="profile-avatar-wrap"
              onClick={() => !isUploadingAvatar && profilePhotoInputRef.current?.click()}
              title="Click to change profile photo"
            >
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt={currentUser.name} className="profile-avatar profile-avatar-img" />
              ) : (
                <div className="profile-avatar">
                  {isUploadingAvatar ? '...' : currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-avatar-edit">
                <Camera size={10} />
              </div>
            </div>
            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleProfilePhotoChange}
            />
            <div className="profile-details">
              <span className="profile-name">{currentUser.name}</span>
              <span className="profile-role">
                {currentUser.role === 'Librarian' || currentUser.role === 'Administrator' 
                  ? 'Librarian / Admin' 
                  : currentUser.role}
              </span>
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
                <p className="eyebrow">{roleFocus.title}</p>
                <h2>Welcome back, {currentUser.name}!</h2>
                <p>
                  {roleFocus.description}
                </p>
                <div className="hero-actions">
                  <button className="btn-primary" onClick={() => setView(roleFocus.primaryView)}>
                    {roleFocus.primary}
                  </button>
                  {currentUser?.role !== 'Student' && (
                    <button className="btn-secondary" onClick={() => setView(roleFocus.secondaryView)}>
                      {roleFocus.secondary}
                    </button>
                  )}
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
                <button className="btn-primary" onClick={handleOpenAddBook}>
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
                    <th>Copies</th>
                    <th>Availability Status</th>
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
                        <td style={{ fontWeight: '700' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {book.cover_image_url ? (
                              <img src={book.cover_image_url} alt={book.title} style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                            ) : (
                              <div style={{ width: '36px', height: '48px', borderRadius: '4px', background: 'linear-gradient(135deg, #0a5c63 0%, #1d2e38 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', padding: '2px' }}>
                                MPCI
                              </div>
                            )}
                            <span>{book.title}</span>
                          </div>
                        </td>
                        <td>{book.author}</td>
                        <td><code>{book.isbn}</code></td>
                        <td>{book.category}</td>
                        <td>
                          <span className="badge badge-info">{book.program_strand_relevance || 'General'}</span>
                        </td>
                        <td>
                          {book.status === 'E-book' ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>N/A (Digital)</span>
                          ) : (
                            <span style={{ fontWeight: 700 }}>
                              {book.available_copies ?? 0} / {book.total_copies ?? 1}
                            </span>
                          )}
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
                                  disabled={book.status !== 'Available' || (book.available_copies !== undefined && book.available_copies <= 0)}
                                >
                                  {book.available_copies === 0 ? 'All Copies Out' : 'Borrow Physical'}
                                </button>
                              </>
                            )}

                            {(currentUser.role === 'Librarian' || currentUser.role === 'Administrator') && (
                              <>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  onClick={() => handleOpenEditBook(book)}
                                  title="Edit book record"
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#dc2626' }}
                                  onClick={() => handleDeleteBook(book.book_id)}
                                  title="Delete book record"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
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
                  <div key={book.book_id} className="ai-rec-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="ai-badge-header">{type}</span>
                    <div style={{ display: 'flex', gap: '14px', padding: '16px 16px 0 16px' }}>
                      {book.cover_image_url ? (
                        <img src={book.cover_image_url} alt={book.title} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '60px', height: '80px', borderRadius: '6px', background: 'linear-gradient(135deg, #0a5c63 0%, #1d2e38 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '4px', flexShrink: 0 }}>
                          Book
                        </div>
                      )}
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', lineHeight: '1.2' }}>{book.title}</h4>
                        <span className="author">By {book.author}</span>
                      </div>
                    </div>
                    <div className="explanation" style={{ padding: '0 16px 16px 16px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', flexGrow: 1 }}>
                      {reason}
                    </div>
                    
                    <div className="book-action-grid" style={{ padding: '12px 16px 16px 16px' }}>
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
        {view === 'analytics' && (() => {
          // Compute dynamic chart values
          const totalTx = analyticsData.totalBorrows || 1
          const strandEntries = Object.entries(analyticsData.strandBorrows) as [string, number][]
          const maxStrand = Math.max(...strandEntries.map(([, v]) => v), 1)
          const strandColors: Record<string, string> = { BSIT: '#0f7581', BSA: '#f2bd4a', BSBA: '#102131', BSED: '#ef4444', SHS: '#10b981' }

          // Status breakdown for donut
          const availPct = books.length ? Math.round((analyticsData.availableBooks / books.length) * 100) : 0
          const borrowedPct = books.length ? Math.round((analyticsData.physicalBorrowed / books.length) * 100) : 0
          const ebookPct = books.length ? Math.round((analyticsData.ebookBooks / books.length) * 100) : 0

          // Donut segment calculations (circumference = 2 * PI * 70 ≈ 440)
          const circ = 440
          const seg1 = (availPct / 100) * circ
          const seg2 = (borrowedPct / 100) * circ
          const seg3 = (ebookPct / 100) * circ

          // Category usage counts
          const catUsage: Record<string, number> = {}
          transactions.forEach(t => {
            if (t.books?.category) {
              catUsage[t.books.category] = (catUsage[t.books.category] || 0) + 1
            }
          })
          const catEntries = Object.entries(catUsage).sort((a, b) => b[1] - a[1])
          const maxCat = Math.max(...catEntries.map(([, v]) => v), 1)

          // Recent activity (last 8 transactions)
          const recentTx = [...transactions].sort((a, b) =>
            new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime()
          ).slice(0, 8)

          return (
            <>
              {/* Stat Summary Cards */}
              <div className="analytics-stats-row">
                <div className="analytics-stat-card stat-primary">
                  <div className="stat-icon-ring"><BookOpen size={22} /></div>
                  <div className="stat-content">
                    <span className="stat-value">{analyticsData.totalBooks}</span>
                    <span className="stat-label">Total Books</span>
                  </div>
                </div>
                <div className="analytics-stat-card stat-teal">
                  <div className="stat-icon-ring"><BookMarked size={22} /></div>
                  <div className="stat-content">
                    <span className="stat-value">{analyticsData.physicalBorrowed}</span>
                    <span className="stat-label">Active Borrows</span>
                  </div>
                </div>
                <div className="analytics-stat-card stat-warning">
                  <div className="stat-icon-ring"><AlertTriangle size={22} /></div>
                  <div className="stat-content">
                    <span className="stat-value">{analyticsData.overdueCount}</span>
                    <span className="stat-label">Overdue</span>
                  </div>
                </div>
                <div className="analytics-stat-card stat-info">
                  <div className="stat-icon-ring"><FileText size={22} /></div>
                  <div className="stat-content">
                    <span className="stat-value">{analyticsData.requestedCount}</span>
                    <span className="stat-label">Pending Requests</span>
                  </div>
                </div>
                <div className="analytics-stat-card stat-success">
                  <div className="stat-icon-ring"><CheckCircle size={22} /></div>
                  <div className="stat-content">
                    <span className="stat-value">{analyticsData.returnedCount}</span>
                    <span className="stat-label">Returned</span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="analytics-card-grid">
                
                {/* Chart 1: Bar Chart — Strand Borrowing Trends */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <div className="panel-title">
                      <TrendingUp size={20} />
                      <h3>Borrowing by Academic Strand</h3>
                    </div>
                  </div>

                  <div className="analytics-bar-chart">
                    {strandEntries.map(([strand, count]) => (
                      <div className="bar-chart-row" key={strand}>
                        <span className="bar-label">{strand}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${Math.max(3, (count / maxStrand) * 100)}%`,
                              backgroundColor: strandColors[strand] || '#0f7581'
                            }}
                          />
                        </div>
                        <span className="bar-value">{count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="chart-footnote">
                    <span>Total transactions: <strong>{totalTx}</strong></span>
                  </div>
                </div>

                {/* Chart 2: Donut — Media Status Distribution */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <div className="panel-title">
                      <BookMarked size={20} />
                      <h3>Media Status Distribution</h3>
                    </div>
                  </div>

                  <div className="donut-chart-layout">
                    <svg className="donut-svg" viewBox="0 0 200 200" width="180" height="180">
                      <circle cx="100" cy="100" r="70" fill="transparent" stroke="#e2e8f0" strokeWidth="22" />
                      <circle cx="100" cy="100" r="70" fill="transparent" stroke="#10b981" strokeWidth="22"
                        strokeDasharray={`${seg1} ${circ}`} strokeDashoffset="0"
                        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                      <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f2bd4a" strokeWidth="22"
                        strokeDasharray={`${seg2} ${circ}`} strokeDashoffset={`${-seg1}`}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                      <circle cx="100" cy="100" r="70" fill="transparent" stroke="#0f7581" strokeWidth="22"
                        strokeDasharray={`${seg3} ${circ}`} strokeDashoffset={`${-(seg1 + seg2)}`}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                      <circle cx="100" cy="100" r="54" fill="var(--color-surface)" />
                      <text x="100" y="96" fontSize="26" fontWeight="900" fill="var(--color-text)" textAnchor="middle">
                        {books.length}
                      </text>
                      <text x="100" y="116" fontSize="10" fontWeight="600" fill="var(--color-text-muted)" textAnchor="middle">
                        Total Media
                      </text>
                    </svg>

                    <div className="donut-legend">
                      <div className="legend-row">
                        <div className="legend-color-dot" style={{ backgroundColor: '#10b981' }} />
                        <div className="legend-info">
                          <span className="legend-title">Available</span>
                          <span className="legend-count">{analyticsData.availableBooks} books — {availPct}%</span>
                        </div>
                      </div>
                      <div className="legend-row">
                        <div className="legend-color-dot" style={{ backgroundColor: '#f2bd4a' }} />
                        <div className="legend-info">
                          <span className="legend-title">Borrowed</span>
                          <span className="legend-count">{analyticsData.physicalBorrowed} books — {borrowedPct}%</span>
                        </div>
                      </div>
                      <div className="legend-row">
                        <div className="legend-color-dot" style={{ backgroundColor: '#0f7581' }} />
                        <div className="legend-info">
                          <span className="legend-title">E-Books</span>
                          <span className="legend-count">{analyticsData.ebookBooks} titles — {ebookPct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row: Category Usage + Top Demand + Activity */}
              <div className="analytics-card-grid" style={{ marginTop: '14px' }}>

                {/* Category Usage Breakdown */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <div className="panel-title">
                      <ShoppingBag size={20} />
                      <h3>Borrowing by Subject Category</h3>
                    </div>
                  </div>

                  {catEntries.length === 0 ? (
                    <p className="empty-msg">No category data available yet.</p>
                  ) : (
                    <div className="analytics-bar-chart">
                      {catEntries.map(([cat, count]) => (
                        <div className="bar-chart-row" key={cat}>
                          <span className="bar-label" style={{ minWidth: '120px' }}>{cat}</span>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${Math.max(3, (count / maxCat) * 100)}%`,
                                backgroundColor: '#0f7581'
                              }}
                            />
                          </div>
                          <span className="bar-value">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Demand Books + Recent Activity */}
                <div style={{ display: 'grid', gap: '14px' }}>
                  <div className="panel-card">
                    <div className="panel-card-header">
                      <div className="panel-title">
                        <TrendingUp size={20} />
                        <h3>Most Requested Books</h3>
                      </div>
                    </div>

                    <div className="demand-list">
                      {topDemandBooks.length === 0 ? (
                        <p className="empty-msg">No borrowing data recorded yet.</p>
                      ) : (
                        topDemandBooks.map(({ book, count }, index) => (
                          <div className="demand-row" key={`${book?.isbn || index}-${index}`}>
                            <span className="demand-rank">#{index + 1}</span>
                            <div className="demand-info">
                              <strong>{book?.title || 'Untitled'}</strong>
                              <small>{book?.author || 'Unknown'} • {book?.category || 'General'}</small>
                            </div>
                            <span className="demand-count">{count} borrows</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="panel-card">
                    <div className="panel-card-header">
                      <div className="panel-title">
                        <History size={20} />
                        <h3>Recent Activity</h3>
                      </div>
                    </div>

                    <div className="activity-timeline">
                      {recentTx.length === 0 ? (
                        <p className="empty-msg">No recent transactions.</p>
                      ) : (
                        recentTx.map((tx) => (
                          <div className="timeline-item" key={tx.transaction_id}>
                            <div className={`timeline-dot ${tx.status === 'Overdue' ? 'dot-danger' : tx.status === 'Returned' ? 'dot-success' : 'dot-info'}`} />
                            <div className="timeline-content">
                              <strong>{tx.users?.name || 'User'}</strong> — {tx.books?.title || 'Book'}
                              <span className={`badge badge-sm ${tx.status === 'Overdue' ? 'badge-warning' : tx.status === 'Returned' ? 'badge-success' : 'badge-info'}`}>
                                {tx.status}
                              </span>
                            </div>
                            <span className="timeline-date">{new Date(tx.borrow_date).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        })()}

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
              Download official school reports for borrowed books, overdue books, user activity, and inventory documentation as Excel-compatible CSV files.
            </p>

            <div className="reports-grid">
              
              <div className="report-item-card">
                <div className="report-card-top">
                  <strong>Book Inventory Masterlist</strong>
                  <span>Format: Excel-compatible CSV • System Generated</span>
                  <p>Comprehensive report outlining all books catalogued in the system, detailing author, ISBN, category, and shelf status.</p>
                </div>
                <button className="btn-primary btn-report-download" onClick={() => handleExportCSV('books')}>
                  Download Inventory Report
                </button>
              </div>

              <div className="report-item-card">
                <div className="report-card-top">
                  <strong>Borrowed Books and Transactions</strong>
                  <span>Format: Excel-compatible CSV • Live Operations</span>
                  <p>Comprehensive transaction log listing all active borrowings, request submissions, return deadlines, and overdue status.</p>
                </div>
                <button className="btn-primary btn-report-download" onClick={() => handleExportCSV('transactions')}>
                  Download Borrowed Books Report
                </button>
              </div>

              <div className="report-item-card">
                <div className="report-card-top">
                  <strong>Overdue Books and SMS Follow-up</strong>
                  <span>Format: Excel-compatible CSV • Due Monitoring</span>
                  <p>Focused report for overdue books, borrower academic details, due dates, and notification readiness for librarian action.</p>
                </div>
                <button className="btn-primary btn-report-download" onClick={() => handleExportCSV('overdue')}>
                  Download Overdue Report
                </button>
              </div>

              <div className="report-item-card">
                <div className="report-card-top">
                  <strong>User Activity Directory</strong>
                  <span>Format: Excel-compatible CSV • Dynamic</span>
                  <p>Administrative log summarizing user identities, academic program or strand, year level, and contact details.</p>
                </div>
                <button className="btn-primary btn-report-download" onClick={() => handleExportCSV('users')}>
                  Download User Activity Report
                </button>
              </div>

            </div>
          </div>
        )}

        {view === 'users' && (currentUser.role === 'Librarian' || currentUser.role === 'Administrator') && (
          <div className="panel-card">
            <div className="panel-card-header">
              <div className="panel-title">
                <UserCheck size={20} />
                <h3>Student Record Builder</h3>
              </div>
              <p className="panel-subtitle">
                Create student accounts offline and keep borrower profiles ready for book requests.
              </p>
            </div>

            <div className="form-grid">
              <div className="panel-card-inner">
                {newStudentError && <div className="login-alert error">{newStudentError}</div>}
                {newStudentSuccess && <div className="login-alert success">{newStudentSuccess}</div>}
                <form onSubmit={handleCreateStudent} className="admin-form">
                  <div className="form-group">
                    <label htmlFor="student-name">Student Full Name</label>
                    <input
                      id="student-name"
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-username">Student Username</label>
                    <input
                      id="student-username"
                      type="text"
                      value={newStudentUsername}
                      onChange={(e) => setNewStudentUsername(e.target.value)}
                      placeholder="juan123"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-password">Temporary Password</label>
                    <input
                      id="student-password"
                      type="password"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      placeholder="Password for student login"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-phone">Phone Number</label>
                    <input
                      id="student-phone"
                      type="text"
                      value={newStudentPhone}
                      onChange={(e) => setNewStudentPhone(e.target.value)}
                      placeholder="+639123456789"
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="student-strand">Program / Strand</label>
                      <select
                        id="student-strand"
                        value={newStudentProgramStrand}
                        onChange={(e) => setNewStudentProgramStrand(e.target.value)}
                      >
                        <option value="BSIT">BSIT</option>
                        <option value="BSA">BSA</option>
                        <option value="BSBA">BSBA</option>
                        <option value="BSED">BSED</option>
                        <option value="General">General</option>
                        <option value="Grade 11 - STEM">Grade 11 - STEM</option>
                        <option value="Grade 12 - ICT">Grade 12 - ICT</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-level">Academic Level</label>
                      <select
                        id="student-level"
                        value={newStudentAcademicLevel}
                        onChange={(e) => setNewStudentAcademicLevel(e.target.value)}
                      >
                        <option value="1st Year">1st Year College</option>
                        <option value="2nd Year">2nd Year College</option>
                        <option value="3rd Year">3rd Year College</option>
                        <option value="4th Year">4th Year College</option>
                        <option value="Grade 11">Grade 11 Senior High</option>
                        <option value="Grade 12">Grade 12 Senior High</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={newStudentLoading}>
                    {newStudentLoading ? 'Saving Student...' : 'Create Student Record'}
                  </button>
                </form>

                <div className="manual-lend-block">
                  <h4>Manual Checkout for Offline Students</h4>
                  <p className="panel-subtitle">Issue a physical book to a student directly when they can’t access the web app.</p>
                  {manualBorrowError && <div className="login-alert error">{manualBorrowError}</div>}
                  {manualBorrowSuccess && <div className="login-alert success">{manualBorrowSuccess}</div>}
                  <form onSubmit={handleManualLendBook} className="admin-form">
                    <div className="form-group">
                      <label htmlFor="manual-student">Student Account</label>
                      <select
                        id="manual-student"
                        value={selectedManualBorrowStudentId ?? ''}
                        onChange={(e) => setSelectedManualBorrowStudentId(Number(e.target.value) || null)}
                      >
                        <option value="">Select student</option>
                        {users.filter((u) => u.role === 'Student').map((student) => (
                          <option key={student.user_id} value={student.user_id}>
                            {student.name} — {student.username}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="manual-book">Available Book</label>
                      <select
                        id="manual-book"
                        value={selectedManualBorrowBookId ?? ''}
                        onChange={(e) => setSelectedManualBorrowBookId(Number(e.target.value) || null)}
                      >
                        <option value="">Select book</option>
                        {books.filter((book) => book.status === 'Available' && (book.available_copies ?? 0) > 0).map((book) => (
                          <option key={book.book_id} value={book.book_id}>
                            {book.title} — {book.author}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label htmlFor="manual-due-days">Due Days</label>
                        <input
                          id="manual-due-days"
                          type="number"
                          min={1}
                          value={manualBorrowDueDays}
                          onChange={(e) => setManualBorrowDueDays(Math.max(1, Number(e.target.value) || 7))}
                        />
                      </div>
                      <div className="form-group">
                        <label>&nbsp;</label>
                        <button type="submit" className="btn-primary" disabled={manualBorrowLoading}>
                          {manualBorrowLoading ? 'Issuing...' : 'Issue Book Now'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="panel-card-inner">
                <div className="panel-card-inner-header">
                  <div>
                    <h4>Existing Student Records</h4>
                    <p className="panel-subtitle">Total student accounts: {studentCount}</p>
                  </div>
                </div>
                <div className="user-list">
                  {studentCount === 0 ? (
                    <p className="empty-msg">No student records found yet.</p>
                  ) : (
                    users.filter((u) => u.role === 'Student').map((student) => (
                      <div key={student.user_id} className="user-list-item">
                        <div>
                          <strong>{student.name}</strong>
                          <span>{student.username} • {student.program_strand || 'General'} • {student.academic_level || 'N/A'}</span>
                        </div>
                        <span>{student.phone_number || 'No phone'}</span>
                      </div>
                    ))
                  )}
                </div>
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
              <h3>{editingBookId ? 'Edit Book Record' : 'Add New Book to Shelf'}</h3>
              <button className="btn-close-modal" onClick={() => {
                setIsAddBookOpen(false)
                resetBookForm()
              }}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveBook} className="modal-form">
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

              <div className="form-group">
                <label htmlFor="b-cover">Book Cover Image</label>
                <div
                  className="cover-upload-area"
                  onClick={() => coverFileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && coverFileInputRef.current?.click()}
                >
                  {newBookCoverPreview ? (
                    <div className="cover-upload-preview">
                      <img src={newBookCoverPreview} alt="Cover preview" />
                      <span className="cover-change-hint"><ImagePlus size={14} /> Change Cover</span>
                    </div>
                  ) : (
                    <div className="cover-upload-empty">
                      <Upload size={24} />
                      <span>Click to upload cover image</span>
                      <small>JPG, PNG or WEBP — max 5MB</small>
                    </div>
                  )}
                </div>
                <input
                  ref={coverFileInputRef}
                  id="b-cover"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setNewBookCoverFile(file)
                    setNewBookCoverPreview(URL.createObjectURL(file))
                  }}
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

              {newBookStatus === 'Available' && (
                <div className="form-group">
                  <label htmlFor="b-copies">Total Physical Copies</label>
                  <input
                    id="b-copies"
                    type="number"
                    min="1"
                    value={newBookTotalCopies}
                    onChange={(e) => setNewBookTotalCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                </div>
              )}

              {newBookStatus === 'E-book' && (
                <>
                  <div className="form-group">
                    <label htmlFor="b-ebook-file">E-Book PDF File (Optional Upload)</label>
                    <div
                      className="cover-upload-area"
                      onClick={() => ebookFileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && ebookFileInputRef.current?.click()}
                    >
                      {newBookEbookFile ? (
                        <div className="cover-upload-preview" style={{ padding: '20px', flexDirection: 'column', gap: '8px' }}>
                          <FileText size={48} style={{ color: 'var(--color-primary)' }} />
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>{newBookEbookFile.name}</span>
                          <span className="cover-change-hint">Change File</span>
                        </div>
                      ) : newBookEbookUrl && (newBookEbookUrl.includes('/storage/v1/object/public/books/ebooks/') || newBookEbookUrl.toLowerCase().endsWith('.pdf') || newBookEbookUrl.startsWith('data:')) ? (
                        <div className="cover-upload-preview" style={{ padding: '20px', flexDirection: 'column', gap: '8px' }}>
                          <FileText size={48} style={{ color: 'var(--color-primary)' }} />
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>Current E-Book PDF Attached</span>
                          <span className="cover-change-hint">Replace File</span>
                        </div>
                      ) : (
                        <div className="cover-upload-empty">
                          <Upload size={24} />
                          <span>Click to upload E-Book PDF</span>
                          <small>PDF format — max 15MB</small>
                        </div>
                      )}
                    </div>
                    <input
                      ref={ebookFileInputRef}
                      id="b-ebook-file"
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setNewBookEbookFile(file)
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="b-content">E-Book Text Contents (Alternative / Fallback Chapters)</label>
                    <textarea 
                      id="b-content" 
                      value={newBookContent}
                      onChange={(e) => setNewBookContent(e.target.value)}
                      placeholder="Chapter 1: Principles of study...

Chapter 2: Structural implementations..."
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setIsAddBookOpen(false)
                  resetBookForm()
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isUploadingCover || isUploadingEbook}>
                  {isUploadingCover ? 'Uploading cover...' : isUploadingEbook ? 'Uploading E-Book...' : editingBookId ? 'Update Book Record' : 'Save Book Record'}
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
