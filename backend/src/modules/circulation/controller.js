const db = require('../../config/db');

exports.checkoutBook = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { userId, bookItemId } = req.body;
    if (!userId || !bookItemId) return res.status(400).json({ error: 'User ID and Book Item ID are required' });
    await client.query('BEGIN');
    const bookItemResult = await client.query('SELECT * FROM book_items WHERE book_item_id = $1', [bookItemId]);
    if (bookItemResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Book item not found' }); }
    const bookItem = bookItemResult.rows[0];
    if (bookItem.status !== 'AVAILABLE') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Book is not available for checkout' }); }
    await client.query('UPDATE book_items SET status = $1 WHERE book_item_id = $2', ['CHECKED_OUT', bookItemId]);
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
    const transactionResult = await client.query(
      `INSERT INTO transactions (user_id, book_item_id, due_date, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, bookItemId, dueDate, 'ACTIVE']
    );
    await client.query('COMMIT');
    res.json({ message: 'Book checked out successfully', transaction: transactionResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Server error during checkout' });
  } finally { client.release(); }
};

exports.returnBook = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { bookItemId } = req.body;
    if (!bookItemId) return res.status(400).json({ error: 'Book Item ID is required' });
    await client.query('BEGIN');
    const transactionResult = await client.query(
      `SELECT * FROM transactions WHERE book_item_id = $1 AND status = $2 ORDER BY checkout_date DESC LIMIT 1`,
      [bookItemId, 'ACTIVE']
    );
    if (transactionResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'No active checkout found for this book' }); }
    const transaction = transactionResult.rows[0];
    const returnDate = new Date();
    await client.query('UPDATE transactions SET return_date = $1, status = $2 WHERE transaction_id = $3', [returnDate, 'RETURNED', transaction.transaction_id]);
    await client.query('UPDATE book_items SET status = $1 WHERE book_item_id = $2', ['AVAILABLE', bookItemId]);
    const dueDate = new Date(transaction.due_date);
    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      const fineAmount = daysLate * parseFloat(process.env.FINE_PER_DAY || 0.5);
      await client.query('INSERT INTO fines (transaction_id, user_id, amount) VALUES ($1, $2, $3)', [transaction.transaction_id, transaction.user_id, fineAmount]);
    }
    await client.query('COMMIT');
    res.json({ message: 'Book returned successfully', transaction });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Return error:', error);
    res.status(500).json({ error: 'Server error during return' });
  } finally { client.release(); }
};

exports.getAllCheckouts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.first_name, u.last_name, u.email, u.avatar_url, b.title, b.author, b.cover_url, bi.barcode
       FROM transactions t
       JOIN users u ON t.user_id = u.user_id
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE t.status = 'ACTIVE'
       ORDER BY t.due_date ASC`
    );
    res.json({ checkouts: result.rows });
  } catch (error) {
    console.error('Get all checkouts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getLibraryStats = async (req, res) => {
  try {
    const booksResult = await db.query('SELECT COUNT(*) FROM books');
    const itemsResult = await db.query('SELECT COUNT(*) FROM book_items');
    const availableResult = await db.query('SELECT COUNT(*) FROM book_items WHERE status = $1', ['AVAILABLE']);
    const checkoutsResult = await db.query('SELECT COUNT(*) FROM transactions WHERE status = $1', ['ACTIVE']);
    const membersResult = await db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['MEMBER']);
    const overdueResult = await db.query('SELECT COUNT(*) FROM transactions WHERE status = $1 AND due_date < CURRENT_DATE', ['ACTIVE']);
    res.json({
      totalBooks: parseInt(booksResult.rows[0].count),
      totalCopies: parseInt(itemsResult.rows[0].count),
      availableBooks: parseInt(availableResult.rows[0].count),
      activeCheckouts: parseInt(checkoutsResult.rows[0].count),
      totalMembers: parseInt(membersResult.rows[0].count),
      overdueBooks: parseInt(overdueResult.rows[0].count),
    });
  } catch (error) {
    console.error('Get library stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
