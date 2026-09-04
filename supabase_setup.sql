-- SQL Schema & Migration Script for Web-Based Library Management System (LibraSmart)
-- Matalam Polytechnic College Inc.

-- =============================================================
-- 1. MIGRATION SCRIPT FOR EXISTING DATABASE
-- (Run this section in Supabase SQL Editor if you already have tables)
-- =============================================================

-- A. Update transactions status constraint to allow 'Cancelled' status (for Reservation Cancellation)
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status::text = ANY (ARRAY['Requested'::character varying, 'Borrowed'::character varying, 'Returned'::character varying, 'Overdue'::character varying, 'Cancelled'::character varying]::text[]));

-- B. Create trash_records table for TRASH / Soft Delete feature
CREATE TABLE IF NOT EXISTS public.trash_records (
    trash_id SERIAL PRIMARY KEY,
    record_type character varying NOT NULL,
    original_id integer NOT NULL,
    title_or_name character varying NOT NULL,
    data jsonb NOT NULL,
    deleted_at timestamp with time zone DEFAULT now(),
    deleted_by character varying
);
ALTER TABLE public.trash_records DISABLE ROW LEVEL SECURITY;

-- C. Add Google Books helper columns (optional)
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS google_books_id character varying DEFAULT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS google_preview_url character varying DEFAULT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cover_image_url character varying DEFAULT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS total_copies integer DEFAULT 1;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS available_copies integer DEFAULT 1;


-- =============================================================
-- 2. FULL CLEAN SETUP (Only run this if starting from scratch)
-- =============================================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS library_logs CASCADE;
DROP TABLE IF EXISTS trash_records CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USER TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Teacher', 'Librarian', 'Administrator')),
    program_strand VARCHAR(50) DEFAULT NULL,
    academic_level VARCHAR(20) DEFAULT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BOOK TABLE
CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    program_strand_relevance VARCHAR(50) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Borrowed', 'E-book')),
    ebook_url VARCHAR(255) DEFAULT NULL,
    content TEXT DEFAULT NULL,
    cover_image_url VARCHAR(255) DEFAULT NULL,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    google_books_id VARCHAR(100) DEFAULT NULL,
    google_preview_url VARCHAR(255) DEFAULT NULL
);

-- 3. TRANSACTION TABLE
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'Borrowed' CHECK (status IN ('Requested', 'Borrowed', 'Returned', 'Overdue', 'Cancelled'))
);

-- 4. TRASH RECORDS TABLE
CREATE TABLE trash_records (
    trash_id SERIAL PRIMARY KEY,
    record_type VARCHAR(20) NOT NULL,
    original_id INT NOT NULL,
    title_or_name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT now(),
    deleted_by VARCHAR(100) DEFAULT 'Admin'
);

-- 5. LIBRARY LOGS
CREATE TABLE library_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('Entry', 'Exit')),
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 6. RECOMMENDATIONS
CREATE TABLE recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) DEFAULT 'AI' CHECK (recommendation_type IN ('AI', 'Popular', 'Similar')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. NOTIFICATIONS
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('Due', 'Overdue', 'Transaction')),
    status VARCHAR(20) DEFAULT 'Queued' CHECK (status IN ('Queued', 'Sent')),
    date_sent TIMESTAMPTZ DEFAULT now()
);

-- 8. REPORTS
CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    date_generated TIMESTAMPTZ DEFAULT now(),
    file_url VARCHAR(255) DEFAULT NULL
);

-- DISABLE ROW LEVEL SECURITY FOR ALL TABLES FOR DEMO / PUBLIC ANON API
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE trash_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE library_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
