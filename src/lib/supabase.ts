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
  google_books_id?: string | null
  google_preview_url?: string | null
}

export interface Transaction {
  transaction_id: number
  user_id: number
  book_id: number
  borrow_date: string
  due_date: string
  return_date: string | null
  status: 'Requested' | 'Borrowed' | 'Returned' | 'Overdue' | 'Cancelled'
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

export interface TrashRecord {
  trash_id: number
  record_type: 'Book' | 'User'
  original_id: number
  title_or_name: string
  data: any
  deleted_at: string
  deleted_by?: string
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
export async function authenticateUser(username: string, rawPassword: string): Promise<User | null> {
  const hashed = await hashPassword(rawPassword)
  if (useMock) {
    const list = getStoredMock<User[]>('users', mockData.users)
    const found = list.find(u =>
      u.username.toLowerCase() === username.toLowerCase() &&
      (u.password === hashed || u.password === rawPassword || !u.password)
    )
    return found || null
  }
  try {
    let { data } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', hashed)
      .maybeSingle()

    if (!data) {
      const { data: rawMatch } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', rawPassword)
        .maybeSingle()
      
      if (rawMatch) {
        data = rawMatch
        await supabase.from('users').update({ password: hashed }).eq('user_id', data.user_id)
      }
    }

    return data as User | null
  } catch {
    return null
  }
}

export async function registerUser(user: Omit<User, 'user_id'>): Promise<User | null> {
  const hashedPassword = user.password ? await hashPassword(user.password) : undefined
  const userWithHash = { ...user, password: hashedPassword }

  if (useMock) {
    const list = getStoredMock<User[]>('users', mockData.users)
    const newUser = { ...userWithHash, user_id: list.length + 1 }
    list.push(newUser)
    saveStoredMock('users', list)
    return newUser
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userWithHash])
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

export async function createTransaction(user_id: number, book_id: number, status: 'Requested' | 'Borrowed' = 'Requested', dueDays = 7): Promise<Transaction | null> {
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
      status
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
        status
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
      user_id: user_id > 0 ? user_id : 1,
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
      users: us.find(u => u.user_id === newNotif.user_id)
    }
  }
  try {
    let targetUserId = user_id
    if (targetUserId <= 0) {
      const { data: firstUser } = await supabase.from('users').select('user_id').limit(1).maybeSingle()
      if (firstUser) {
        targetUserId = firstUser.user_id
      } else {
        return null
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: targetUserId,
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
  if (useMock) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }
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
  if (useMock) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }
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

// -------------------------------------------------------------
// PASSWORD & AUTH UTILITIES
// -------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  if (!password) return ''
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Semaphore SMS API Integration (Sender: TranslertPH)
export async function sendSMSViaSemaphore(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const apiKey = 'f18fe7eb9f2f4b5477776b98d8b55565'
    const formattedNumber = phoneNumber.replace(/[^0-9+]/g, '')
    
    // Prefix message body with [LibraSmart Library Desk] so recipients know it comes from LibraSmart even though sender ID is TranslertPH
    let finalMessage = message
    if (!finalMessage.includes('LibraSmart') && !finalMessage.includes('Libra Smart')) {
      finalMessage = `[LibraSmart Library Desk] ${finalMessage}`
    }

    const params = new URLSearchParams()
    params.append('apikey', apiKey)
    params.append('number', formattedNumber)
    params.append('message', finalMessage)
    params.append('sendername', 'TranslertPH')

    // Endpoints array: Vite proxy first, then CORS proxy fallbacks, then direct endpoint
    const endpoints = [
      '/api/semaphore/messages',
      'https://corsproxy.io/?' + encodeURIComponent('https://api.semaphore.co/api/v4/messages'),
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.semaphore.co/api/v4/messages'),
      'https://api.semaphore.co/api/v4/messages'
    ]

    let lastError: any = null
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })
        if (res.ok) {
          const data = await res.json()
          console.log('Semaphore SMS response (TranslertPH):', data)
          return true
        }
      } catch (err) {
        lastError = err
      }
    }

    console.error('Failed to send SMS via Semaphore (all endpoints failed):', lastError)
    return false
  } catch (err) {
    console.error('Failed to send SMS via Semaphore:', err)
    return false
  }
}

