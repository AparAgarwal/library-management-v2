const db = require('../../config/db');
const { calculateDueDate, calculateFine } = require('../../utils/helpers');
const { 
  ERROR_MESSAGES, 
  BOOK_STATUS, 
  TRANSACTION_STATUS, 
  CHECKOUT_DURATION_DAYS,
  FINE_PER_DAY 
} = require('../../config/constants');

exports.checkoutBook = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { userId, bookItemId } = req.body;

    // Validate required fields
    if (!userId || !bookItemId) {
      return res.status(400).json({ error: 'User ID and Book Item ID are required' });
    }

    await client.query('BEGIN');

    // Check if book item exists and is available
    const bookItemResult = await client.query(
      'SELECT * FROM book_items WHERE book_item_id = $1',
      [bookItemId]
    );

    if (bookItemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: ERROR_MESSAGES.BOOK_ITEM_NOT_FOUND });
    }

    const bookItem = bookItemResult.rows[0];
    if (bookItem.status !== BOOK_STATUS.AVAILABLE) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: ERROR_MESSAGES.BOOK_NOT_AVAILABLE });
    }

    // Update book item status
    await client.query(
      'UPDATE book_items SET status = $1 WHERE book_item_id = $2',
      [BOOK_STATUS.CHECKED_OUT, bookItemId]
    );

    // Calculate due date
    const dueDate = calculateDueDate(new Date(), CHECKOUT_DURATION_DAYS);

    // Create transaction record
    const transactionResult = await client.query(
      `INSERT INTO transactions (user_id, book_item_id, due_date, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, bookItemId, dueDate, TRANSACTION_STATUS.ACTIVE]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Book checked out successfully',
      transaction: transactionResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  } finally {
    client.release();
  }
};

exports.returnBook = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { bookItemId } = req.body;

    // Validate required field
    if (!bookItemId) {
      return res.status(400).json({ error: 'Book Item ID is required' });
    }

    await client.query('BEGIN');

    // Find active transaction for this book item
    const transactionResult = await client.query(
      `SELECT * FROM transactions 
       WHERE book_item_id = $1 AND status = $2 
       ORDER BY checkout_date DESC LIMIT 1`,
      [bookItemId, TRANSACTION_STATUS.ACTIVE]
    );

    if (transactionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: ERROR_MESSAGES.NO_ACTIVE_CHECKOUT });
    }

    const transaction = transactionResult.rows[0];
    const returnDate = new Date();

    // Update transaction status
    await client.query(
      'UPDATE transactions SET return_date = $1, status = $2 WHERE transaction_id = $3',
      [returnDate, TRANSACTION_STATUS.RETURNED, transaction.transaction_id]
    );

    // Update book item status
    await client.query(
      'UPDATE book_items SET status = $1 WHERE book_item_id = $2',
      [BOOK_STATUS.AVAILABLE, bookItemId]
    );

    // Calculate and apply fine if overdue
    const dueDate = new Date(transaction.due_date);
    const fineAmount = calculateFine(dueDate, returnDate, FINE_PER_DAY);

    if (fineAmount > 0) {
      await client.query(
        'INSERT INTO fines (transaction_id, user_id, amount) VALUES ($1, $2, $3)',
        [transaction.transaction_id, transaction.user_id, fineAmount]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Book returned successfully',
      transaction,
      ...(fineAmount > 0 && { fine: fineAmount }),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Return error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  } finally {
    client.release();
  }
};

exports.getAllCheckouts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.first_name, u.last_name, u.email, u.avatar_url, 
              b.title, b.author, b.cover_url, bi.barcode
       FROM transactions t
       JOIN users u ON t.user_id = u.user_id
       JOIN book_items bi ON t.book_item_id = bi.book_item_id
       JOIN books b ON bi.book_id = b.book_id
       WHERE t.status = $1
       ORDER BY t.due_date ASC`,
      [TRANSACTION_STATUS.ACTIVE]
    );

    res.json({ checkouts: result.rows });
  } catch (error) {
    console.error('Get all checkouts error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.getLibraryStats = async (req, res) => {
  try {
    const [books, items, available, checkouts, members, overdue] = await Promise.all([
      db.query('SELECT COUNT(*) FROM books'),
      db.query('SELECT COUNT(*) FROM book_items'),
      db.query('SELECT COUNT(*) FROM book_items WHERE status = $1', [BOOK_STATUS.AVAILABLE]),
      db.query('SELECT COUNT(*) FROM transactions WHERE status = $1', [TRANSACTION_STATUS.ACTIVE]),
      db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['MEMBER']),
      db.query('SELECT COUNT(*) FROM transactions WHERE status = $1 AND due_date < CURRENT_DATE', [TRANSACTION_STATUS.ACTIVE]),
    ]);

    res.json({
      totalBooks: parseInt(books.rows[0].count),
      totalCopies: parseInt(items.rows[0].count),
      availableBooks: parseInt(available.rows[0].count),
      activeCheckouts: parseInt(checkouts.rows[0].count),
      totalMembers: parseInt(members.rows[0].count),
      overdueBooks: parseInt(overdue.rows[0].count),
    });
  } catch (error) {
    console.error('Get library stats error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};
