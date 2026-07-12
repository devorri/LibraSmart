import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wfvyfhjzfdfemgahcxmc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Interfaces representing the database schema
export interface User {
  user_id: number
  name: string
  username: string
  password?: string
  role: 'Student' | 'Teacher' | 'Librarian' | 'Administrator'
  program_strand: string | null
  academic_level: string | null
  phone_number: string | null
  avatar_url?: string | null
  created_at?: string
}

export interface Book {
  book_id: number
  title: string
  author: string
  isbn: string
  category: string
  program_strand_relevance: string | null
  status: 'Available' | 'Borrowed' | 'E-book'
  ebook_url: string | null
  content: string | null
  cover_image_url?: string | null
  total_copies?: number
  available_copies?: number
}

export interface Transaction {
  transaction_id: number
  user_id: number
  book_id: number
  borrow_date: string
  due_date: string
  return_date: string | null
  status: 'Requested' | 'Borrowed' | 'Returned' | 'Overdue'
  // Joined fields
  users?: { name: string; username: string; program_strand: string | null; academic_level: string | null; phone_number: string | null }
  books?: { title: string; author: string; isbn: string; category: string }
}

export interface LibraryLog {
  log_id: number
  user_id: number
  type: 'Entry' | 'Exit'
  timestamp: string
  users?: { name: string; role: string; program_strand: string | null }
}

export interface Notification {
  notification_id: number
  user_id: number
  phone_number: string
  message: string
  notification_type: 'Due' | 'Overdue' | 'Transaction'
  status: 'Queued' | 'Sent'
  date_sent: string
  users?: { name: string }
}

