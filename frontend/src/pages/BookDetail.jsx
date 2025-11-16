import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { booksAPI, circulationAPI } from '../services/api';
import { selectUser } from '../store/slices/authSlice';
import { GiWhiteBook } from 'react-icons/gi';
import './Books.css';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBook = useCallback(async () => {
    try {
      const response = await booksAPI.getById(id);
      setBook(response.data);
    } catch (error) {
      setError('Book not found');
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);



  if (loading) {
    return <div className="loading">Loading book details...</div>;
  }

  if (error || !book) {
    return (
      <div className="error-page">
        <h2>Book Not Found</h2>
        <button onClick={() => navigate('/books')} className="btn-primary">
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="book-detail-page">
      <button onClick={() => navigate('/books')} className="back-button">
        ← Back to Catalog
      </button>

      <div className="book-detail-container">
        <div className="book-detail-cover">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} />
          ) : (
            <div className="no-cover-large"><GiWhiteBook size={120} /></div>
          )}
        </div>

        <div className="book-detail-info">
          <h1>{book.title}</h1>
          {/* Show the internal book id so librarians can find the catalog id if needed */}
          {book.book_id && (
            <div className="meta-item">
              <strong>Book ID:</strong> {book.book_id}
            </div>
          )}
          <h2 className="detail-author">by {book.author}</h2>

          <div className="detail-meta">
            {book.isbn && (
              <div className="meta-item">
                <strong>ISBN:</strong> {book.isbn}
              </div>
            )}
            {book.publisher && (
              <div className="meta-item">
                <strong>Publisher:</strong> {book.publisher}
              </div>
            )}
            {book.publication_year && (
              <div className="meta-item">
                <strong>Year:</strong> {book.publication_year}
              </div>
            )}
            {book.category && (
              <div className="meta-item">
                <strong>Category:</strong> {book.category}
              </div>
            )}
          </div>

          <div className="availability-section">
            <h3>Availability</h3>
            <div className="availability-stats">
              <div className="stat">
                <strong>{book.total_copies || 0}</strong>
                <span>Total Copies</span>
              </div>
              <div className="stat">
                <strong className={book.available_copies > 0 ? 'available' : 'unavailable'}>
                  {book.available_copies || 0}
                </strong>
                <span>Available</span>
              </div>
            </div>
          </div>

          {book.description && (
            <div className="description-section">
              <h3>Description</h3>
              <p>{book.description}</p>
            </div>
          )}

          {book.copies && book.copies.length > 0 && (
            <div className="copies-section">
              <h3>Physical Copies</h3>
              <div className="copies-list">
                {book.copies.map((copy) => (
                  <div key={copy.bookItemId} className="copy-item">
                    <div className="copy-info">
                      <strong>Book Item ID:</strong> {copy.bookItemId}
                      <br />
                      <strong>Barcode:</strong> {copy.barcode}
                      <br />
                      <strong>Location:</strong> {copy.location || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span className={`copy-status ${copy.status.toLowerCase()}`}>
                        {copy.status}
                      </span>

                      {/* Only librarians can checkout copies */}
                      {user?.role === 'LIBRARIAN' && copy.status === 'AVAILABLE' && (
                        <CopyCheckoutForm
                          bookItemId={copy.bookItemId}
                          onSuccess={() => loadBook()}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
// Small inline component for checkout per copy
function CopyCheckoutForm({ bookItemId, onSuccess }) {
  const [userId, setUserId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!userId) {
      setMessage({ type: 'error', text: 'Enter a user ID' });
      return;
    }

    setLoading(true);
    try {
      await circulationAPI.checkout({ userId: parseInt(userId, 10), bookItemId: parseInt(bookItemId, 10) });
      setMessage({ type: 'success', text: 'Checked out successfully' });
      setUserId('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Checkout failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCheckout} className="checkout-inline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input
        type="number"
        placeholder="Member User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ width: 140, padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd' }}
        required
      />
      <button type="submit" className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.9rem' }} disabled={loading}>
        {loading ? '...' : 'Checkout'}
      </button>
      {message && (
        <div style={{ marginTop: 6, color: message.type === 'error' ? '#c92a2a' : '#155724', fontSize: '0.85rem' }}>
          {message.text}
        </div>
      )}
    </form>
  );
}
