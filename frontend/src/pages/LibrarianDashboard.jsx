import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import { selectUser } from '../store/slices/authSlice';
import { circulationAPI } from '../services/api';
import { GiSpellBook, GiWhiteBook } from 'react-icons/gi';
import { FaUserFriends, FaHourglass } from "react-icons/fa";
import './Dashboard.css';

const LibrarianDashboard = () => {
  const user = useSelector(selectUser);
  const [stats, setStats] = useState(null);
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutForm, setCheckoutForm] = useState({ userId: '', bookItemId: '' });
  const [returnForm, setReturnForm] = useState({ bookItemId: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, checkoutsRes] = await Promise.all([
        circulationAPI.getStats(),
        circulationAPI.getAllCheckouts(),
      ]);

      setStats(statsRes.data);
      setCheckouts(checkoutsRes.data.checkouts);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      await circulationAPI.checkout(checkoutForm);
      setMessage({ text: 'Book checked out successfully!', type: 'success' });
      setCheckoutForm({ userId: '', bookItemId: '' });
      loadDashboardData();
    } catch (error) {
      setMessage({ text: error.response?.data?.error || 'Checkout failed', type: 'error' });
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      await circulationAPI.return(returnForm);
      setMessage({ text: 'Book returned successfully!', type: 'success' });
      setReturnForm({ bookItemId: '' });
      loadDashboardData();
    } catch (error) {
      setMessage({ text: error.response?.data?.error || 'Return failed', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Librarian Dashboard</h1>
        <p>Welcome, {user.firstName}! Manage library operations</p>
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
      <div className="dashboard-section">
        <h2>Active Checkouts</h2>
        {checkouts.length === 0 ? (
          <p className="empty-message">No active checkouts</p>
        ) : (
          <div className="table-container">
            <table className="checkouts-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Barcode</th>
                  <th>Checkout Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {checkouts.map((checkout) => (
                  <tr key={checkout.transaction_id} className={isOverdue(checkout.due_date) ? 'overdue-row' : ''}>
                    <td>
                      <strong>{checkout.first_name} {checkout.last_name}</strong>
                      <br />
                      <small>{checkout.email}</small>
                    </td>
                    <td>
                      <strong>{checkout.title}</strong>
                      <br />
                      <small>by {checkout.author}</small>
                    </td>
                    <td>{checkout.barcode}</td>
                    <td>{formatDate(checkout.checkout_date)}</td>
                    <td>{formatDate(checkout.due_date)}</td>
                    <td>
                      {isOverdue(checkout.due_date) ? (
                        <span className="status-badge overdue">OVERDUE</span>
                      ) : (
                        <span className="status-badge active">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianDashboard;
