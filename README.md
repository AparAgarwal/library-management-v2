# 📚 Library Management System

A full-stack library management system built with React, Node.js, and PostgreSQL. The entire application stack is containerized using Docker for easy development and deployment.

---

## 🚀 Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React.js | UI for both members and librarians. |
| **Backend** | Node.js + Express.js | REST API for all system logic. |
| **Database** | PostgreSQL | Main database for all data (users, books, transactions). |
| **Authentication** | JWT (JSON Web Tokens) | Manages user login sessions. |
| **Caching** | Redis | Caches database queries & API calls for performance. |
| **Containerization**| Docker / Docker Compose | Manages all services (Postgres, Redis, Backend, Frontend). |

---

## ✨ Core Features

* **User Roles:** Member and Librarian (Admin).
* **Authentication:** Secure login/registration for all users.
* **Catalog Management:** Searchable/filterable catalog of all books.
* **Circulation:** The core workflow for librarians to issue, return, and renew books.
* **Member Portal:** Members can see their checked-out books, history, and pending fines.
* **Fine Management:** Automatic calculation of fines for overdue books.
* **Reservations:** Members can reserve a book that is currently checked out.

---

## 📂 Project Structure

    /library-system
    ├── docker-compose.yml     # Defines all our services
    ├── /backend
    │   ├── Dockerfile
    │   ├── package.json
    │   └── /src
    │       ├── /config        # DB connection, .env
    │       ├── /controllers   # Request/Response logic
    │       ├── /models        # Database table models
    │       ├── /routes        # API routes (e.g., books.js, users.js)
    │       ├── /middleware    # auth.js (JWT verification)
    │       └── server.js      # Main Express server
    │
    └── /frontend
        ├── Dockerfile
        ├── package.json
        └── /src
            ├── /components    # Reusable components (Navbar, BookCard)
            ├── /pages         # Top-level pages (Home, Login, Dashboard)
            ├── /services      # API-calling functions (api.js)
            ├── /hooks         # Custom hooks (useAuth)
            └── App.js


# 🗺️ Library Management Project Plan

This file breaks down the entire project into actionable milestones and tasks.

## Milestone 1: Setup & Core Backend ("The Plumbing") ✅

**Goal:** Get all services running and communicating with each other via Docker.

* [x] **Task 1.1: Project Init**
    * Create the main `library-system` directory.
    * Initialize `git` (`git init`).
    * Create `backend` and `frontend` sub-directories.
* [x] **Task 1.2: Dockerize! (The `docker-compose.yml`)**
    * Create the `docker-compose.yml` file in the root.
    * Define **four** services:
        1.  `postgres`: The database service.
        2.  `redis`: The caching service.
        3.  `backend`: The Node.js API (builds from `/backend/Dockerfile`).
        4.  `frontend`: The React App (builds from `/frontend/Dockerfile`).
* [x] **Task 1.3: Define Database Schema**
    * Create a file `DATABASE.md` (or `schema.sql`).
    * Define the tables: `Users`, `Books`, `Book_Items` (the physical copies), `Transactions`, `Fines`.
    * **Crucial:** Clearly define the **Foreign Keys** and **Enums** (e.g., `role: ['MEMBER', 'LIBRARIAN']`, `status: ['AVAILABLE', 'CHECKED_OUT']`).
* [x] **Task 1.4: Setup Node/Express Server**
    * `npm init` inside the `/backend` folder.
    * Install `express`, `pg` (for Postgres), `dotenv`.
    * Create `server.js` and a simple `/api/health` route.
    * Create a `db.js` file that connects to the Postgres service using environment variables (e.g., `PG_HOST=postgres`).
* [x] **Task 1.5: Test the Stack**
    * Run `docker-compose up --build`.
    * Verify you can hit `http://localhost:5000/api/health` (or your chosen port) and see a success message.
    * Verify the Node app successfully logs "Connected to PostgreSQL."


## Milestone 2: Database Population & Book Catalog ✅

**Goal:** Get book data from an external API and build the public-facing catalog API.

