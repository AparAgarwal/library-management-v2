# 📚 Library Management System v2

A full-stack library management system built with React, Node.js, PostgreSQL, and Redis. Features a modular architecture with optimized Docker setup for minimal storage footprint.

---

## 🚀 Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React.js | UI for both members and librarians |
| **Backend** | Node.js + Express.js | REST API with feature-based modules |
| **Database** | PostgreSQL | Relational data storage |
| **Authentication** | JWT (JSON Web Tokens) | Secure user sessions |
| **Caching** | Redis | Performance optimization |
| **Containerization**| Docker / Docker Compose | Orchestrated multi-service deployment |

---

## ✨ Core Features

* **User Roles:** Member and Librarian (Admin)
* **Authentication:** Secure JWT-based login/registration
* **Catalog Management:** Searchable book catalog with pagination
* **Circulation:** Librarian checkout/return workflow
* **Member Portal:** Dashboard with active loans, history, and fines
* **Fine Management:** Automatic overdue fine calculation
* **Book Requests:** Member-initiated borrow requests
* **Profile Management:** Avatar uploads and profile editing

---

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database and Redis configuration
│   │   ├── middleware/      # Authentication middleware
│   │   ├── modules/         # Feature-based modules
│   │   │   ├── auth/        # Authentication (login, register, profile)
│   │   │   ├── books/       # Book catalog and search
│   │   │   ├── users/       # User profile and dashboard
│   │   │   ├── circulation/ # Checkout and return operations
│   │   │   ├── admin/       # Admin member management
│   │   │   └── requests/    # Book borrow requests
│   │   ├── seed.js          # Database seeding script
│   │   └── server.js        # Express server entry point
│   ├── uploads/             # User avatars storage
│   ├── .env.example         # Environment variables template
│   ├── .dockerignore        # Docker build exclusions
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Page components
    │   ├── services/        # API service layer
    │   └── store/           # Redux store and slices
    ├── .env.example
    ├── .dockerignore
    └── Dockerfile
```


## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Git

### Setup Instructions

1. **Clone the repository**
   ```powershell
   git clone <repository-url>
   cd "Library Management System v2"
   ```

2. **Create environment files**
   ```powershell
   Copy-Item backend\.env.example backend\.env
   Copy-Item frontend\.env.example frontend\.env
   ```
   
   Edit these files if you need custom configuration.

3. **Start the application**
   ```powershell
   docker compose up --build
   ```
   
   First build will take 3-5 minutes. Subsequent starts are faster:
   ```powershell
   docker compose up
   ```

4. **Seed the database** (optional)
   ```powershell
   docker exec -it library_backend npm run seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

### Default Login Credentials

After seeding:
- **Librarian**: admin@library.com / admin123
- **Member**: member@library.com / member123

---

## 💾 Storage Optimization

This project is optimized to minimize Docker storage usage:

### What We've Done
- ✅ **Named volumes** for `node_modules` (prevents duplicate installations)
- ✅ **Bind mounts** with `:cached` flag for source code
- ✅ **.dockerignore** files exclude `node_modules` and build artifacts
- ✅ **Optimized Dockerfiles** use `npm ci` and cache cleaning
- ✅ **No unnecessary rebuilds** - source changes don't trigger image rebuilds

### Storage Best Practices

**Regular Cleanup** (Recommended Weekly)
```powershell
.\docker-cleanup.ps1
```

**Manual Cleanup Commands**
```powershell
# Stop containers and remove volumes
docker compose down -v

# Remove unused images
docker image prune -f

# Remove build cache
docker builder prune -f

# Complete reset (⚠️ removes ALL Docker data)
docker system prune -a --volumes
```

**Monitor Disk Usage**
```powershell
docker system df
```

### Why Storage Was High Before
- ❌ `node_modules` copied into images on every build
- ❌ Anonymous volumes created per container
- ❌ Build cache accumulation
- ❌ Multiple image layers from code changes

### Now
- ✅ Shared named volumes across rebuilds
- ✅ Only package.json changes trigger reinstalls
- ✅ Source code mounted from host (no copying)
- ✅ Typical usage: **<2GB** for entire stack

---

## 🛠️ Development

### Hot Reload
Both services support hot reload:
- **Backend**: Nodemon watches `src/` files
- **Frontend**: React dev server auto-reloads

### Running Commands

```powershell
# Backend shell
docker exec -it library_backend sh

# Frontend shell
docker exec -it library_frontend sh

# Database shell
docker exec -it library_postgres psql -U library_user -d library_db

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Stopping Services
```powershell
# Stop (keeps volumes)
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

---

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user profile

### Books
- `GET /api/books` - List books (paginated)
- `GET /api/books/:id` - Get book details
- `GET /api/books/search?q=query` - Search books
- `POST /api/books` - Add book (librarian)
- `POST /api/books/items` - Add book copy (librarian)

### Users
- `GET /api/users/my-books` - Active checkouts
- `GET /api/users/history` - Transaction history
- `GET /api/users/fines` - User fines
- `GET /api/users/dashboard-stats` - Dashboard data
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar

### Circulation (Librarian)
- `POST /api/circulation/checkout` - Checkout book
- `POST /api/circulation/return` - Return book
- `GET /api/circulation/checkouts` - All active checkouts
- `GET /api/circulation/stats` - Library statistics

### Admin (Librarian)
- `GET /api/admin/members` - List members
- `GET /api/admin/members/:id` - Member details

### Requests
- `POST /api/requests` - Create borrow request
- `GET /api/requests` - List requests (librarian)
- `PUT /api/requests/:id` - Update request status (librarian)

---

## 📄 License

MIT License

