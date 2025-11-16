import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';

export default function AdminMemberDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading member...</div>;
  if (!data) return <div>Member not found</div>;

  const { user, transactions, fines } = data;

  return (
    <div>
      <Link to="/admin/members">← Back to members</Link>
      <h2>{user.first_name} {user.last_name} <small>({user.email})</small></h2>
      <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <h3>Profile</h3>
          <div>ID: {user.user_id}</div>
          <div>Joined: {new Date(user.created_at).toLocaleString()}</div>
          <div>Phone: {user.phone || '—'}</div>
          <div>Address: {user.address || '—'}</div>
        </div>
        <div style={{ width: 320 }}>
          <h3>Latest Fines</h3>
          {fines.length === 0 ? <div>No fines</div> : (
            fines.map(f => (
              <div key={f.fine_id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                <div>Amount: ${f.amount}</div>
                <div>Status: {f.paid ? 'Paid' : 'Unpaid'}</div>
                <div>{f.note}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Recent Transactions</h3>
        {transactions.length === 0 ? <div>No transactions</div> : (
          transactions.map(t => (
            <div key={t.transaction_id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
              <div><strong>{t.title}</strong> — {t.barcode}</div>
              <div>Checkout: {new Date(t.checkout_date).toLocaleDateString()}</div>
              <div>Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</div>
              <div>Status: {t.status}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