* [x] **Task 2.1: Research Book APIs**
    * (You've already done this!) Decide on **Open Library API**.
* [x] **Task 2.2: Write a "Seeder" Script**
    * Create a `seed.js` file in `/backend`.
    * Create a list of 20-30 sample ISBNs.
    * Install `axios` (to make HTTP requests).
    * Write a script that loops through the ISBNs, calls the Open Library API for each, formats the data (title, author, cover_url, description), and **inserts it** into your `Books` table.
    * Add a script to `package.json`: `"seed": "node src/seed.js"`.
    * Run it *once* to populate your DB: `docker-compose exec backend npm run seed`.
* [x] **Task 2.3: Build Catalog API Endpoints**
    * Create `/routes/books.js`.
    * `GET /api/books`: Get all books (with pagination: `?page=1&limit=10`).
    * `GET /api/books/:id`: Get details for a *single* book.
    * `GET /api/books/search`: Search for books (e.g., `?q=dune`).
* [x] **Task 2.4: (Optional) Implement Caching**
    * Install `ioredis`.
    * In your `GET /api/books` route, first check Redis for a cached result.
    * If not in cache, query Postgres, save the result to Redis, and then send the response.


## Milestone 3: User Authentication & Profiles ✅

**Goal:** Allow users to register and log in securely.

* [x] **Task 3.1: Implement User Model & Table**
    * Your `Users` table should have `email`, `password_hash` (use `bcrypt`), and `role` (default 'MEMBER').
* [x] **Task 3.2: Build Auth Endpoints**
    * Install `jsonwebtoken` (JWT) and `bcryptjs`.
    * `POST /api/auth/register`: Hash the password (bcrypt), save the user, return a JWT.
    * `POST /api/auth/login`: Find the user, compare the password (bcrypt), return a JWT.
* [x] **Task 3.3: Implement Auth Middleware**
    * Create `/middleware/auth.js`.
    * This function checks for a valid `Authorization: Bearer <token>` header.
    * It verifies the JWT and attaches the user's data (e.g., `req.user`) to the request object.
* [x] **Task 3.4: Create Protected Routes**
    * `GET /api/users/me`: A route that uses your `auth` middleware to return the profile of the *currently logged-in user*. This tests your middleware.
    * Apply the middleware to all routes that require a user to be logged in.


## Milestone 4: The Frontend (React App) ✅

**Goal:** Build the user interface that consumes your API.

* [x] **Task 4.1: Setup React**
    * `npx create-react-app frontend` (or use Vite: `npm create vite@latest frontend -- --template react`).
    * Install `axios` (for API calls) and `react-router-dom`.
* [x] **Task 4.2: Build Core Components**
    * `<Navbar />`: Main navigation.
    * `<BookCard />`: Displays a single book's cover and title.
    * `<SearchBar />`: The search input.
* [x] **Task 4.3: Build Pages**
    * `HomePage.js`: Shows the search bar and a list of books (fetches from `GET /api/books`).
    * `BookDetailPage.js`: Shows details for one book (fetches from `GET /api/books/:id`).
    * `LoginPage.js`: A form that calls `POST /api/auth/login`.
    * `RegisterPage.js`: A form that calls `POST /api/auth/register`.
* [x] **Task 4.4: Implement Authentication Context**
    * Create a React Context (`AuthContext`) to store the user's login state and JWT token globally.
    * When the user logs in, save the token to `localStorage` and the context.
    * Create a `<ProtectedRoute />` component that redirects to `/login` if the user is not in the context.
* [x] **Task 4.5: Build Member Dashboard**
    * Create a `DashboardPage.js` (protected route).
    * It should fetch data from `GET /api/users/me` to show "Welcome, [User Name]".
    * Add a section to show "My Checked-Out Books" (this API doesn't exist yet, but you can build the UI).


## Milestone 5: Core Feature - Circulation (Librarian) ✅

**Goal:** Build the admin-only feature for checking books in and out.

* [x] **Task 5.1: Create Admin Middleware**
    * In your backend, create an `admin.js` middleware.
    * It first uses the `auth.js` middleware, then checks if `req.user.role === 'LIBRARIAN'`.
* [x] **Task 5.2: Build Circulation API Endpoints**
    * Apply *both* `auth` and `admin` middleware to these routes.
    * `POST /api/circulation/checkout`: `{ "userId": 1, "bookItemId": 123 }`.
    * `POST /api/circulation/return`: `{ "bookItemId": 123 }`.
* [x] **Task 5.3: Implement the Checkout DB Transaction (CRITICAL)**
    * In your `checkout` controller, use the Postgres client to execute a `BEGIN`, `COMMIT`, and `ROLLBACK` (on error) transaction.
    * **Logic:**
        1.  `BEGIN;`
        2.  Check if the book item status is 'AVAILABLE'. If not, `ROLLBACK` and send an error.
        3.  `UPDATE Book_Items SET status = 'CHECKED_OUT' WHERE book_item_id = 123;`
        4.  `INSERT INTO Transactions (user_id, book_item_id, due_date) VALUES (1, 123, 'NOW() + 14 days');`
        5.  `COMMIT;`
* [x] **Task 5.4: Build Admin Panel UI**
    * In React, create an `<AdminPage />` protected by a new 'admin' route.
    * Build a simple form: "Enter User ID" and "Enter Book Barcode".
    * Have "Checkout" and "Return" buttons that call your new API endpoints.


## Milestone 6: Advanced Features (Fines & Reservations)

**Goal:** Flesh out the remaining core library features.

* [ ] **Task 6.1: Fine Calculation**
    * Write a "cron job" (a scheduled task) on your Node server. (A simple `setInterval` works for a personal project).
    * Every night, it scans the `Transactions` table for books where `due_date < NOW()` and `return_date IS NULL`.
    * For each overdue book, it calculates a fine and adds it to the `Fines` table.
* [ ] **Task 6.2: Reservation System**
    * This is complex! It requires a new `Reservations` table (a queue).
    * When a user tries to check out an unavailable book, they are added to the queue.
    * When the book is *returned*, the system checks the queue and notifies the next user.

