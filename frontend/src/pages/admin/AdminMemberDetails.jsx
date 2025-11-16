import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI, circulationAPI } from '../../services/api';
import { FaArrowLeft, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaDollarSign, FaBook } from 'react-icons/fa';
import './AdminMemberDetails.css';

export default function AdminMemberDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const getAvatarUrl = (avatarUrl) => {
    if (avatarUrl) {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      return apiUrl.replace('/api', '') + avatarUrl;
    }
    return null;
  };

  const handleReturn = async (bookItemId) => {
    setReturning(bookItemId);
    setMessage({ text: '', type: '' });
    try {
      await circulationAPI.return({ bookItemId });
      setMessage({ text: 'Book returned successfully!', type: 'success' });
      // Reload data
      const res = await adminAPI.getMember(id);
      setData(res.data);
    } catch (error) {
      setMessage({ text: error.response?.data?.error || 'Return failed', type: 'error' });
    } finally {
      setReturning(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await adminAPI.getMember(id);
        if (mounted) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="loading-spinner">Loading member details...</div>;
  if (!data) return <div className="error-message">Member not found</div>;

  const { user, transactions, fines } = data;
  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  return (
    <div className="admin-member-details">
      <Link to="/admin/members" className="back-link">
        <FaArrowLeft /> Back to Members
      </Link>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="member-profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {getAvatarUrl(user.avatar_url) ? (
              <img src={getAvatarUrl(user.avatar_url)} alt={`${user.first_name} ${user.last_name}`} />
            ) : (
              <div className="avatar-initials">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{user.first_name} {user.last_name}</h1>
            <div className="contact-info">
              <div className="info-item">
                <FaEnvelope /> {user.email}
              </div>
              {user.phone && (
                <div className="info-item">
                  <FaPhone /> {user.phone}
                </div>
              )}
              {user.address && (
                <div className="info-item">
                  <FaMapMarkerAlt /> {user.address}
                </div>
              )}
              <div className="info-item">
                <FaCalendar /> Joined {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-box">
            <div className="stat-value">{transactions.filter(t => t.status === 'ACTIVE').length}</div>
            <div className="stat-label">Active Books</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{transactions.filter(t => t.status === 'ACTIVE' && isOverdue(t.due_date)).length}</div>
            <div className="stat-label">Overdue</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">${fines.filter(f => !f.paid).reduce((sum, f) => sum + parseFloat(f.amount), 0).toFixed(2)}</div>
            <div className="stat-label">Unpaid Fines</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{transactions.length}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
        </div>
      </div>

      <div className="details-grid">
        <div className="transactions-section">
          <h2><FaBook /> All Transactions</h2>
          {transactions.length === 0 ? (
            <div className="empty-message">No transactions found</div>
          ) : (
            <div className="transactions-list">
              {transactions.map(t => {
                const coverUrl = t.cover_url || t.cover_image_url;
                return (
                <div key={t.transaction_id} className={`transaction-card ${t.status.toLowerCase()}`}>
                  <div className="transaction-left">
                    {coverUrl && (
                      <div className="book-cover">
                        <img src={coverUrl} alt={t.title} />
                      </div>
                    )}
                    <div className="book-info">
                      <h3>{t.title}</h3>
                      <p className="author">{t.author}</p>
                      <p className="barcode">Barcode: {t.barcode}</p>
                    </div>
                  </div>
                  <div className="transaction-right">
                    <div className="transaction-meta">
                      <div className="meta-item">
                        <span className="meta-label">Checkout:</span>
                        <span className="meta-value">{new Date(t.checkout_date).toLocaleDateString()}</span>
                      </div>
                      {t.due_date && (
                        <div className="meta-item">
                          <span className="meta-label">Due:</span>
                          <span className={`meta-value ${isOverdue(t.due_date) ? 'overdue-text' : ''}`}>
                            {new Date(t.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {t.return_date && (
                        <div className="meta-item">
                          <span className="meta-label">Returned:</span>
                          <span className="meta-value">{new Date(t.return_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="transaction-status-actions">
                      <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span>
                      {t.status === 'ACTIVE' && (
                        <button
                          className="btn-return"
                          onClick={() => handleReturn(t.book_item_id)}
                          disabled={returning === t.book_item_id}
                        >
                          {returning === t.book_item_id ? 'Returning...' : 'Return'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        <div className="fines-section">
          <h2><FaDollarSign /> Fines</h2>
          {fines.length === 0 ? (
            <div className="empty-message">No fines</div>
          ) : (
            <div className="fines-list">
              {fines.map(f => (
                <div key={f.fine_id} className={`fine-card ${f.paid ? 'paid' : 'unpaid'}`}>
                  <div className="fine-amount">${parseFloat(f.amount).toFixed(2)}</div>
                  <div className="fine-details">
                    <div className="fine-status">
                      <span className={`status-badge ${f.paid ? 'paid' : 'unpaid'}`}>
                        {f.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    {f.note && <p className="fine-note">{f.note}</p>}
                    <p className="fine-date">
                      {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