// -------------------------------------------------------------
// CANCEL TRANSACTION API
// -------------------------------------------------------------
export async function cancelTransaction(transaction_id: number, book_id?: number): Promise<boolean> {
  if (useMock) {
    const txs = getStoredMock<Transaction[]>('transactions', mockData.transactions)
    const idx = txs.findIndex(t => t.transaction_id === transaction_id)
    if (idx !== -1) {
      const targetBookId = book_id || txs[idx].book_id
      txs[idx].status = 'Cancelled'
      saveStoredMock('transactions', txs)

      if (targetBookId) {
        const bs = getStoredMock<Book[]>('books', mockData.books)
        const book = bs.find(b => b.book_id === targetBookId)
        if (book) {
          const newAvail = Math.min(book.total_copies ?? 1, (book.available_copies ?? 0) + 1)
          await updateBook(targetBookId, {
            available_copies: newAvail,
            status: 'Available'
          })
        }
      }
      return true
    }
    return false
  }
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'Cancelled' })
      .eq('transaction_id', transaction_id)
    if (error) throw error

    if (book_id) {
      const { data: bookData } = await supabase
        .from('books')
        .select('available_copies, total_copies')
        .eq('book_id', book_id)
        .single()
      if (bookData) {
        const currentAvail = bookData.available_copies ?? 0
        const total = bookData.total_copies ?? 1
        const newAvail = Math.min(total, currentAvail + 1)
        await supabase
          .from('books')
          .update({ available_copies: newAvail, status: 'Available' })
          .eq('book_id', book_id)
      }
    }
    return true
  } catch (e) {
    console.error('Cancel transaction error:', e)
    return false
  }
}

// -------------------------------------------------------------
// TRASH / SOFT DELETE API
// -------------------------------------------------------------
const getStoredTrash = (): TrashRecord[] => {
  const data = localStorage.getItem('librasmart_mock_trash')
  return data ? JSON.parse(data) : []
}

const saveStoredTrash = (trash: TrashRecord[]) => {
  localStorage.setItem('librasmart_mock_trash', JSON.stringify(trash))
}

export async function fetchTrash(): Promise<TrashRecord[]> {
  const localTrash = getStoredTrash()
  if (useMock) {
    return localTrash
  }
  try {
    const { data, error } = await supabase.from('trash_records').select('*').order('deleted_at', { ascending: false })
    if (error) throw error
    const remoteTrash = (data as TrashRecord[]) || []
    const combined = [...remoteTrash]
    for (const item of localTrash) {
      if (!combined.some(r => r.trash_id === item.trash_id || (r.original_id === item.original_id && r.record_type === item.record_type))) {
        combined.push(item)
      }
    }
    return combined
  } catch (err) {
    console.warn('Fetch trash from database error, fallback to local:', err)
    return localTrash
  }
}

export async function softDeleteBook(book: Book, deleted_by?: string): Promise<boolean> {
  const payload = {
    record_type: 'Book',
    original_id: book.book_id,
    title_or_name: book.title,
    data: book,
    deleted_at: new Date().toISOString(),
    deleted_by: deleted_by || 'Admin'
  }

  // Remove book from local storage mock
  deleteBook(book.book_id)

  const localItem: TrashRecord = {
    trash_id: Date.now(),
    record_type: 'Book',
    original_id: book.book_id,
    title_or_name: book.title,
    data: book,
    deleted_at: payload.deleted_at,
    deleted_by: payload.deleted_by
  }

  if (useMock) {
    const trash = getStoredTrash()
    trash.unshift(localItem)
    saveStoredTrash(trash)
    return true
  }

  try {
    // 1. Save to Supabase trash_records (omitting trash_id so PostgreSQL SERIAL auto-increments)
    const { error: insertErr } = await supabase.from('trash_records').insert([payload])
    if (insertErr) console.warn('Database insert to trash_records error:', insertErr)

    // 2. Clean up referencing transactions to satisfy foreign key constraint transactions_book_id_fkey
    await supabase.from('transactions').delete().eq('book_id', book.book_id)

    // 3. Delete book record from books table
    const { error: deleteErr } = await supabase.from('books').delete().eq('book_id', book.book_id)
    if (deleteErr) console.warn('Database delete book error:', deleteErr)

    return true
  } catch (e) {
    console.error('Soft delete book error:', e)
    const trash = getStoredTrash()
    trash.unshift(localItem)
    saveStoredTrash(trash)
    return true
  }
}

