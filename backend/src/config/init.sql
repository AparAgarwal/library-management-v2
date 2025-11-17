-- Database Schema for Library Management System

-- Enable pgcrypto for secure password hashing (bcrypt via crypt())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create ENUM types (idempotent)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('MEMBER', 'LIBRARIAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE book_item_status AS ENUM ('AVAILABLE', 'CHECKED_OUT', 'RESERVED', 'LOST', 'DAMAGED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('PENDING', 'FULFILLED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'MEMBER',
    phone VARCHAR(20),
    address TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table (catalog information)
CREATE TABLE IF NOT EXISTS books (
    book_id SERIAL PRIMARY KEY,
    isbn VARCHAR(13) UNIQUE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    publication_year INTEGER,
    description TEXT,
    cover_url TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Items table (physical copies)
CREATE TABLE IF NOT EXISTS book_items (
    book_item_id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    status book_item_status DEFAULT 'AVAILABLE',
    location VARCHAR(100),
    acquired_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (checkouts)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_item_id INTEGER NOT NULL REFERENCES book_items(book_item_id) ON DELETE CASCADE,
    checkout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    return_date TIMESTAMP,
    status transaction_status DEFAULT 'ACTIVE',
    renewed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fines table
CREATE TABLE IF NOT EXISTS fines (
    fine_id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    status reservation_status DEFAULT 'PENDING',
    reserved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_date TIMESTAMP,
    cancelled_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Requests table (for borrow requests)
CREATE TABLE IF NOT EXISTS book_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    book_item_id INTEGER REFERENCES book_items(book_item_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_book_items_barcode ON book_items(barcode);
CREATE INDEX IF NOT EXISTS idx_book_items_status ON book_items(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_fines_user ON fines(user_id);
CREATE INDEX IF NOT EXISTS idx_fines_paid ON fines(paid);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_book_requests_user ON book_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_status ON book_requests(status);

-- Text search optimization
-- Enable trigram extension for ILIKE acceleration
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for case-insensitive search patterns
-- Books title/author/isbn
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON books USING gin (author gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_isbn_trgm ON books USING gin (isbn gin_trgm_ops);

-- Users email and full name search (concatenated)
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_fullname_trgm ON users USING gin ((lower(first_name || ' ' || last_name)) gin_trgm_ops);

-- Insert a default librarian user (password: admin123)
-- Insert or update default librarian user with a bcrypt-hashed password.
-- Password will be 'admin123' by default; hashed via crypt() using the Blowfish (bf) algorithm.
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES (
    'admin@library.com',
    crypt('admin123', gen_salt('bf', 10)),
    'Admin',
    'Librarian',
    'LIBRARIAN'
)
ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
            updated_at = NOW();
