import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksAPI } from '../services/api';
import { GiWhiteBook } from 'react-icons/gi';
import './Books.css';

const BookCatalog = () => {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadBooks = React.useCallback(async (page) => {
    setLoading(true);
    try {
      const response = await booksAPI.getAll(page, 12);
      setBooks(response.data.books);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks(1);
  }, [loadBooks]);

  // Auto-search as user types (debounced) and provide autosuggest
  useEffect(() => {
    const controller = new AbortController();
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      loadBooks(1);
      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const resp = await booksAPI.searchAutosuggest(q);
        setSuggestions(resp.data.books || []);
        setShowSuggestions(true);
        // also update main list to show filtered results
        const full = await booksAPI.search(q);
        setBooks(full.data.books);
        setPagination({ page: 1, totalPages: 1 });
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery, loadBooks]);

  const handlePageChange = (newPage) => {
    loadBooks(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="books-page">
      <div className="books-header">
        <h1><GiWhiteBook style={{ transform: 'translateY(4px)' }} /> Book Catalog</h1>
        <p>Browse our collection of books</p>
      </div>

      <form className="search-form" onSubmit={(e) => e.preventDefault()}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
            style={{width: '100%'}}
          />
          {/* {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadBooks(1);
              }}
              className="clear-button"
            >
              Clear
            </button>
          )} */}

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s) => (
                <div
                  key={s.book_id}
                  className="suggestion-item"
                  onMouseDown={() => {
                    // onMouseDown to prevent blur before click
                    setSearchQuery(s.title);
                    setShowSuggestions(false);
                    // navigate to book detail
                    window.location.href = `/books/${s.book_id}`;
                  }}
                >
                  <strong>{s.title}</strong>
                  <div style={{ fontSize: 12 }}>{s.author}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {loading ? (
        <div className="loading">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <p>No books found</p>
        </div>
      ) : (
        <>
          <div className="books-grid">
            {books.map((book) => (
              <Link to={`/books/${book.book_id}`} key={book.book_id} className="book-card">
                <div className="book-cover">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} />
                  ) : (
                    <div className="no-cover"><GiWhiteBook size={60} /></div>
                  )}
                </div>
                <div className="book-info">
                  <h3>{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <div className="book-availability">
                    <span className={book.available_copies > 0 ? 'available' : 'unavailable'}>
                      {book.available_copies > 0
                        ? `${book.available_copies} available`
                        : 'Not available'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="page-button"
              >
                Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="page-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookCatalog;
