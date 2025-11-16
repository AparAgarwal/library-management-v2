const db = require('../config/db');

// Get user's checked out books
exports.getMyBooks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, b.title, b.author, b.cover_url, bi.barcode
       FROM transactions t
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE t.user_id = $1 AND t.status = 'ACTIVE'
       ORDER BY t.checkout_date DESC`,
      [req.user.userId]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get my books error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, b.title, b.author, b.cover_url, bi.barcode
       FROM transactions t
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE t.user_id = $1
       ORDER BY t.checkout_date DESC
       LIMIT 50`,
      [req.user.userId]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's fines
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
      .filter(fine => !fine.paid)
      .reduce((sum, fine) => sum + parseFloat(fine.amount), 0);

    res.json({
      fines: result.rows,
      totalUnpaid: totalUnpaid.toFixed(2),
    });
  } catch (error) {
    console.error('Get my fines error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get active checkouts count
    const activeBooks = await db.query(
      'SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND status = $2',
      [userId, 'ACTIVE']
    );

    // Get overdue books count
    const overdueBooks = await db.query(
      'SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND status = $2 AND due_date < CURRENT_DATE',
      [userId, 'ACTIVE']
    );

    // Get total unpaid fines
    const finesResult = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE user_id = $1 AND paid = false',
      [userId]
    );

    // Get recent activity
    const recentActivity = await db.query(
      `SELECT t.*, b.title, b.author
       FROM transactions t
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE t.user_id = $1
       ORDER BY t.checkout_date DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      activeBooks: parseInt(activeBooks.rows[0].count),
      overdueBooks: parseInt(overdueBooks.rows[0].count),
      totalFines: parseFloat(finesResult.rows[0].total).toFixed(2),
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