export async function softDeleteUser(user: User, deleted_by?: string): Promise<boolean> {
  const payload = {
    record_type: 'User',
    original_id: user.user_id,
    title_or_name: `${user.name} (${user.username})`,
    data: user,
    deleted_at: new Date().toISOString(),
    deleted_by: deleted_by || 'Admin'
  }

  const localItem: TrashRecord = {
    trash_id: Date.now(),
    record_type: 'User',
    original_id: user.user_id,
    title_or_name: payload.title_or_name,
    data: user,
    deleted_at: payload.deleted_at,
    deleted_by: payload.deleted_by
  }

  if (useMock) {
    const users = getStoredMock<User[]>('users', mockData.users)
    const filtered = users.filter(u => u.user_id !== user.user_id)
    saveStoredMock('users', filtered)
    const trash = getStoredTrash()
    trash.unshift(localItem)
    saveStoredTrash(trash)
    return true
  }

  try {
    // 1. Save to Supabase trash_records
    const { error: insertErr } = await supabase.from('trash_records').insert([payload])
    if (insertErr) console.warn('Database insert to trash_records error:', insertErr)

    // 2. Clean up dependent rows in transactions, library_logs, notifications to satisfy foreign key constraints
    await supabase.from('transactions').delete().eq('user_id', user.user_id)
    await supabase.from('library_logs').delete().eq('user_id', user.user_id)
    await supabase.from('notifications').delete().eq('user_id', user.user_id)

    // 3. Delete user record from users table
    const { error: deleteErr } = await supabase.from('users').delete().eq('user_id', user.user_id)
    if (deleteErr) console.warn('Database delete user error:', deleteErr)

    return true
  } catch (e) {
    console.error('Soft delete user error:', e)
    const trash = getStoredTrash()
    trash.unshift(localItem)
    saveStoredTrash(trash)
    return true
  }
}

export async function restoreFromTrash(trashRecord: TrashRecord): Promise<boolean> {
  if (trashRecord.record_type === 'Book') {
    const book = trashRecord.data as Book
    await addBook(book)
  } else if (trashRecord.record_type === 'User') {
    const user = trashRecord.data as User
    const users = getStoredMock<User[]>('users', mockData.users)
    if (!users.some(u => u.user_id === user.user_id)) {
      users.push(user)
      saveStoredMock('users', users)
    }
    if (!useMock) {
      try {
        await supabase.from('users').insert([{
          name: user.name,
          username: user.username,
          password: user.password,
          role: user.role,
          program_strand: user.program_strand,
          academic_level: user.academic_level,
          phone_number: user.phone_number,
          avatar_url: user.avatar_url
        }])
      } catch (e) {
        console.warn('Database restore user warning:', e)
      }
    }
  }

  // Remove from local storage
  const trash = getStoredTrash().filter(t => t.trash_id !== trashRecord.trash_id)
  saveStoredTrash(trash)

  if (!useMock) {
    try {
      await supabase.from('trash_records').delete().eq('trash_id', trashRecord.trash_id)
    } catch (e) {
      console.warn('Delete from trash_records table warning:', e)
    }
  }
  return true
}

export async function permanentlyDeleteFromTrash(trash_id: number): Promise<boolean> {
  const trash = getStoredTrash().filter(t => t.trash_id !== trash_id)
  saveStoredTrash(trash)

  if (!useMock) {
    try {
      await supabase.from('trash_records').delete().eq('trash_id', trash_id)
    } catch (e) {
      console.error('Permanent delete from trash error:', e)
    }
  }
  return true
}
