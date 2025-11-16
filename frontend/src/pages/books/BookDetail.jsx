import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { booksAPI, circulationAPI, requestsAPI } from '../../services/api';
import { selectUser } from '../../store/slices/authSlice';
import { GiWhiteBook } from 'react-icons/gi';
import { FaBookmark } from 'react-icons/fa';
import '../Books.css';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutUserId, setCheckoutUserId] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState({ text: '', type: '' });
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState({ text: '', type: '' });

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

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutUserId.trim()) {
      setCheckoutMessage({ text: 'Please enter a User ID', type: 'error' });
      return;
    }

    setCheckoutLoading(true);
    setCheckoutMessage({ text: '', type: '' });

    try {
      // Find an available book item for this book
      const availableItem = book.copies?.find(item => item.status === 'AVAILABLE');
      
      if (!availableItem) {
        setCheckoutMessage({ text: 'No available copies to checkout', type: 'error' });
        setCheckoutLoading(false);
        return;
      }

      await circulationAPI.checkout({
        userId: parseInt(checkoutUserId),
        bookItemId: availableItem.bookitemid
      });

      setCheckoutMessage({ text: 'Book checked out successfully!', type: 'success' });
      setCheckoutUserId('');
      
      // Reload book data to update availability
      loadBook();
    } catch (error) {
      setCheckoutMessage({ 
        text: error.response?.data?.error || 'Checkout failed. Please try again.', 
        type: 'error' 
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRequestBook = async () => {
    if (!user) {
      setRequestMessage({ text: 'Please login to request books', type: 'error' });
      return;
    }

    setRequestLoading(true);
    setRequestMessage({ text: '', type: '' });

    try {
      await requestsAPI.create({
        book_id: parseInt(id),
        book_item_id: null
      });

      setRequestMessage({ text: 'Book request submitted successfully! Librarian will review your request.', type: 'success' });
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setRequestMessage({ text: '', type: '' });
      }, 5000);
    } catch (error) {
      setRequestMessage({ 
        text: error.response?.data?.error || 'Failed to submit request. Please try again.', 
        type: 'error' 
      });
    } finally {
      setRequestLoading(false);
    }
  };

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
          <div className="book-title-row">
            <h1>{book.title}</h1>
            {user && user.role === 'MEMBER' && (
              <button 
                className="btn-request-book"
                onClick={handleRequestBook}
                disabled={requestLoading}
                title="Request this book from librarian"
              >
                <FaBookmark />
                {requestLoading ? 'Requesting...' : 'Request Book'}
              </button>
            )}
          </div>
          {requestMessage.text && (
            <div className={`request-message ${requestMessage.type}`}>
              {requestMessage.text}
            </div>
          )}
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

          {user && (user.role === 'LIBRARIAN' || user.role === 'ADMIN') && book.available_copies > 0 && (
            <div className="checkout-section">
              <h3>Checkout Book</h3>
              {checkoutMessage.text && (
                <div className={`checkout-message ${checkoutMessage.type}`}>
                  {checkoutMessage.text}
                </div>
              )}
              <form onSubmit={handleCheckout} className="checkout-form">
                <div className="form-group">
                  <label htmlFor="userId">User ID</label>
                  <input
                    id="userId"
                    type="number"
                    placeholder="Enter member's User ID"
                    value={checkoutUserId}
                    onChange={(e) => setCheckoutUserId(e.target.value)}
                    disabled={checkoutLoading}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-checkout"
                  disabled={checkoutLoading || book.available_copies === 0}
                >
                  {checkoutLoading ? 'Processing...' : 'Checkout Book'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;