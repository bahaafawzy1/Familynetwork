import React, { useEffect, useState } from 'react';
import { api } from '../api';

export function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    api.get('/me').then(r => setMe(r.data.user)).catch(() => (window.location.href = '/'));
    api.get('/admin/verification/documents?status=PENDING').then(r => setDocs(r.data.items));
    api.get('/support').then(r => setTickets(r.data.items)).catch(() => {});
  }, []);

  const approve = async (id: string) => {
    await api.post('/verification/document/status', { documentId: id, status: 'APPROVED' });
    setDocs(prev => prev.filter(d => d.id !== id));
  };
  const reject = async (id: string) => {
    await api.post('/verification/document/status', { documentId: id, status: 'REJECTED' });
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', fontFamily: 'Inter, system-ui' }}>
      <h2>Admin Dashboard</h2>
      <h3>Me</h3>
      <pre>{JSON.stringify(me, null, 2)}</pre>

      <h3>Pending Documents</h3>
      <ul>
        {docs.map(d => (
          <li key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>{d.type}</span>
            <a href={d.url} target="_blank">view</a>
            <button onClick={() => approve(d.id)}>Approve</button>
            <button onClick={() => reject(d.id)}>Reject</button>
          </li>
        ))}
      </ul>

      <h3>Support Tickets</h3>
      <ul>
        {tickets.map(t => (
          <li key={t.id}>{t.subject} - {t.status}</li>
        ))}
      </ul>
    </div>
  );
}