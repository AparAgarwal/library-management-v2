const db = require('../../config/db');

exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { book_id, book_item_id } = req.body;
    if (!book_id) return res.status(400).json({ error: 'book_id is required' });
    const result = await db.query(
      `INSERT INTO book_requests (user_id, book_id, book_item_id, status)
       VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
      [userId, book_id, book_item_id || null]
    );
    res.status(201).json({ request: result.rows[0] });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.listRequests = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const params = [];
    let where = '';
    if (q) { params.push(`%${q}%`); where = 'WHERE b.title ILIKE $1 OR u.email ILIKE $1'; }
    const sql = `SELECT r.*, u.email, u.first_name, u.last_name, b.title, b.author
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
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!['APPROVED', 'DENIED', 'CANCELLED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await db.query('UPDATE book_requests SET status=$1 WHERE request_id=$2 RETURNING *', [status, requestId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