// Fallback Mock Data in case tables don't exist yet or connection fails
export const mockData = {
  users: [
    { user_id: 1, name: 'Marlon G. Tagamolila', username: 'marlon', role: 'Student', program_strand: 'BSIT', academic_level: '4th Year', phone_number: '+639123456789' },
    { user_id: 2, name: 'Ryan Jay A. Ferenal', username: 'ryanjay', role: 'Student', program_strand: 'BSIT', academic_level: '4th Year', phone_number: '+639234567890' },
    { user_id: 3, name: 'Ms. Jane Doe', username: 'librarian', role: 'Librarian', program_strand: null, academic_level: null, phone_number: '+639345678901' },
    { user_id: 4, name: 'Principal Administrator', username: 'admin', role: 'Administrator', program_strand: null, academic_level: null, phone_number: '+639456789012' },
    { user_id: 5, name: 'Prof. John Smith', username: 'johnsmith', role: 'Teacher', program_strand: 'BSIT', academic_level: 'Faculty', phone_number: '+639567890123' },
    { user_id: 6, name: 'Hannah Cruz', username: 'hannah', role: 'Student', program_strand: 'BSA', academic_level: '2nd Year', phone_number: '+639678901234' }
  ] as User[],

  books: [
    { book_id: 1, title: 'Introduction to Information Technology', author: 'E. Turban', isbn: '978-047-134', category: 'Information Technology', program_strand_relevance: 'BSIT', status: 'Available', ebook_url: null, content: null, cover_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', total_copies: 3, available_copies: 2 },
    { book_id: 2, title: 'Applied Database Management Systems', author: 'W. Fadhilah', isbn: '978-602-211', category: 'Database', program_strand_relevance: 'BSIT', status: 'E-book', ebook_url: 'https://example.com/books/applied-db.pdf', content: 'Chapter 1: Database System Concepts\n\nA database-management system (DBMS) is a collection of interrelated data and a set of programs to access those data. This collection of data, usually referred to as the database, contains information relevant to an enterprise. The primary goal of a DBMS is to provide a way to store and retrieve database information that is both convenient and efficient.\n\nChapter 2: Relational Model\n\nThe relational model is today the primary data model for commercial data processing applications. It has achieved this position because of its simplicity and ease of database design. A relational database consists of a collection of tables, each of which is assigned a unique name. Each table has a structure similar to that of a spreadsheet.\n\nChapter 3: SQL Structure Query Language\n\nStructured Query Language (SQL) is the most widely used relational database query language. It is designed to query, update, and manage relational databases.', cover_image_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80', total_copies: 1, available_copies: 1 },
    { book_id: 3, title: 'Research Methods in Computing', author: 'M. Kumari', isbn: '978-621-104', category: 'Research', program_strand_relevance: 'BSIT', status: 'Available', ebook_url: null, content: null, cover_image_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80', total_copies: 2, available_copies: 1 },
    { book_id: 4, title: 'Web Systems Design & Development', author: 'A. Boranbayev', isbn: '978-013-482', category: 'Information Technology', program_strand_relevance: 'BSIT', status: 'Available', ebook_url: null, content: null, cover_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&q=80', total_copies: 4, available_copies: 3 },
    { book_id: 5, title: 'Digital Library Operations', author: 'A. Zainab', isbn: '978-971-551', category: 'Library Science', program_strand_relevance: 'General', status: 'Available', ebook_url: null, content: null, cover_image_url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80', total_copies: 3, available_copies: 3 },
    { book_id: 6, title: 'Advanced Accounting Volume 1', author: 'C. Guerrero', isbn: '978-971-042', category: 'Accounting', program_strand_relevance: 'BSA', status: 'E-book', ebook_url: 'https://example.com/books/adv-accounting.pdf', content: 'Chapter 1: Partnership Formation\n\nA partnership is an association of two or more persons to carry on as co-owners of a business for profit. The agreement between the partners is called the Articles of Partnership. When a partnership is formed, partners contribute assets and/or liabilities to the business.\n\nChapter 2: Partnership Operations\n\nThe operations of a partnership are shared between partners according to their profit and loss agreement. This allocation can be based on a fixed ratio, capital balances, or salaries and interest allowance.', cover_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80', total_copies: 1, available_copies: 1 },
    { book_id: 7, title: 'Network Fundamentals (CCNA)', author: 'M. Dye', isbn: '978-158-713', category: 'Networking', program_strand_relevance: 'BSIT', status: 'Available', ebook_url: null, content: null, cover_image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80', total_copies: 2, available_copies: 2 }
  ] as Book[],

  transactions: [
    { transaction_id: 1, user_id: 1, book_id: 3, borrow_date: '2026-05-17', due_date: '2026-05-24', return_date: null, status: 'Overdue' },
    { transaction_id: 2, user_id: 2, book_id: 4, borrow_date: '2026-05-22', due_date: '2026-05-29', return_date: null, status: 'Borrowed' },
    { transaction_id: 3, user_id: 6, book_id: 5, borrow_date: '2026-05-15', due_date: '2026-05-22', return_date: '2026-05-22', status: 'Returned' },
    { transaction_id: 4, user_id: 1, book_id: 1, borrow_date: '2026-05-26', due_date: '2026-06-02', return_date: null, status: 'Borrowed' }
  ] as Transaction[],

  logs: [
    { log_id: 1, user_id: 1, type: 'Entry', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
    { log_id: 2, user_id: 2, type: 'Entry', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
    { log_id: 3, user_id: 1, type: 'Exit', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() }
  ] as LibraryLog[],

  notifications: [
    { notification_id: 1, user_id: 1, phone_number: '+639123456789', message: 'LibraSmart Alert: The book "Research Methods in Computing" was borrowed by you and is now OVERDUE since May 24, 2026. Please return it to avoid penalty.', notification_type: 'Overdue', status: 'Sent', date_sent: new Date(Date.now() - 86400000).toISOString() },
    { notification_id: 2, user_id: 2, phone_number: '+639234567890', message: 'LibraSmart Alert: You have borrowed "Web Systems Design & Development". Due date is June 03, 2026.', notification_type: 'Transaction', status: 'Sent', date_sent: new Date(Date.now() - 5 * 86400000).toISOString() }
  ] as Notification[]
}

// Local storage helpers to manage mock data locally if Supabase offline/missing tables
const getStoredMock = <T>(key: keyof typeof mockData, defaultValue: T): T => {
  const data = localStorage.getItem(`librasmart_mock_${key}`)
  return data ? JSON.parse(data) : defaultValue
}

const saveStoredMock = (key: keyof typeof mockData, data: unknown) => {
  localStorage.setItem(`librasmart_mock_${key}`, JSON.stringify(data))
}

// Check if a table exists in Supabase
let useMock = false
async function testSupabaseConnection() {
  try {
    const { error } = await supabase.from('books').select('count', { count: 'exact', head: true })
    if (error) {
      console.warn("Supabase check failed: ", error.message, "- Falling back to Mock LocalStorage mode")
      useMock = true
    }
  } catch (e) {
    console.warn("Supabase connection error, falling back to mock mode:", e)
    useMock = true
  }
}
testSupabaseConnection()

export function isUsingMock() {
  return useMock
}

// -------------------------------------------------------------
// USER API
// -------------------------------------------------------------
export async function authenticateUser(username: string, passwordHash: string): Promise<User | null> {
  if (useMock) {
    const list = getStoredMock<User[]>('users', mockData.users)
    const found = list.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === passwordHash)
    return found || null
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', passwordHash)
      .single()
    if (error) return null
    return data as User
  } catch {
    return null
  }
}

export async function registerUser(user: Omit<User, 'user_id'>): Promise<User | null> {
  if (useMock) {
    const list = getStoredMock<User[]>('users', mockData.users)
    const newUser = { ...user, user_id: list.length + 1 }
    list.push(newUser)
    saveStoredMock('users', list)
    return newUser
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()
    if (error) throw error
    return data as User
  } catch (e) {
    console.error("Register user error:", e)
    return null
  }
}

export async function fetchAllUsers(): Promise<User[]> {
  if (useMock) {
    return getStoredMock<User[]>('users', mockData.users)
  }
  try {
    const { data, error } = await supabase.from('users').select('*').order('name')
    if (error) throw error
    return data as User[]
  } catch {
    return mockData.users
  }
}

// -------------------------------------------------------------
// BOOKS API
// -------------------------------------------------------------
export async function fetchBooks(): Promise<Book[]> {
  if (useMock) {
    return getStoredMock<Book[]>('books', mockData.books)
  }
  try {
    const { data, error } = await supabase.from('books').select('*').order('title')
    if (error) throw error
    return data as Book[]
  } catch {
    return mockData.books
  }
}

export async function addBook(book: Omit<Book, 'book_id'>): Promise<Book | null> {
  if (useMock) {
    const list = getStoredMock<Book[]>('books', mockData.books)
    const newBook = { ...book, book_id: list.length + 1 }
    list.push(newBook)
    saveStoredMock('books', list)
    return newBook
  }
  try {
    const { data, error } = await supabase
      .from('books')
      .insert([book])
      .select()
      .single()
    if (error) throw error
    return data as Book
  } catch (e) {
    console.error("Add book error:", e)
    return null
  }
}

export async function updateBook(book_id: number, updates: Partial<Book>): Promise<boolean> {
  if (useMock) {
    const list = getStoredMock<Book[]>('books', mockData.books)
    const idx = list.findIndex(b => b.book_id === book_id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates }
      saveStoredMock('books', list)
      return true
    }
    return false
  }
  try {
    const { error } = await supabase
      .from('books')
      .update(updates)
      .eq('book_id', book_id)
    if (error) throw error
    return true
  } catch (e) {
    console.error("Update book error:", e)
    return false
  }
}

export async function deleteBook(book_id: number): Promise<boolean> {
  if (useMock) {
    const list = getStoredMock<Book[]>('books', mockData.books)
    const filtered = list.filter(b => b.book_id !== book_id)
    saveStoredMock('books', filtered)
    return true
  }
  try {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('book_id', book_id)
    if (error) throw error
    return true
  } catch (e) {
    console.error("Delete book error:", e)
    return false
  }
}

// -------------------------------------------------------------
// TRANSACTIONS API
// -------------------------------------------------------------
export async function fetchTransactions(): Promise<Transaction[]> {
  if (useMock) {
    const txs = getStoredMock<Transaction[]>('transactions', mockData.transactions)
    const us = getStoredMock<User[]>('users', mockData.users)
    const bs = getStoredMock<Book[]>('books', mockData.books)
    return txs.map(t => ({
      ...t,
      users: us.find(u => u.user_id === t.user_id),
      books: bs.find(b => b.book_id === t.book_id)
    }))
  }
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, users(name, username, program_strand, academic_level, phone_number), books(title, author, isbn, category, cover_image_url)')
      .order('borrow_date', { ascending: false })
    if (error) throw error
    return data as Transaction[]
  } catch {
    // Construct fake joins
    return mockData.transactions.map(t => ({
      ...t,
      users: mockData.users.find(u => u.user_id === t.user_id),
      books: mockData.books.find(b => b.book_id === t.book_id)
    }))
  }
}

export async function createTransaction(user_id: number, book_id: number, dueDays = 7): Promise<Transaction | null> {
  const borrowDate = new Date().toISOString().split('T')[0]
  const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  if (useMock) {
    const txs = getStoredMock<Transaction[]>('transactions', mockData.transactions)
    const newTx: Transaction = {
      transaction_id: txs.length + 1,
      user_id,
      book_id,
      borrow_date: borrowDate,
      due_date: dueDate,
      return_date: null,
      status: 'Requested'
    }
    txs.unshift(newTx)
    saveStoredMock('transactions', txs)

    // Update book copies and status
    const bs = getStoredMock<Book[]>('books', mockData.books)
    const book = bs.find(b => b.book_id === book_id)
    if (book) {
      const newAvail = Math.max(0, (book.available_copies ?? 1) - 1)
      const newStatus = newAvail === 0 ? 'Borrowed' : 'Available'
      await updateBook(book_id, {
        available_copies: newAvail,
        status: newStatus
      })
    }

    const us = getStoredMock<User[]>('users', mockData.users)
    return {
      ...newTx,
      users: us.find(u => u.user_id === user_id),
      books: getStoredMock<Book[]>('books', mockData.books).find(b => b.book_id === book_id)
    }
  }

  try {
    const { data: bookData } = await supabase
      .from('books')
      .select('available_copies, total_copies')
      .eq('book_id', book_id)
      .single()
    
    const currentAvail = bookData ? (bookData.available_copies ?? 1) : 1
    const newAvail = Math.max(0, currentAvail - 1)
    const newStatus = newAvail === 0 ? 'Borrowed' : 'Available'

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id,
        book_id,
        borrow_date: borrowDate,
        due_date: dueDate,
        status: 'Requested'
      }])
      .select()
      .single()

    if (error) throw error
    await supabase
      .from('books')
      .update({ available_copies: newAvail, status: newStatus })
      .eq('book_id', book_id)
    return data as Transaction
  } catch (e) {
    console.error("Create transaction error:", e)
    return null
  }
}

export async function approveTransaction(transaction_id: number): Promise<boolean> {
  if (useMock) {
    const txs = getStoredMock<Transaction[]>('transactions', mockData.transactions)
    const idx = txs.findIndex(t => t.transaction_id === transaction_id)
    if (idx !== -1) {
      txs[idx].status = 'Borrowed'
      saveStoredMock('transactions', txs)
      return true
    }
    return false
  }
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'Borrowed' })
      .eq('transaction_id', transaction_id)
    if (error) throw error
    return true
  } catch (e) {
    console.error("Approve transaction error:", e)
    return false
  }
}

