const db = require('../../config/db');
const { sanitizeSearchQuery } = require('../../utils/validation');
const { 
  ERROR_MESSAGES, 
  REQUEST_STATUS,
  MAX_REQUEST_ITEMS 
} = require('../../config/constants');

exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { book_id, book_item_id } = req.body;

    // Validate required field
    if (!book_id) {
      return res.status(400).json({ error: 'book_id is required' });
    }

    const result = await db.query(
      `INSERT INTO book_requests (user_id, book_id, book_item_id, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, book_id, book_item_id || null, REQUEST_STATUS.PENDING]
    );

    res.status(201).json({ request: result.rows[0] });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.listRequests = async (req, res) => {
  try {
    const searchQuery = sanitizeSearchQuery(req.query.q || '');
    const params = [];
    let where = '';

    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      where = 'WHERE b.title ILIKE $1 OR u.email ILIKE $1';
    }

    const sql = `
      SELECT r.*, u.email, u.first_name, u.last_name, b.title, b.author
      FROM book_requests r
      JOIN users u ON r.user_id = u.user_id
      JOIN books b ON r.book_id = b.book_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1}`;

    params.push(MAX_REQUEST_ITEMS);
    const result = await db.query(sql, params);

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('List requests error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { status } = req.body;

    // Validate status
    const validStatuses = Object.values(REQUEST_STATUS);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_STATUS });
    }

    const result = await db.query(
      'UPDATE book_requests SET status = $1 WHERE request_id = $2 RETURNING *',
      [status, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: ERROR_MESSAGES.REQUEST_NOT_FOUND });
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};
