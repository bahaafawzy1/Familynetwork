import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function Dashboard() {
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/'; return; }
    axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setMe(r.data.user))
      .catch(() => window.location.href = '/');
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'Inter, system-ui' }}>
      <h2>Admin Dashboard (MVP)</h2>
      <pre>{JSON.stringify(me, null, 2)}</pre>
    </div>
  );
}