export async function returnBookTransaction(transaction_id: number, book_id: number): Promise<boolean> {
  const returnDate = new Date().toISOString().split('T')[0]
  if (useMock) {
    const txs = getStoredMock<Transaction[]>('transactions', mockData.transactions)
    const idx = txs.findIndex(t => t.transaction_id === transaction_id)
    if (idx !== -1) {
      txs[idx].status = 'Returned'
      txs[idx].return_date = returnDate
      saveStoredMock('transactions', txs)
    }
    
    const bs = getStoredMock<Book[]>('books', mockData.books)
    const book = bs.find(b => b.book_id === book_id)
    if (book) {
      const newAvail = Math.min(book.total_copies ?? 1, (book.available_copies ?? 0) + 1)
      await updateBook(book_id, {
        available_copies: newAvail,
        status: 'Available'
      })
    }
    return true
  }
  try {
    const { data: bookData } = await supabase
      .from('books')
      .select('available_copies, total_copies')
      .eq('book_id', book_id)
      .single()

    const currentAvail = bookData ? (bookData.available_copies ?? 0) : 0
    const total = bookData ? (bookData.total_copies ?? 1) : 1
    const newAvail = Math.min(total, currentAvail + 1)

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'Returned', return_date: returnDate })
      .eq('transaction_id', transaction_id)
    if (error) throw error

    await supabase
      .from('books')
      .update({ available_copies: newAvail, status: 'Available' })
      .eq('book_id', book_id)
    return true
  } catch (e) {
    console.error("Return book error:", e)
    return false
  }
}

