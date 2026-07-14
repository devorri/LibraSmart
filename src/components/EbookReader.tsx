import { useEffect, useRef, useState } from 'react'
import type { Book } from '../lib/supabase'
import { X, Type, Sun, Moon, Compass, ChevronLeft, ChevronRight, FileText, ExternalLink } from 'lucide-react'

interface EbookReaderProps {
  book: Book
  onClose: () => void
}

declare global {
  interface Window {
    google?: {
      books?: {
        load: (options?: { language?: string }) => void
        setOnLoadCallback: (callback: () => void) => void
        DefaultViewer: new (container: HTMLElement) => {
          load: (identifier: string, notFoundCallback?: () => void, successCallback?: () => void) => void
        }
      }
    }
  }
}

let googleBooksScriptPromise: Promise<void> | null = null

const loadGoogleBooksScript = () => {
  if (window.google?.books) return Promise.resolve()
  if (googleBooksScriptPromise) return googleBooksScriptPromise

  googleBooksScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.google.com/books/jsapi.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google Books viewer failed to load.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.google.com/books/jsapi.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Books viewer failed to load.'))
    document.head.appendChild(script)
  })

  return googleBooksScriptPromise
}

export function EbookReader({ book, onClose }: EbookReaderProps) {
  const [theme, setTheme] = useState<'paper' | 'dark' | 'clean'>('paper')
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif')
  const [currentPage, setCurrentPage] = useState(1)
  const [googleViewerState, setGoogleViewerState] = useState<{
    identifier: string | null
    status: 'ready' | 'error'
  }>({ identifier: null, status: 'ready' })
  const googleViewerRef = useRef<HTMLDivElement>(null)

  const googleBooksIdentifier = book.ebook_url?.startsWith('google-books:')
    ? book.ebook_url.replace('google-books:', '')
    : book.google_books_id || null
  const isGoogleBooksPreview = !!googleBooksIdentifier
  const googleViewerStatus = isGoogleBooksPreview && googleViewerState.identifier !== googleBooksIdentifier
    ? 'loading'
    : googleViewerState.status

  const isPDF = !!(
    book.ebook_url && (
      book.ebook_url.toLowerCase().endsWith('.pdf') ||
      book.ebook_url.includes('/storage/v1/object/public/books/ebooks/') ||
      book.ebook_url.startsWith('data:application/pdf')
    )
  )

  useEffect(() => {
    if (!isGoogleBooksPreview || !googleBooksIdentifier) return

    let cancelled = false

    loadGoogleBooksScript()
      .then(() => {
        if (cancelled || !window.google?.books) return

        window.google.books.load()
        window.google.books.setOnLoadCallback(() => {
          if (cancelled || !googleViewerRef.current || !window.google?.books) return

          const viewer = new window.google.books.DefaultViewer(googleViewerRef.current)
          viewer.load(
            googleBooksIdentifier,
            () => {
              if (!cancelled) setGoogleViewerState({ identifier: googleBooksIdentifier, status: 'error' })
            },
            () => {
              if (!cancelled) setGoogleViewerState({ identifier: googleBooksIdentifier, status: 'ready' })
            }
          )
        })
      })
      .catch(() => {
        if (!cancelled) setGoogleViewerState({ identifier: googleBooksIdentifier, status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [googleBooksIdentifier, isGoogleBooksPreview])

  // Default content fallback in case book text is blank
  const defaultEbookContent = `Chapter 1: Foundations of the Discipline

Welcome to the digital edition of ${book.title}. This academic volume serves as a core textbook for students in Matalam Polytechnic College Inc. studying ${book.category} and related fields. 

In this chapter, we outline the fundamental theories, historical milestones, and practical frameworks that define this area of study. Understanding these concepts forms the base upon which all advanced knowledge and practical designs are built.

Chapter 2: Structural Methodologies and Frameworks

Section 2.1: Key Principles
Success in modern applications relies on adhering to core methodologies. These include structured analysis, modular construction, robust error prevention, and clean data lifecycle administration. 

Section 2.2: Implementations
When building systems, theoretical structures must be translated into active services. In the next section, we walk through how librarians, administrators, and students collaborate within a shared virtual space.

Chapter 3: Future Directions and Summary

The future of academic systems lies in the convergence of automated artificial intelligence, instant communications (like SMS notifications), digital books (E-Books), and unified metrics. 

By integrating these features, modern educational resources become interactive hubs that optimize resource allocation, prevent data loss, and support dynamic learning behavior.`

  const rawContent = book.content || defaultEbookContent
  
  // Split raw content by double newlines to render as readable paragraphs
  const paragraphs = rawContent.split('\n\n').filter(p => p.trim() !== '')

  // Group paragraphs into "pages" (approx 3 paragraphs per page for clean layout)
  const paragraphsPerPage = 2
  const totalPages = Math.ceil(paragraphs.length / paragraphsPerPage)
  const paginatedParagraphs = paragraphs.slice((currentPage - 1) * paragraphsPerPage, currentPage * paragraphsPerPage)

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  return (
    <div className={`ebook-reader-overlay theme-${theme}`}>
      <div className="ebook-reader-container">
        
        {/* Top Control Bar */}
        <header className="reader-header">
          <div className="reader-info">
            <FileText size={20} className="reader-icon" />
            <div>
              <h3>{book.title}</h3>
              <p className="author-tag">By {book.author} • {book.category}</p>
            </div>
          </div>
          
          <div className="reader-settings">
            {/* Font Family controls */}
            <div className="settings-group font-picker" title="Font Family">
              <button 
                className={fontFamily === 'serif' ? 'active' : ''} 
                onClick={() => setFontFamily('serif')}
              >
                Serif
              </button>
              <button 
                className={fontFamily === 'sans' ? 'active' : ''} 
                onClick={() => setFontFamily('sans')}
              >
                Sans
              </button>
              <button 
                className={fontFamily === 'mono' ? 'active' : ''} 
                onClick={() => setFontFamily('mono')}
              >
                Mono
              </button>
            </div>

            {/* Font Size controls */}
            <div className="settings-group" title="Text Size">
              <button onClick={() => setFontSize('sm')} className={fontSize === 'sm' ? 'active' : ''}>
                <Type size={14} />
              </button>
              <button onClick={() => setFontSize('md')} className={fontSize === 'md' ? 'active' : ''}>
                <Type size={18} />
              </button>
              <button onClick={() => setFontSize('lg')} className={fontSize === 'lg' ? 'active' : ''}>
                <Type size={22} />
              </button>
            </div>

            {/* Theme controls */}
            <div className="settings-group" title="Theme Color">
              <button 
                onClick={() => setTheme('paper')} 
                className={`theme-btn btn-theme-paper ${theme === 'paper' ? 'active' : ''}`}
              >
                <Compass size={16} />
              </button>
              <button 
                onClick={() => setTheme('clean')} 
                className={`theme-btn btn-theme-clean ${theme === 'clean' ? 'active' : ''}`}
              >
                <Sun size={16} />
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`theme-btn btn-theme-dark ${theme === 'dark' ? 'active' : ''}`}
              >
                <Moon size={16} />
              </button>
            </div>

            <button className="reader-close-btn" onClick={onClose} title="Exit Reader">
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Content Pane */}
        {isGoogleBooksPreview ? (
          <main className="reader-content google-books-reader-mode">
            {googleViewerStatus === 'loading' && (
              <div className="google-books-reader-status">
                <FileText size={28} />
                <span>Loading Google Books preview...</span>
              </div>
            )}
            {googleViewerStatus === 'error' && (
              <div className="google-books-reader-status">
                <FileText size={28} />
                <span>Google Books cannot embed this preview here.</span>
                {book.google_preview_url && (
                  <a href={book.google_preview_url} target="_blank" rel="noreferrer" className="external-link-btn">
                    <ExternalLink size={14} />
                    Open on Google Books
                  </a>
                )}
              </div>
            )}
            <div ref={googleViewerRef} className="google-books-viewer" />
          </main>
        ) : isPDF ? (
          <main className="reader-content pdf-reader-mode" style={{ padding: 0, height: 'calc(100vh - 70px)' }}>
            <iframe
              src={book.ebook_url || ''}
              title={book.title}
              width="100%"
              height="100%"
              style={{ border: 'none', background: '#ffffff' }}
            />
          </main>
        ) : (
          <>
            <main className={`reader-content font-${fontFamily} size-${fontSize}`}>
              <div className="content-container">
                {paginatedParagraphs.map((para, index) => {
                  // Highlight headers (e.g. Chapter 1, Section 1.1)
                  const isHeader = para.trim().startsWith('Chapter') || para.trim().startsWith('Section')
                  return isHeader ? (
                    <h4 key={index} className="reader-chapter-title">{para}</h4>
                  ) : (
                    <p key={index} className="reader-paragraph">{para}</p>
                  )
                })}
              </div>
            </main>

            {/* Page Footer Navigation */}
            <footer className="reader-footer">
              <button 
                className="footer-nav-btn" 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} /> Previous
              </button>
              
              <div className="reader-progress">
                <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                <div className="progress-bar-track">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${(currentPage / totalPages) * 100}%` }}
                  ></div>
                </div>
              </div>

              <button 
                className="footer-nav-btn" 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={20} />
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
