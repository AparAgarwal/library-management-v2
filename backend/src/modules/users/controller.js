const db = require('../../config/db');
const { transformUserData } = require('../../utils/helpers');
const { 
  ERROR_MESSAGES, 
  TRANSACTION_STATUS,
  MAX_HISTORY_ITEMS 
} = require('../../config/constants');

exports.getMyBooks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, b.title, b.author, b.cover_url, bi.barcode
       FROM transactions t
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE t.user_id = $1 AND t.status = $2
       ORDER BY t.checkout_date DESC`,
      [req.user.userId, TRANSACTION_STATUS.ACTIVE]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get my books error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, b.title, b.author, b.cover_url, bi.barcode
       FROM transactions t
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE t.user_id = $1
       ORDER BY t.checkout_date DESC
       LIMIT $2`,
      [req.user.userId, MAX_HISTORY_ITEMS]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.getMyFines = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.*, t.transaction_id, b.title, b.author
       FROM fines f
       JOIN transactions t ON f.transaction_id = t.transaction_id
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.userId]
    );

    const totalUnpaid = result.rows
      .filter((f) => !f.paid)
      .reduce((sum, f) => sum + parseFloat(f.amount), 0);

    res.json({
      fines: result.rows,
      totalUnpaid: totalUnpaid.toFixed(2),
    });
  } catch (error) {
    console.error('Get my fines error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all dashboard data in parallel
    const [activeBooks, overdueBooks, fines, recentActivity] = await Promise.all([
      db.query(
        'SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND status = $2',
        [userId, TRANSACTION_STATUS.ACTIVE]
      ),
      db.query(
        'SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND status = $2 AND due_date < CURRENT_DATE',
        [userId, TRANSACTION_STATUS.ACTIVE]
      ),
      db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE user_id = $1 AND paid = false',
        [userId]
      ),
      db.query(
        `SELECT t.*, b.title, b.author
         FROM transactions t
         JOIN book_items bi ON t.book_item_id = bi.book_item_id
         JOIN books b ON bi.book_id = b.book_id
         WHERE t.user_id = $1
         ORDER BY t.checkout_date DESC
         LIMIT 5`,
        [userId]
      ),
    ]);

    res.json({
      activeBooks: parseInt(activeBooks.rows[0].count),
      overdueBooks: parseInt(overdueBooks.rows[0].count),
      totalFines: parseFloat(fines.rows[0].total).toFixed(2),
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const userId = req.user.userId;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: ERROR_MESSAGES.NO_FIELDS_TO_UPDATE });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE user_id = $${paramCount} 
      RETURNING user_id, email, first_name, last_name, role, phone, address, avatar_url, created_at`;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    res.json({
      message: 'Profile updated successfully',
      user: transformUserData(result.rows[0]),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    let avatarUrl = null;

    // If a file is uploaded, use it; otherwise set to null (delete avatar)
    if (req.file) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const result = await db.query(
      `UPDATE users 
       SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2
       RETURNING user_id, email, first_name, last_name, role, phone, address, avatar_url, created_at`,
      [avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    res.json({
      message: avatarUrl ? 'Avatar updated successfully' : 'Avatar removed successfully',
      user: transformUserData(result.rows[0]),
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};