// -------------------------------------------------------------
// LIBRARY LOGS API (QR ENTRY/EXIT)
// -------------------------------------------------------------
export async function fetchLibraryLogs(): Promise<LibraryLog[]> {
  if (useMock) {
    const logs = getStoredMock<LibraryLog[]>('logs', mockData.logs)
    const us = getStoredMock<User[]>('users', mockData.users)
    return logs.map(l => ({
      ...l,
      users: us.find(u => u.user_id === l.user_id)
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
  try {
    const { data, error } = await supabase
      .from('library_logs')
      .select('*, users(name, role, program_strand)')
      .order('timestamp', { ascending: false })
    if (error) throw error
    return data as LibraryLog[]
  } catch {
    return mockData.logs.map(l => ({
      ...l,
      users: mockData.users.find(u => u.user_id === l.user_id)
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
}

export async function addLibraryLog(user_id: number, type: 'Entry' | 'Exit'): Promise<LibraryLog | null> {
  if (useMock) {
    const logs = getStoredMock<LibraryLog[]>('logs', mockData.logs)
    const newLog: LibraryLog = {
      log_id: logs.length + 1,
      user_id,
      type,
      timestamp: new Date().toISOString()
    }
    logs.unshift(newLog)
    saveStoredMock('logs', logs)
    const us = getStoredMock<User[]>('users', mockData.users)
    return {
      ...newLog,
      users: us.find(u => u.user_id === user_id)
    }
  }
  try {
    const { data, error } = await supabase
      .from('library_logs')
      .insert([{ user_id, type }])
      .select()
      .single()
    if (error) throw error
    return data as LibraryLog
  } catch (e) {
    console.error("Add library log error:", e)
    return null
  }
}

// -------------------------------------------------------------
// NOTIFICATIONS API (SMS Reminders)
// -------------------------------------------------------------
export async function fetchNotifications(): Promise<Notification[]> {
  if (useMock) {
    const notifs = getStoredMock<Notification[]>('notifications', mockData.notifications)
    const us = getStoredMock<User[]>('users', mockData.users)
    return notifs.map(n => ({
      ...n,
      users: us.find(u => u.user_id === n.user_id)
    })).sort((a, b) => new Date(b.date_sent).getTime() - new Date(a.date_sent).getTime())
  }
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, users(name)')
      .order('date_sent', { ascending: false })
    if (error) throw error
    return data as Notification[]
  } catch {
    return mockData.notifications.map(n => ({
      ...n,
      users: mockData.users.find(u => u.user_id === n.user_id)
    })).sort((a, b) => new Date(b.date_sent).getTime() - new Date(a.date_sent).getTime())
  }
}

export async function queueNotification(user_id: number, phone_number: string, message: string, type: 'Due' | 'Overdue' | 'Transaction'): Promise<Notification | null> {
  if (useMock) {
    const notifs = getStoredMock<Notification[]>('notifications', mockData.notifications)
    const newNotif: Notification = {
      notification_id: notifs.length + 1,
      user_id,
      phone_number,
      message,
      notification_type: type,
      status: 'Queued',
      date_sent: new Date().toISOString()
    }
    notifs.unshift(newNotif)
    saveStoredMock('notifications', notifs)
    const us = getStoredMock<User[]>('users', mockData.users)
    return {
      ...newNotif,
      users: us.find(u => u.user_id === user_id)
    }
  }
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id,
        phone_number,
        message,
        notification_type: type,
        status: 'Queued'
      }])
      .select()
      .single()
    if (error) throw error
    return data as Notification
  } catch (e) {
    console.error("Queue notification error:", e)
    return null
  }
}

export async function updateNotificationStatus(notification_id: number, status: 'Sent' | 'Queued'): Promise<boolean> {
  if (useMock) {
    const notifs = getStoredMock<Notification[]>('notifications', mockData.notifications)
    const idx = notifs.findIndex(n => n.notification_id === notification_id)
    if (idx !== -1) {
      notifs[idx].status = status
      saveStoredMock('notifications', notifs)
      return true
    }
    return false
  }
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ status })
      .eq('notification_id', notification_id)
    if (error) throw error
    return true
  } catch (e) {
    console.error("Update notification error:", e)
    return false
  }
}

