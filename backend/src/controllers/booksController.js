const db = require('../config/db');
const redis = require('../config/redis');

// Get all books with pagination
exports.getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Try cache first
    const cacheKey = `books:page:${page}:limit:${limit}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get books from database
    const booksResult = await db.query(
      `SELECT b.*, 
              COUNT(bi.book_item_id) as total_copies,
              COUNT(CASE WHEN bi.status = 'AVAILABLE' THEN 1 END) as available_copies
       FROM books b
       LEFT JOIN book_items bi ON b.book_id = bi.book_id
       GROUP BY b.book_id
       ORDER BY b.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) FROM books');
    const totalBooks = parseInt(countResult.rows[0].count);

    const response = {
      books: booksResult.rows,
      pagination: {
        page,
        limit,
        totalBooks,
        totalPages: Math.ceil(totalBooks / limit),
      },
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single book by ID
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT b.*, 
              COUNT(bi.book_item_id) as total_copies,
              COUNT(CASE WHEN bi.status = 'AVAILABLE' THEN 1 END) as available_copies,
              json_agg(
                json_build_object(
                  'bookItemId', bi.book_item_id,
                  'barcode', bi.barcode,
                  'status', bi.status,
                  'location', bi.location
                )
              ) FILTER (WHERE bi.book_item_id IS NOT NULL) as copies
       FROM books b
       LEFT JOIN book_items bi ON b.book_id = bi.book_id
       WHERE b.book_id = $1
       GROUP BY b.book_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search books
exports.searchBooks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await db.query(
      `SELECT b.*, 
              COUNT(bi.book_item_id) as total_copies,
              COUNT(CASE WHEN bi.status = 'AVAILABLE' THEN 1 END) as available_copies
       FROM books b
       LEFT JOIN book_items bi ON b.book_id = bi.book_id
       WHERE b.title ILIKE $1 OR b.author ILIKE $1 OR b.isbn ILIKE $1
       GROUP BY b.book_id
       ORDER BY b.title
       LIMIT 20`,
      [`%${q}%`]
    );

    res.json({ books: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add new book (librarian only)
exports.addBook = async (req, res) => {
  try {
    const { isbn, title, author, publisher, publicationYear, description, coverUrl, category } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }

    const result = await db.query(
      `INSERT INTO books (isbn, title, author, publisher, publication_year, description, cover_url, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [isbn, title, author, publisher, publicationYear, description, coverUrl, category]
    );

    // Clear cache
    const keys = await redis.keys('books:page:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add book item/copy (librarian only)
exports.addBookItem = async (req, res) => {
  try {
    const { bookId, barcode, location } = req.body;

    if (!bookId || !barcode) {
      return res.status(400).json({ error: 'Book ID and barcode are required' });
    }

    const result = await db.query(
      `INSERT INTO book_items (book_id, barcode, location)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [bookId, barcode, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add book item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
