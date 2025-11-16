import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI, requestsAPI, circulationAPI } from '../../services/api';
import './AdminBooks.css';
import { GiWhiteBook } from 'react-icons/gi';
import { FaSearch, FaTimes } from 'react-icons/fa';

const AdminBooks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();

  // Filter books based on search
  const filterBooks = useCallback(() => {
    let filtered = [...books];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query) ||
        book.publisher?.toLowerCase().includes(query) ||
        book.borrower?.toLowerCase().includes(query)
      );
    }

    setFilteredBooks(filtered);
  }, [books, searchQuery]);

  // All book loading functions
  const loadAllBooks = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page;
    const response = await booksAPI.getAll(currentPage, 20);
    if (resetPage) {
      setBooks(response.data.books);
      setPage(1);
    } else {
      setBooks(prev => [...prev, ...response.data.books]);
    }
    setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
  }, [page]);

  const loadLentBooks = useCallback(async () => {
    const response = await circulationAPI.getAllCheckouts();
    const lentBooks = response.data.checkouts.map((checkout, index) => ({
      book_id: checkout.transaction_id || `lent-${index}`,
      transaction_id: checkout.transaction_id,
      title: checkout.title,
      author: checkout.author,
      cover_url: checkout.cover_url,
      isbn: checkout.barcode,
      status: 'CHECKED_OUT',
      borrower: `${checkout.first_name} ${checkout.last_name}`,
      due_date: checkout.due_date,
      checkout_date: checkout.checkout_date
    }));
    setBooks(lentBooks);
  }, []);

  const loadOverdueBooks = useCallback(async () => {
    const response = await circulationAPI.getAllCheckouts();
    const now = new Date();
    const overdueCheckouts = response.data.checkouts.filter(
      checkout => new Date(checkout.due_date) < now
    );
    const overdueBooks = overdueCheckouts.map((checkout, index) => ({
      book_id: checkout.transaction_id || `overdue-${index}`,
      transaction_id: checkout.transaction_id,
      title: checkout.title,
      author: checkout.author,
      cover_url: checkout.cover_url,
      isbn: checkout.barcode,
      status: 'OVERDUE',
      borrower: `${checkout.first_name} ${checkout.last_name}`,
      due_date: checkout.due_date,
      checkout_date: checkout.checkout_date,
      days_overdue: Math.ceil((now - new Date(checkout.due_date)) / (1000 * 60 * 60 * 24))
    }));
    setBooks(overdueBooks);
  }, []);

  const loadBooksWithFines = useCallback(async () => {
    const response = await circulationAPI.getAllCheckouts();
    const now = new Date();
    const overdueCheckouts = response.data.checkouts.filter(
      checkout => new Date(checkout.due_date) < now
    );
    const booksWithFines = overdueCheckouts.map((checkout, index) => {
      const daysOverdue = Math.ceil((now - new Date(checkout.due_date)) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * 0.5;
      return {
        book_id: checkout.transaction_id || `fine-${index}`,
        transaction_id: checkout.transaction_id,
        title: checkout.title,
        author: checkout.author,
        cover_url: checkout.cover_url,
        isbn: checkout.barcode,
        status: 'OVERDUE',
        borrower: `${checkout.first_name} ${checkout.last_name}`,
        due_date: checkout.due_date,
        days_overdue: daysOverdue,
        fine_amount: fineAmount.toFixed(2)
      };
    });
    setBooks(booksWithFines);
  }, []);

  const loadRequests = useCallback(async () => {
    const response = await requestsAPI.listForAdmin();
    setRequests(response.data.requests);
  }, []);

  // Main data loading function
  const loadData = useCallback(async (resetPage = false) => {
    if (activeTab === 'all' && !resetPage && !hasMore) return;
    setLoading(true);
    try {
      switch (activeTab) {
        case 'all':
          await loadAllBooks(resetPage);
          break;
        case 'lend':
          await loadLentBooks();
          break;
        case 'overdue':
          await loadOverdueBooks();
          break;
        case 'fine':
          await loadBooksWithFines();
          break;
        case 'requests':
          await loadRequests();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, hasMore, loadAllBooks, loadLentBooks, loadOverdueBooks, loadBooksWithFines, loadRequests]);

  // Intersection observer for infinite scroll
  const lastBookElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && activeTab === 'all') {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, activeTab]);

  // Load data based on active tab
  useEffect(() => {
    setBooks([]);
    setPage(1);
    setHasMore(true);
    loadData(true);
  }, [activeTab, loadData]);

  // Load more books when page changes (infinite scroll)
  useEffect(() => {
    if (page > 1 && activeTab === 'all') {
      loadData(false);
    }
  }, [page, activeTab, loadData]);

  // Filter books based on search
  useEffect(() => {
    filterBooks();
  }, [filterBooks]);

  const handleApproveRequest = async (requestId) => {
    try {
      await requestsAPI.update(requestId, { status: 'APPROVED' });
      loadRequests();
      // If currently viewing lent books, reload them to show the newly approved request
      if (activeTab === 'lend') {
        await loadLentBooks();
      }
      // If currently viewing all books, reload to show updated available count
      if (activeTab === 'all') {
        await loadAllBooks(true);
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleDenyRequest = async (requestId) => {
    try {
      await requestsAPI.update(requestId, { status: 'DENIED' });
      loadRequests();
    } catch (error) {
      console.error('Error denying request:', error);
    }
  };

  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  const renderTableHeader = () => {
    if (activeTab === 'requests') {
      return (
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Title & Author</th>
            <th>Requested By</th>
            <th>Request Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
      );
    }

    if (activeTab === 'lend' || activeTab === 'overdue') {
      return (
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Title & Author</th>
            <th>Borrower</th>
            <th>Barcode/ISBN</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
      );
    }

    if (activeTab === 'fine') {
      return (
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Title & Author</th>
            <th>Borrower</th>
            <th>Days Overdue</th>
            <th>Fine Amount</th>
            <th>Status</th>
          </tr>
        </thead>
      );
    }

    return (
      <thead>
        <tr>
          <th>Thumbnail</th>
          <th>Title & Author</th>
          <th>Publisher</th>
          <th>Book ID</th>
          <th>ISBN</th>
          <th>Status</th>
        </tr>
      </thead>
    );
  };

  const renderTableBody = () => {
    if (activeTab === 'requests') {
      return (
        <tbody>
          {requests.map((request) => (
            <tr key={request.request_id}>
              <td>
                <div className="book-thumbnail">
                  {request.cover_url ? (
                    <img src={request.cover_url} alt={request.title} />
                  ) : (
                    <div className="no-thumbnail"><GiWhiteBook size={30} /></div>
                  )}
                </div>
              </td>
              <td>
                <div className="book-title-author">
                  <div className="book-title-bold">{request.title}</div>
                  <div className="book-author-secondary">{request.author}</div>
                </div>
              </td>
              <td>{request.email}</td>
              <td>{new Date(request.created_at).toLocaleDateString()}</td>
              <td>
                <span className={`status-badge status-${request.status?.toLowerCase() || 'pending'}`}>
                  {request.status || 'PENDING'}
                </span>
              </td>
              <td>
                {request.status === 'PENDING' && (
                  <div className="action-buttons">
                    <button
                      className="btn-approve"
                      onClick={() => handleApproveRequest(request.request_id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-deny"
                      onClick={() => handleDenyRequest(request.request_id)}
                    >
                      Deny
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (activeTab === 'lend' || activeTab === 'overdue') {
      return (
        <tbody>
          {filteredBooks.map((book, index) => (
            <tr 
              key={book.book_id} 
              onClick={() => handleBookClick(book.book_id)} 
              className="clickable-row"
              ref={activeTab === 'all' && index === filteredBooks.length - 1 ? lastBookElementRef : null}
            >
              <td>
                <div className="book-thumbnail">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} />
                  ) : (
                    <div className="no-thumbnail"><GiWhiteBook size={30} /></div>
                  )}
                </div>
              </td>
              <td>
                <div className="book-title-author">
                  <div className="book-title-bold">{book.title}</div>
                  <div className="book-author-secondary">{book.author}</div>
                </div>
              </td>
              <td>{book.borrower}</td>
              <td>{book.isbn}</td>
              <td>{new Date(book.due_date).toLocaleDateString()}</td>
              <td>
                <span className={`status-badge status-${book.status?.toLowerCase() || 'unknown'}`}>
                  {book.status === 'CHECKED_OUT' ? 'Lent' : 'Overdue'}
                  {book.days_overdue && ` (${book.days_overdue}d)`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (activeTab === 'fine') {
      return (
        <tbody>
          {filteredBooks.map((book, index) => (
            <tr 
              key={book.book_id} 
              onClick={() => handleBookClick(book.book_id)} 
              className="clickable-row"
              ref={activeTab === 'all' && index === filteredBooks.length - 1 ? lastBookElementRef : null}
            >
              <td>
                <div className="book-thumbnail">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} />
                  ) : (
                    <div className="no-thumbnail"><GiWhiteBook size={30} /></div>
                  )}
                </div>
              </td>
              <td>
                <div className="book-title-author">
                  <div className="book-title-bold">{book.title}</div>
                  <div className="book-author-secondary">{book.author}</div>
                </div>
              </td>
              <td>{book.borrower}</td>
              <td>{book.days_overdue} days</td>
              <td>${book.fine_amount}</td>
              <td>
                <span className="status-badge status-overdue">Overdue</span>
              </td>
            </tr>
          ))}
        </tbody>
      );
    }

    // Default for 'all' tab
    return (
      <tbody>
        {filteredBooks.map((book, index) => (
          <tr 
            key={book.book_id} 
            onClick={() => handleBookClick(book.book_id)} 
            className="clickable-row"
            ref={activeTab === 'all' && index === filteredBooks.length - 1 ? lastBookElementRef : null}
          >
            <td>
              <div className="book-thumbnail">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} />
                ) : (
                  <div className="no-thumbnail"><GiWhiteBook size={30} /></div>
                )}
              </div>
            </td>
            <td>
              <div className="book-title-author">
                <div className="book-title-bold">{book.title}</div>
                <div className="book-author-secondary">{book.author}</div>
              </div>
            </td>
            <td>{book.publisher || 'N/A'}</td>
            <td>#{book.book_id}</td>
            <td>{book.isbn || 'N/A'}</td>
            <td>
              <span className={`status-badge ${(book.available_copies ?? 0) > 0 ? 'status-available' : 'status-unavailable'}`}>
                {(book.available_copies ?? 0) > 0 ? `Available (${book.available_copies})` : 'Unavailable'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="admin-books-page">
      <div className="admin-books-header">
        <h1><GiWhiteBook /> Books Management</h1>
        <p>Manage your library's book collection</p>
      </div>

      {/* Toolbar Tabs */}
      <div className="books-toolbar">
        <button
          className={`toolbar-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Books
        </button>
        <button
          className={`toolbar-tab ${activeTab === 'lend' ? 'active' : ''}`}
          onClick={() => setActiveTab('lend')}
        >
          Lent
        </button>
        <button
          className={`toolbar-tab ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue
        </button>
        <button
          className={`toolbar-tab ${activeTab === 'fine' ? 'active' : ''}`}
          onClick={() => setActiveTab('fine')}
        >
          Fines
        </button>
        <button
          className={`toolbar-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests
        </button>
      </div>

      {/* Search Section */}
      <div className="search-filter-section">
        <div className="search-bar-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, author, ISBN, borrower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar"
          />
          {searchQuery && (
            <FaTimes className="clear-icon" onClick={() => setSearchQuery('')} />
          )}
        </div>
      </div>

      {/* Table View */}
      {loading && filteredBooks.length === 0 ? (
        <div className="loading-container">Loading...</div>
      ) : (
        <div className="books-table-container">
          <table className="books-table">
            {renderTableHeader()}
            {renderTableBody()}
          </table>
          {loading && activeTab === 'all' && (
            <div className="loading-container">Loading more...</div>
          )}
          {(activeTab === 'requests' ? requests.length === 0 : filteredBooks.length === 0) && !loading && (
            <div className="empty-state">
              <p>No {activeTab === 'requests' ? 'requests' : 'books'} found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBooks;
