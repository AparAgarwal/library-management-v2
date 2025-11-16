import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import { selectUser } from '../../store/slices/authSlice';
import { circulationAPI } from '../../services/api';
import { formatDate, getDaysUntilDue, getErrorMessage } from '../../utils/helpers';
import { GiSpellBook, GiWhiteBook } from 'react-icons/gi';
import { FaUserFriends, FaHourglass, FaSearch, FaFilter } from "react-icons/fa";
import '../Dashboard.css';

const LibrarianDashboard = () => {
  const user = useSelector(selectUser);
  const [stats, setStats] = useState(null);
  const [allCheckouts, setAllCheckouts] = useState([]);
  const [displayedCheckouts, setDisplayedCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutForm, setCheckoutForm] = useState({ userId: '', bookItemId: '' });
  const [returnForm, setReturnForm] = useState({ bookItemId: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'overdue'
  const [sortBy, setSortBy] = useState('dueDate'); // 'dueDate', 'daysRemaining'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const scrollContainerRef = useRef(null);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const [statsRes, checkoutsRes] = await Promise.all([
          circulationAPI.getStats(),
          circulationAPI.getAllCheckouts(),
        ]);

        if (isMounted) {
          setStats(statsRes.data);
          setAllCheckouts(checkoutsRes.data.checkouts);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
          console.error('Error loading dashboard:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and search checkouts
  useEffect(() => {
    let filtered = [...allCheckouts];

    // Apply status filter
    if (filterStatus === 'overdue') {
      filtered = filtered.filter(checkout => isOverdue(checkout.due_date));
    } else if (filterStatus === 'active') {
      filtered = filtered.filter(checkout => !isOverdue(checkout.due_date));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(checkout =>
        checkout.title.toLowerCase().includes(query) ||
        checkout.author.toLowerCase().includes(query) ||
        checkout.first_name.toLowerCase().includes(query) ||
        checkout.last_name.toLowerCase().includes(query) ||
        checkout.email.toLowerCase().includes(query) ||
        checkout.barcode.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy === 'dueDate') {
      filtered.sort((a, b) => {
        const comparison = new Date(a.due_date) - new Date(b.due_date);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy === 'daysRemaining') {
      filtered.sort((a, b) => {
        const comparison = getDaysUntilDue(a.due_date) - getDaysUntilDue(b.due_date);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    setDisplayedCheckouts(filtered);
    setVisibleCount(5); // Reset to initial count on filter change
  }, [allCheckouts, searchQuery, filterStatus, sortBy, sortOrder]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 50) {
        setVisibleCount(prev => Math.min(prev + 5, displayedCheckouts.length));
      }
    }
  }, [displayedCheckouts.length]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      await circulationAPI.checkout(checkoutForm);
      setMessage({ text: 'Book checked out successfully!', type: 'success' });
      setCheckoutForm({ userId: '', bookItemId: '' });
      
      // Reload data
      const [statsRes, checkoutsRes] = await Promise.all([
        circulationAPI.getStats(),
        circulationAPI.getAllCheckouts(),
      ]);
      setStats(statsRes.data);
      setAllCheckouts(checkoutsRes.data.checkouts);
    } catch (err) {
      setMessage({ text: getErrorMessage(err), type: 'error' });
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      await circulationAPI.return(returnForm);
      setMessage({ text: 'Book returned successfully!', type: 'success' });
      setReturnForm({ bookItemId: '' });
      
      // Reload data
      const [statsRes, checkoutsRes] = await Promise.all([
        circulationAPI.getStats(),
        circulationAPI.getAllCheckouts(),
      ]);
      setStats(statsRes.data);
      setAllCheckouts(checkoutsRes.data.checkouts);
    } catch (err) {
      setMessage({ text: getErrorMessage(err), type: 'error' });
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">
          <h3>Error loading dashboard</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user.firstName}!</h1>
        <p>Manage library operations and circulation</p>
      </div>

      {/* Library Stats */}
      <div className="stats-grid">
        <div className="stat-card info">
          <div className="stat-icon"><GiSpellBook size={36} /></div>
          <div className="stat-content">
            <h3>{stats.totalBooks}</h3>
            <p>Total Books</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon"><GiWhiteBook size={36} /></div>
          <div className="stat-content">
            <h3>{stats.availableBooks}</h3>
            <p>Available Copies</p>
          </div>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon"><GiWhiteBook size={36} /></div>
          <div className="stat-content">
            <h3>{stats.activeCheckouts}</h3>
            <p>Active Checkouts</p>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon"><FaHourglass size={36} /></div>
          <div className="stat-content">
            <h3>{stats.overdueBooks || 0}</h3>
            <p>Overdue Books</p>
          </div>
        </div>

        <Link to="/admin/members" className="stat-card-link">
          <div className="stat-card light">
            <div className="stat-icon"><FaUserFriends size={36} /></div>
            <div className="stat-content">
              <h3>{stats.totalMembers}</h3>
              <p>Total Members</p>
            </div>
          </div>
        </Link>

        <div className="stat-card success">
          <div className="stat-icon"><GiSpellBook size={36} /></div>
          <div className="stat-content">
            <h3>{stats.totalCopies}</h3>
            <p>Total Copies</p>
          </div>
        </div>
      </div>

      {/* Circulation Forms */}
      <div className="forms-grid">
        <div className="dashboard-section">
          <h2>Checkout Book</h2>
          {message.type && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}
          <form onSubmit={handleCheckout} className="circulation-form">
            <input
              type="number"
              placeholder="User ID"
              value={checkoutForm.userId}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, userId: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Book Item ID"
              value={checkoutForm.bookItemId}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, bookItemId: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary">Checkout</button>
          </form>
        </div>

        <div className="dashboard-section">
          <h2>Return Book</h2>
          <form onSubmit={handleReturn} className="circulation-form">
            <input
              type="number"
              placeholder="Book Item ID"
              value={returnForm.bookItemId}
              onChange={(e) => setReturnForm({ bookItemId: e.target.value })}
              required
            />
            <button type="submit" className="btn-secondary">Return</button>
          </form>
        </div>
      </div>

      {/* Active Checkouts */}
      <div className="dashboard-section checkouts-section">
        <div className="checkouts-header">
          <h2>Active Checkouts</h2>
          <div className="search-filter-container">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by book, member, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button 
                className="filter-toggle-btn"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter & Sort"
              >
                <FaFilter />
              </button>
            </div>

            {showFilterDropdown && (
              <div className="filter-dropdown" ref={filterDropdownRef}>
                <div className="filter-section">
                  <h4>Filter</h4>
                  <div className="filter-options">
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="filter"
                        value="all"
                        checked={filterStatus === 'all'}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      />
                      <span>All Checkouts</span>
                    </label>
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="filter"
                        value="active"
                        checked={filterStatus === 'active'}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      />
                      <span>Active Only</span>
                    </label>
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="filter"
                        value="overdue"
                        checked={filterStatus === 'overdue'}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      />
                      <span>Overdue Only</span>
                    </label>
                  </div>
                </div>

                <div className="filter-section">
                  <h4>Sort By</h4>
                  <div className="filter-options">
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="sortBy"
                        value="dueDate"
                        checked={sortBy === 'dueDate'}
                        onChange={(e) => setSortBy(e.target.value)}
                      />
                      <span>Due Date</span>
                    </label>
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="sortBy"
                        value="daysRemaining"
                        checked={sortBy === 'daysRemaining'}
                        onChange={(e) => setSortBy(e.target.value)}
                      />
                      <span>Days Remaining</span>
                    </label>
                  </div>
                  <div className="sort-order-buttons">
                    <button
                      className={`sort-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                      onClick={() => setSortOrder('asc')}
                    >
                      Ascending
                    </button>
                    <button
                      className={`sort-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                      onClick={() => setSortOrder('desc')}
                    >
                      Descending
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {displayedCheckouts.length === 0 ? (
          <p className="empty-message">
            {allCheckouts.length === 0 ? 'No active checkouts' : 'No checkouts match your filters'}
          </p>
        ) : (
          <div 
            className="checkouts-list-container"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            <div className="checkouts-list">
              {displayedCheckouts.slice(0, visibleCount).map((checkout) => (
                <div 
                  key={checkout.transaction_id} 
                  className={`checkout-row ${isOverdue(checkout.due_date) ? 'overdue' : 'active'}`}
                >
                  <div className="checkout-col book-col">
                    <img 
                      src={checkout.cover_url || 'https://via.placeholder.com/50x75?text=No+Cover'} 
                      alt={checkout.title}
                      className="checkout-book-cover"
                    />
                    <div className="checkout-book-info">
                      <strong>{checkout.title}</strong>
                      <p>by {checkout.author}</p>
                      <small>{checkout.barcode}</small>
                    </div>
                  </div>
                  <div className="checkout-col member-col">
                    <img 
                      src={checkout.avatar_url || `https://ui-avatars.com/api/?name=${checkout.first_name}+${checkout.last_name}&background=667eea&color=fff&size=128`}
                      alt={`${checkout.first_name} ${checkout.last_name}`}
                      className="checkout-member-avatar"
                    />
                    <div className="checkout-member-info">
                      <strong>{checkout.first_name} {checkout.last_name}</strong>
                      <small>{checkout.email}</small>
                    </div>
                  </div>
                  <div className="checkout-col dates-col">
                    <div><strong>Checkout:</strong> {formatDate(checkout.checkout_date)}</div>
                    <div><strong>Due:</strong> {formatDate(checkout.due_date)}</div>
                    <div className="days-remaining">
                      <strong>Days:</strong> 
                      <span className={getDaysUntilDue(checkout.due_date) < 0 ? 'overdue-days' : 'remaining-days'}>
                        {getDaysUntilDue(checkout.due_date) < 0 
                          ? `${Math.abs(getDaysUntilDue(checkout.due_date))} overdue` 
                          : `${getDaysUntilDue(checkout.due_date)} left`}
                      </span>
                    </div>
                  </div>
                  <div className="checkout-col status-col">
                    {isOverdue(checkout.due_date) ? (
                      <span className="status-badge overdue">OVERDUE</span>
                    ) : (
                      <span className="status-badge active">Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < displayedCheckouts.length && (
              <div className="loading-more">Scroll for more...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianDashboard;