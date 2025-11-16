import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';

export default function AdminMembers() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

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
    <div>
      <h2>Members</h2>
      <div style={{ marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search by name, email or id"
          style={{ padding: 8, width: '100%', maxWidth: 480 }}
        />
      </div>

      {loading && <div>Loading...</div>}

      <div>
        {members.map((m) => (
          <Link to={`/admin/members/${m.user_id}`} key={m.user_id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ borderBottom: '1px solid #eee', padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{m.first_name} {m.last_name}</strong> <small>({m.email})</small>
                  <div style={{ fontSize: 12, color: '#666' }}>ID: {m.user_id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Active books: {m.active_books}</div>
                  <div>Unpaid fines: ${m.total_unpaid_fines}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span style={{ margin: '0 8px' }}>Page {page} / {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
      </div>
    </div>
  );
}
