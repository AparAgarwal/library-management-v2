import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { FaSearch, FaUser } from 'react-icons/fa';
import './AdminMembers.css';

export default function AdminMembers() {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [members, setMembers] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const getAvatarUrl = (avatarUrl) => {
        if (avatarUrl) {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            return apiUrl.replace('/api', '') + avatarUrl;
        }
        return null;
    };

    const fetchMembers = React.useCallback(async (signal) => {
        setLoading(true);
        try {
            const res = await adminAPI.listMembers({ q: query, page, limit: 25, signal });
            setMembers(res.data.members);
            setTotalPages(res.data.pagination.totalPages || 1);
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err);
        } finally {
            setLoading(false);
        }
    }, [query, page]);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            fetchMembers(controller.signal);
        }, 300); // debounce

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [fetchMembers]);

    return (
        <div className="admin-members-page">
            <div className="page-header">
                <h1><FaUser /> Library Members</h1>
                <p>Manage member accounts and view member statistics</p>
            </div>

            <div className="search-section">
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder="Search by name, email or ID..."
                        className="search-input"
                    />
                </div>
            </div>

            {loading && <div className="loading-spinner">Loading members...</div>}

            {!loading && members.length === 0 && (
                <div className="empty-state">
                    <FaUser size={48} />
                    <p>No members found</p>
                </div>
            )}

            <div className="members-grid">
                {members.map((m) => (
                    <Link to={`/admin/members/${m.user_id}`} key={m.user_id} className="member-card">
                        <div className="member-header">
                            <div className="member-avatar">
                                {getAvatarUrl(m.avatar_url) ? (
                                    <img src={getAvatarUrl(m.avatar_url)} alt={`${m.first_name} ${m.last_name}`} className="avatar-img" />
                                ) : (
                                    <>{m.first_name?.[0]}{m.last_name?.[0]}</>
                                )}
                            </div>
                            <div className="member-info">
                                <h3>{m.first_name} {m.last_name}</h3>
                                <p className="member-email">{m.email}</p>
                                <p className="member-id">ID: {m.user_id}</p>
                            </div>
                        </div>
                        <div className="member-stats">
                            <div className="stat-item">
                                <span className="stat-label">Active Books:</span>
                                <span className="stat-value">{m.active_books}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Unpaid Fines:</span>
                                <span className={`stat-value ${m.total_unpaid_fines > 0 ? 'has-fines' : ''}`}>
                                    ${parseFloat(m.total_unpaid_fines).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="pagination">
                <button
                    className="pagination-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                >
                    Previous
                </button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button
                    className="pagination-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
