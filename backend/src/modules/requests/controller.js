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
    if (q) { params.push(`%${q}%`); where = 'WHERE b.title ILIKE $1 OR u.email ILIKE $1'; }
    const sql = `SELECT r.*, u.email, u.first_name, u.last_name, b.title, b.author, b.cover_url
                 FROM book_requests r
                 JOIN users u ON r.user_id = u.user_id
                 JOIN books b ON r.book_id = b.book_id
                 ${where}
                 ORDER BY r.created_at DESC
                 LIMIT 200`;
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

    // If approving, create a checkout transaction for the requested user (if a copy is available)
    if (status === 'APPROVED') {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        // Lock and fetch the request
        const reqRes = await client.query('SELECT * FROM book_requests WHERE request_id = $1 FOR UPDATE', [requestId]);
        if (reqRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Request not found' });
        }
        const requestRow = reqRes.rows[0];

        // Find an available book item for the requested book
        const biRes = await client.query(
          `SELECT * FROM book_items WHERE book_id = $1 AND status = 'AVAILABLE' LIMIT 1 FOR UPDATE`,
          [requestRow.book_id]
        );
        if (biRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'No available copies to fulfill the request' });
        }
        const bookItem = biRes.rows[0];

        // Mark book item as checked out
        await client.query('UPDATE book_items SET status = $1 WHERE book_item_id = $2', ['CHECKED_OUT', bookItem.book_item_id]);

        // Create transaction (due date 14 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        const trxRes = await client.query(
          `INSERT INTO transactions (user_id, book_item_id, due_date, status)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [requestRow.user_id, bookItem.book_item_id, dueDate, 'ACTIVE']
        );

        // Update the request to attach the book_item_id and set status
        const updReq = await client.query(
          'UPDATE book_requests SET status=$1, book_item_id=$2 WHERE request_id=$3 RETURNING *',
          ['APPROVED', bookItem.book_item_id, requestId]
        );

        await client.query('COMMIT');
        // Clear any related caches if needed (left out for brevity)
        return res.json({ request: updReq.rows[0], transaction: trxRes.rows[0] });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Approve request transaction error:', err);
        return res.status(500).json({ error: 'Server error during approval' });
      } finally {
        client.release();
      }
    }

    // Non-approval updates (DENIED, CANCELLED, PENDING)
    const result = await db.query('UPDATE book_requests SET status=$1 WHERE request_id=$2 RETURNING *', [status, requestId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sql = `SELECT r.*, b.title, b.author, b.cover_url
                 FROM book_requests r
                 JOIN books b ON r.book_id = b.book_id
                 WHERE r.user_id = $1
                 ORDER BY r.created_at DESC`;
    const result = await db.query(sql, [userId]);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
