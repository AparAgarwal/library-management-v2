const db = require('../../config/db');

exports.listMembers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    let where = "WHERE u.role = 'MEMBER'";
    const params = [];
    if (q) {
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      where += ` AND (u.email ILIKE $${params.length - 2} OR u.first_name || ' ' || u.last_name ILIKE $${params.length - 1} OR CAST(u.user_id AS TEXT) ILIKE $${params.length})`;
    }
    const countQuery = `SELECT COUNT(*) FROM users u ${where}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const listQuery = `SELECT u.user_id, u.email, u.first_name, u.last_name, u.created_at, u.avatar_url,
             COALESCE(active.count, 0) AS active_books,
             COALESCE(total_fines.total, 0) AS total_unpaid_fines
      FROM users u
      LEFT JOIN (SELECT user_id, COUNT(*) AS count FROM transactions WHERE status = 'ACTIVE' GROUP BY user_id) active ON active.user_id = u.user_id
      LEFT JOIN (SELECT user_id, COALESCE(SUM(amount),0) AS total FROM fines WHERE paid = false GROUP BY user_id) total_fines ON total_fines.user_id = u.user_id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await db.query(listQuery, params);
    res.json({ members: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMemberDetails = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (Number.isNaN(memberId)) return res.status(400).json({ error: 'Invalid member id' });
    const userResult = await db.query('SELECT user_id, email, first_name, last_name, phone, address, role, created_at, avatar_url FROM users WHERE user_id = $1', [memberId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    const user = userResult.rows[0];
    const transResult = await db.query(
      `SELECT t.*, b.title, b.author, b.cover_url, bi.barcode
       FROM transactions t
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE t.user_id = $1
       ORDER BY t.checkout_date DESC
       LIMIT 100`,
      [memberId]
    );
    const finesResult = await db.query(
      `SELECT f.* , t.book_item_id
       FROM fines f
       LEFT JOIN transactions t ON f.transaction_id = t.transaction_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [memberId]
    );
    res.json({ user, transactions: transResult.rows, fines: finesResult.rows });
  } catch (error) {
    console.error('Get member details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
