import React, { useEffect, useState } from 'react';
import { requestsAPI } from '../services/api';

const RequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await requestsAPI.listForAdmin();
      setRequests(res.data.requests);
    } catch (err) {
      console.error('Error loading requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      await requestsAPI.update(id, { status: action });
      load();
    } catch (err) {
      console.error('Request action failed', err);
    }
  };

  if (loading) return <div>Loading requests...</div>;
  if (requests.length === 0) return <p className="empty-message">No requests</p>;

  return (
    <div>
      {requests.map(r => (
        <div key={r.request_id} className="book-item">
          <div className="book-details">
            <h3>{r.title}</h3>
            <p className="author">Requested by {r.first_name} {r.last_name} ({r.email})</p>
            <div className="barcode">Requested at {new Date(r.created_at).toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => handleAction(r.request_id, 'APPROVED')}>Approve</button>
            <button className="btn-primary" onClick={() => handleAction(r.request_id, 'DENIED')}>Deny</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestsPanel;
