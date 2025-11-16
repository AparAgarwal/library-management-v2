import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { usersAPI } from '../../services/api';
import { formatDate, getDaysUntilDue, formatCurrency, getErrorMessage } from '../../utils/helpers';
import { GiSpellBook } from 'react-icons/gi';
import { FaDollarSign, FaHourglass } from 'react-icons/fa';
import '../Dashboard.css';

const MemberDashboard = () => {
  const user = useSelector(selectUser);
  const [stats, setStats] = useState(null);
  const [myBooks, setMyBooks] = useState([]);
  const [fines, setFines] = useState({ fines: [], totalUnpaid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const [statsRes, booksRes, finesRes] = await Promise.all([
          usersAPI.getDashboardStats(),
          usersAPI.getMyBooks(),
          usersAPI.getFines(),
        ]);

        if (isMounted) {
          setStats(statsRes.data);
          setMyBooks(booksRes.data.transactions);
          setFines(finesRes.data);
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
        <p>Manage your borrowed books and library account</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card light">
          <div className="stat-icon"><GiSpellBook size={36} /></div>
          <div className="stat-content">
            <h3>{stats.activeBooks}</h3>
            <p>Books Checked Out</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon"><FaHourglass size={36} /></div>
          <div className="stat-content">
            <h3>{stats.overdueBooks}</h3>
            <p>Overdue Books</p>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon"><FaDollarSign size={36} /></div>
          <div className="stat-content">
            <h3>{fines.totalUnpaid}</h3>
            <p>Outstanding Fines</p>
          </div>
        </div>
      </div>

      {/* Currently Borrowed Books */}
      <div className="dashboard-section">
        <h2>Currently Borrowed Books</h2>
        {myBooks.length === 0 ? (
          <p className="empty-message">You haven't checked out any books yet.</p>
        ) : (
          <div className="books-list">
            {myBooks.map((transaction) => {
              const daysUntilDue = getDaysUntilDue(transaction.due_date);
              const isOverdue = daysUntilDue < 0;
              
              return (
                <div key={transaction.transaction_id} className="book-item">
                  {transaction.cover_url && (
                    <img src={transaction.cover_url} alt={transaction.title} />
                  )}
                  <div className="book-details">
                    <h3>{transaction.title}</h3>
                    <p className="author">by {transaction.author}</p>
                    <p className="barcode">Barcode: {transaction.barcode}</p>
                    <p className="checkout-date">
                      Checked out: {formatDate(transaction.checkout_date)}
                    </p>
                    <p className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                      Due: {formatDate(transaction.due_date)}
                      {isOverdue ? ` (${Math.abs(daysUntilDue)} days overdue)` : ` (${daysUntilDue} days remaining)`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fines Section */}
      {fines.fines.length > 0 && (
        <div className="dashboard-section">
          <h2>Outstanding Fines</h2>
          <div className="fines-list">
            {fines.fines.filter(f => !f.paid).map((fine) => (
              <div key={fine.fine_id} className="fine-item">
                <div>
                  <strong>{fine.title}</strong> by {fine.author}
                  <p className="fine-date">
                    Fine issued: {formatDate(fine.created_at)}
                  </p>
                </div>
                <div className="fine-amount">{formatCurrency(fine.amount)}</div>
              </div>
            ))}
          </div>
          <div className="fine-total">
            <strong>Total Unpaid: {formatCurrency(fines.totalUnpaid)}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;