// -------------------------------------------------------------
// USER UPDATE API
// -------------------------------------------------------------
export async function updateUser(user_id: number, updates: Partial<User>): Promise<boolean> {
  if (useMock) {
    const list = getStoredMock<User[]>('users', mockData.users)
    const idx = list.findIndex(u => u.user_id === user_id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates }
      saveStoredMock('users', list)
      return true
    }
    return false
  }
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', user_id)
    if (error) throw error
    return true
  } catch (e) {
    console.error('Update user error:', e)
    return false
  }
}

// -------------------------------------------------------------
// SUPABASE STORAGE — FILE UPLOAD HELPERS
// -------------------------------------------------------------

/**
 * Uploads a book cover image to the `books` Supabase Storage bucket.
 * Returns the public URL string on success, or null on failure.
 */
export async function uploadBookCover(file: File, isbn: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `covers/${isbn.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.${ext}`
  try {
    const { error } = await supabase.storage
      .from('books')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('books').getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.error('Upload book cover error:', e)
    return null
  }
}

/**
 * Uploads a user profile photo to the `profile` Supabase Storage bucket.
 * Returns the public URL string on success, or null on failure.
 */
export async function uploadProfilePhoto(file: File, userId: number): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `avatars/${userId}-${Date.now()}.${ext}`
  try {
    const { error } = await supabase.storage
      .from('profile')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('profile').getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.error('Upload profile photo error:', e)
    return null
  }
}

/**
 * Uploads an e-book file (PDF) to the `books` Supabase Storage bucket.
 * Returns the public URL string on success, or null on failure.
 */
export async function uploadEbookFile(file: File, isbn: string): Promise<string | null> {
  if (useMock) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }
  const ext = file.name.split('.').pop() || 'pdf'
  const path = `ebooks/${isbn.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.${ext}`
  try {
    const { error } = await supabase.storage
      .from('books')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('books').getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.error('Upload e-book file error:', e)
    return null
  }
}
