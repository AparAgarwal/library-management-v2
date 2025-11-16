const db = require('../../config/db');
const redis = require('../../config/redis');
const { validatePagination } = require('../../utils/validation');
const { calculatePagination, invalidateCachePattern } = require('../../utils/helpers');
const { 
  ERROR_MESSAGES, 
  DEFAULT_PAGE, 
  DEFAULT_LIMIT, 
  MAX_LIMIT,
  CACHE_TTL_SHORT,
  BOOK_STATUS 
} = require('../../config/constants');

exports.getAllBooks = async (req, res) => {
  try {
    // Validate and sanitize pagination parameters
    const { page, limit, offset } = validatePagination(
      req.query.page || DEFAULT_PAGE,
      req.query.limit || DEFAULT_LIMIT,
      MAX_LIMIT
    );

    // Check cache
    const cacheKey = `books:page:${page}:limit:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Fetch books from database
    const booksResult = await db.query(
      `SELECT b.*, 
              COUNT(bi.book_item_id) as total_copies,
              COUNT(CASE WHEN bi.status = $1 THEN 1 END) as available_copies
       FROM books b
       LEFT JOIN book_items bi ON b.book_id = bi.book_id
       GROUP BY b.book_id
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [BOOK_STATUS.AVAILABLE, limit, offset]
    );

    // Get total count
    const countResult = await db.query('SELECT COUNT(*) FROM books');
    const total = parseInt(countResult.rows[0].count);

    const response = {
      books: booksResult.rows,
      pagination: calculatePagination(total, page, limit),
    };

    // Cache the response
    await redis.setex(cacheKey, CACHE_TTL_SHORT, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT b.*, 
              COUNT(bi.book_item_id) as total_copies,
              COUNT(CASE WHEN bi.status = $1 THEN 1 END) as available_copies,
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
       WHERE b.book_id = $2
       GROUP BY b.book_id`,
      [BOOK_STATUS.AVAILABLE, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: ERROR_MESSAGES.BOOK_NOT_FOUND });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.searchBooks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED });
    }

    const searchQuery = `%${q.trim().substring(0, 200)}%`;

    const result = await db.query(
      `SELECT b.*, 
              COUNT(bi.book_item_id) as total_copies,
              COUNT(CASE WHEN bi.status = $1 THEN 1 END) as available_copies
       FROM books b
       LEFT JOIN book_items bi ON b.book_id = bi.book_id
       WHERE b.title ILIKE $2 OR b.author ILIKE $2 OR b.isbn ILIKE $2
       GROUP BY b.book_id
       ORDER BY b.title
       LIMIT $3`,
      [BOOK_STATUS.AVAILABLE, searchQuery, 20]
    );

    res.json({ books: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.addBook = async (req, res) => {
  try {
    const { isbn, title, author, publisher, publicationYear, description, coverUrl, category } = req.body;

    // Validate required fields
    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }

    // Insert book
    const result = await db.query(
      `INSERT INTO books (isbn, title, author, publisher, publication_year, description, cover_url, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [isbn, title, author, publisher, publicationYear, description, coverUrl, category]
    );

    // Invalidate book cache
    await invalidateCachePattern(redis, 'books:page:*');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.addBookItem = async (req, res) => {
  try {
    const { bookId, barcode, location } = req.body;

    // Validate required fields
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
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};
