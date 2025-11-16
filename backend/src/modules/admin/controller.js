const db = require('../../config/db');
const { validatePagination, sanitizeSearchQuery } = require('../../utils/validation');
const { calculatePagination } = require('../../utils/helpers');
const { 
  ERROR_MESSAGES, 
  ROLES, 
  TRANSACTION_STATUS,
  DEFAULT_MEMBERS_LIMIT,
  MAX_LIMIT 
} = require('../../config/constants');

exports.listMembers = async (req, res) => {
  try {
    // Sanitize and validate inputs
    const searchQuery = sanitizeSearchQuery(req.query.q || '');
    const { page, limit, offset } = validatePagination(
      req.query.page,
      req.query.limit || DEFAULT_MEMBERS_LIMIT,
      MAX_LIMIT
    );

    // Build query with parameterized values (prevent SQL injection)
    const params = [];
    let whereClause = 'WHERE u.role = $1';
    params.push(ROLES.MEMBER);

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      whereClause += ` AND (u.email ILIKE $${params.length - 2} OR u.first_name || ' ' || u.last_name ILIKE $${params.length - 1} OR CAST(u.user_id AS TEXT) ILIKE $${params.length})`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
    const countResult = await db.query(countQuery, params.slice(0, searchQuery ? 4 : 1));
    const total = parseInt(countResult.rows[0].count, 10);

    // Get members list
    const listQuery = `
      SELECT u.user_id, u.email, u.first_name, u.last_name, u.created_at, u.avatar_url,
             COALESCE(active.count, 0) AS active_books,
             COALESCE(total_fines.total, 0) AS total_unpaid_fines
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS count 
        FROM transactions 
        WHERE status = $${params.length + 1}
        GROUP BY user_id
      ) active ON active.user_id = u.user_id
      LEFT JOIN (
        SELECT user_id, COALESCE(SUM(amount),0) AS total 
        FROM fines 
        WHERE paid = false 
        GROUP BY user_id
      ) total_fines ON total_fines.user_id = u.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 2} OFFSET $${params.length + 3}`;

    const queryParams = [...params, TRANSACTION_STATUS.ACTIVE, limit, offset];
    const result = await db.query(listQuery, queryParams);

    res.json({
      members: result.rows,
      pagination: calculatePagination(total, page, limit),
    });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.getMemberDetails = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);

    // Validate member ID
    if (Number.isNaN(memberId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_MEMBER_ID });
    }

    // Get user details
    const userResult = await db.query(
      `SELECT user_id, email, first_name, last_name, phone, address, role, created_at, avatar_url 
       FROM users WHERE user_id = $1`,
      [memberId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: ERROR_MESSAGES.MEMBER_NOT_FOUND });
    }

    const user = userResult.rows[0];

    // Get member transactions and fines in parallel
    const [transResult, finesResult] = await Promise.all([
      db.query(
        `SELECT t.*, b.title, b.author, b.cover_url, bi.barcode
         FROM transactions t
         JOIN book_items bi ON t.book_item_id = bi.book_item_id
         JOIN books b ON bi.book_id = b.book_id
         WHERE t.user_id = $1
         ORDER BY t.checkout_date DESC
         LIMIT 100`,
        [memberId]
      ),
      db.query(
        `SELECT f.*, t.book_item_id
         FROM fines f
         LEFT JOIN transactions t ON f.transaction_id = t.transaction_id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC`,
        [memberId]
      ),
    ]);

    res.json({
      user,
      transactions: transResult.rows,
      fines: finesResult.rows,
    });
  } catch (error) {
    console.error('Get member details error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};
