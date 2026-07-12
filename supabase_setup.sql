-- SQL Schema for Web-Based Library Management System (LibraSmart)
-- Matalam Polytechnic College Inc.
-- Copy and paste this directly into your Supabase SQL Editor.

-- Drop existing tables if they exist to start fresh (in reverse order of dependencies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS library_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USER TABLE (Custom authentication, no Supabase Auth)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stored as simple plaintext/hashed for client checking
    role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Teacher', 'Librarian', 'Administrator')),
    program_strand VARCHAR(50) DEFAULT NULL, -- e.g., 'BSIT', 'BSA', 'Grade 11 - STEM'
    academic_level VARCHAR(20) DEFAULT NULL, -- e.g., '1st Year', '2nd Year', 'Grade 11'
    phone_number VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BOOK TABLE
CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    program_strand_relevance VARCHAR(50) DEFAULT NULL, -- To help AI recommendations (e.g. BSIT)
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Borrowed', 'E-book')),
    ebook_url VARCHAR(255) DEFAULT NULL,
    content TEXT DEFAULT NULL -- Content of the E-Book (simulated chapters / excerpts)
);

-- 3. TRANSACTION TABLE (Borrowing and Returning)
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'Borrowed' CHECK (status IN ('Requested', 'Borrowed', 'Returned', 'Overdue'))
);

-- 4. LIBRARY LOGS (QR Entry/Exit gate tracking)
CREATE TABLE library_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('Entry', 'Exit')),
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 5. RECOMMENDATION TABLE (AI / Popular / Similar suggestions)
CREATE TABLE recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) DEFAULT 'AI' CHECK (recommendation_type IN ('AI', 'Popular', 'Similar')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. NOTIFICATION TABLE (SMS Queue)
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('Due', 'Overdue', 'Transaction')),
    status VARCHAR(20) DEFAULT 'Queued' CHECK (status IN ('Queued', 'Sent')),
    date_sent TIMESTAMPTZ DEFAULT now()
);

-- 7. REPORT TABLE (Generated report records)
CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    date_generated TIMESTAMPTZ DEFAULT now(),
    file_url VARCHAR(255) DEFAULT NULL
);

-- ENABLE ROW LEVEL SECURITY BYPASS OR BYPASS WITH DEFAULTS FOR DEMO
-- Because we are connecting via client with Anon Key, let's enable full access to these tables.
-- Alternatively, in Supabase, you can turn off RLS for these tables or add public policies.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE library_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- INITIAL SEEDING DATA

-- Seed Users (Default logins)
-- Password for all is 'password123'
INSERT INTO users (name, username, password, role, program_strand, academic_level, phone_number) VALUES
('Marlon G. Tagamolila', 'marlon', 'password123', 'Student', 'BSIT', '4th Year', '+639123456789'),
('Ryan Jay A. Ferenal', 'ryanjay', 'password123', 'Student', 'BSIT', '4th Year', '+639234567890'),
('Ms. Jane Doe', 'librarian', 'password123', 'Librarian', NULL, NULL, '+639345678901'),
('Principal Administrator', 'admin', 'password123', 'Administrator', NULL, NULL, '+639456789012'),
('Prof. John Smith', 'johnsmith', 'password123', 'Teacher', 'BSIT', 'Faculty', '+639567890123'),
('Hannah Cruz', 'hannah', 'password123', 'Student', 'BSA', '2nd Year', '+639678901234');

-- Seed Books
INSERT INTO books (title, author, isbn, category, program_strand_relevance, status, ebook_url, content) VALUES
('Introduction to Information Technology', 'E. Turban', '978-047-134', 'Information Technology', 'BSIT', 'Available', NULL, NULL),
('Applied Database Management Systems', 'W. Fadhilah', '978-602-211', 'Database', 'BSIT', 'E-book', 'https://example.com/books/applied-db.pdf', 'Chapter 1: Database System Concepts\n\nA database-management system (DBMS) is a collection of interrelated data and a set of programs to access those data. This collection of data, usually referred to as the database, contains information relevant to an enterprise. The primary goal of a DBMS is to provide a way to store and retrieve database information that is both convenient and efficient.\n\nChapter 2: Relational Model\n\nThe relational model is today the primary data model for commercial data processing applications. It has achieved this position because of its simplicity and ease of database design. A relational database consists of a collection of tables, each of which is assigned a unique name. Each table has a structure similar to that of a spreadsheet.\n\nChapter 3: SQL Structure Query Language\n\nStructured Query Language (SQL) is the most widely used relational database query language. It is designed to query, update, and manage relational databases.'),
('Research Methods in Computing', 'M. Kumari', '978-621-104', 'Research', 'BSIT', 'Available', NULL, NULL),
('Web Systems Design & Development', 'A. Boranbayev', '978-013-482', 'Information Technology', 'BSIT', 'Available', NULL, NULL),
('Digital Library Operations', 'A. Zainab', '978-971-551', 'Library Science', 'General', 'Available', NULL, NULL),
('Advanced Accounting Volume 1', 'C. Guerrero', '978-971-042', 'Accounting', 'BSA', 'E-book', 'https://example.com/books/adv-accounting.pdf', 'Chapter 1: Partnership Formation\n\nA partnership is an association of two or more persons to carry on as co-owners of a business for profit. The agreement between the partners is called the Articles of Partnership. When a partnership is formed, partners contribute assets and/or liabilities to the business.\n\nChapter 2: Partnership Operations\n\nThe operations of a partnership are shared between partners according to their profit and loss agreement. This allocation can be based on a fixed ratio, capital balances, or salaries and interest allowance.'),
('Network Fundamentals (CCNA)', 'M. Dye', '978-158-713', 'Networking', 'BSIT', 'Available', NULL, NULL);

-- Seed Transactions
INSERT INTO transactions (user_id, book_id, borrow_date, due_date, return_date, status) VALUES
(1, 3, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', NULL, 'Overdue'),
(2, 4, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days', NULL, 'Borrowed'),
(6, 5, CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'Returned'),
(1, 1, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '6 days', NULL, 'Borrowed');

-- Seed Library Logs
INSERT INTO library_logs (user_id, type, timestamp) VALUES
(1, 'Entry', now() - INTERVAL '4 hours'),
(2, 'Entry', now() - INTERVAL '3 hours'),
(1, 'Exit', now() - INTERVAL '2 hours');

-- Seed Notifications
INSERT INTO notifications (user_id, phone_number, message, notification_type, status, date_sent) VALUES
(1, '+639123456789', 'LibraSmart Alert: The book "Research Methods in Computing" was borrowed by you and is now OVERDUE. Please return it to avoid penalty.', 'Overdue', 'Sent', now() - INTERVAL '1 day'),
(2, '+639234567890', 'LibraSmart Alert: You have borrowed "Web Systems Design & Development". Please monitor your due date in LibraSmart.', 'Transaction', 'Sent', now() - INTERVAL '5 days');

-- Seed Recommendations
INSERT INTO recommendations (user_id, book_id, recommendation_type) VALUES
(1, 2, 'AI'),
(2, 7, 'Similar'),
(6, 6, 'Popular');

-- Seed Generated Report Records
INSERT INTO reports (user_id, report_type, file_url) VALUES
(4, 'Book Inventory Masterlist', NULL),
(3, 'Borrowed Books and Transactions', NULL),
(3, 'Overdue Books and SMS Follow-up', NULL);
